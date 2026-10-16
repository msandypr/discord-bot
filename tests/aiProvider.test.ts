import { describe, it, expect, vi } from 'vitest';
import {
  createAIProvider,
  AIService,
  GeminiProvider,
  OpenAICompatibleProvider,
} from '../src/services/ai/index.js';
import { Config } from '../src/config.js';

describe('AI Provider Factory & Selection', () => {
  const baseConfig: Config = {
    discordToken: 'token',
    applicationId: 'appId',
    databasePath: 'data/test.sqlite',
    aiProvider: 'auto',
    geminiApiKey: '',
    geminiModel: 'gemini-2.5-flash',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
  };

  it('selects GeminiProvider when GEMINI_API_KEY is present in auto mode', () => {
    const cfg: Config = { ...baseConfig, geminiApiKey: 'gemini-key-123' };
    const provider = createAIProvider(cfg);
    expect(provider).toBeInstanceOf(GeminiProvider);
    expect(provider.name).toBe('Google Gemini');
  });

  it('selects OpenAICompatibleProvider when OPENAI_API_KEY is present and Gemini is empty', () => {
    const cfg: Config = { ...baseConfig, openaiApiKey: 'sk-12345' };
    const provider = createAIProvider(cfg);
    expect(provider).toBeInstanceOf(OpenAICompatibleProvider);
    expect(provider.name).toBe('OpenAI');
  });

  it('selects OpenAICompatibleProvider when OPENAI_BASE_URL is set (e.g. Ollama)', () => {
    const cfg: Config = { ...baseConfig, openaiBaseUrl: 'http://localhost:11434/v1' };
    const provider = createAIProvider(cfg);
    expect(provider).toBeInstanceOf(OpenAICompatibleProvider);
    expect(provider.name).toBe('Local LLM (Ollama/LM Studio)');
  });

  it('identifies custom provider names based on baseURL', () => {
    const groq = new OpenAICompatibleProvider('key', 'https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile');
    expect(groq.name).toBe('Groq');

    const deepseek = new OpenAICompatibleProvider('key', 'https://api.deepseek.com/v1', 'deepseek-chat');
    expect(deepseek.name).toBe('DeepSeek');

    const openrouter = new OpenAICompatibleProvider('key', 'https://openrouter.ai/api/v1', 'auto');
    expect(openrouter.name).toBe('OpenRouter');

    const dahl = new OpenAICompatibleProvider('key', 'https://inference.dahl.global/v1', 'MiniMaxAI/MiniMax-M2.7');
    expect(dahl.name).toBe('Dahl Inference');
  });

  it('respects explicit AI_PROVIDER=openai even if GEMINI_API_KEY is also present', () => {
    const cfg: Config = {
      ...baseConfig,
      aiProvider: 'openai',
      geminiApiKey: 'gemini-key',
      openaiApiKey: 'sk-key',
    };
    const provider = createAIProvider(cfg);
    expect(provider).toBeInstanceOf(OpenAICompatibleProvider);
  });

  it('defaults to llama-3.1-8b-instant and temperature 0.7 for OpenAICompatibleProvider', () => {
    const provider = new OpenAICompatibleProvider('sk-key');
    expect(provider.model).toBe('llama-3.1-8b-instant');
    expect(provider.temperature).toBe(0.7);
  });

  it('automatically sets baseURL to Groq when apiKey starts with gsk_ without explicit baseURL', () => {
    const provider = new OpenAICompatibleProvider('gsk_test123456');
    expect(provider.name).toBe('Groq');
  });
});

describe('OpenAICompatibleProvider Response & Error Handling', () => {
  it('returns warning when neither API key nor baseURL is configured', async () => {
    const provider = new OpenAICompatibleProvider('', undefined);
    const response = await provider.generateResponse('Halo!');
    expect(response).toContain('OPENAI_API_KEY');
  });

  it('handles successful chat completion from client mock', async () => {
    const provider = new OpenAICompatibleProvider('test-key', 'https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile');

    // Mock client internal create
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'Halo dari Groq Llama 3!' } }],
    });
    (provider as any).client = {
      chat: { completions: { create: mockCreate } },
    };

    const response = await provider.generateResponse('Halo!', 'Alice');
    expect(response).toBe('Halo dari Groq Llama 3!');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('handles ECONNREFUSED connection failure (e.g. offline Ollama)', async () => {
    const provider = new OpenAICompatibleProvider('ollama', 'http://localhost:11434/v1', 'llama3.2');

    const mockCreate = vi.fn().mockRejectedValue(new Error('fetch failed: connect ECONNREFUSED 127.0.0.1:11434'));
    (provider as any).client = {
      chat: { completions: { create: mockCreate } },
    };

    const response = await provider.generateResponse('Halo!');
    expect(response).toBe('Maaf bro, gue lagi sibuk');
  });

  it('handles 401 invalid API key error', async () => {
    const provider = new OpenAICompatibleProvider('invalid-key', 'https://api.deepseek.com/v1', 'deepseek-chat');

    const authError = new Error('Incorrect API key provided');
    (authError as any).status = 401;
    const mockCreate = vi.fn().mockRejectedValue(authError);
    (provider as any).client = {
      chat: { completions: { create: mockCreate } },
    };

    const response = await provider.generateResponse('Test');
    expect(response).toBe('Maaf bro, gue lagi sibuk');
  });

  it('handles 402 token exhaustion error (e.g. Dahl Inference)', async () => {
    const provider = new OpenAICompatibleProvider('valid-key', 'https://inference.dahl.global/v1', 'MiniMaxAI/MiniMax-M2.7');

    const paymentError = new Error('available tokens exhausted');
    (paymentError as any).status = 402;
    const mockCreate = vi.fn().mockRejectedValue(paymentError);
    (provider as any).client = {
      chat: { completions: { create: mockCreate } },
    };

    const response = await provider.generateResponse('Test');
    expect(response).toBe('Maaf bro, gue lagi sibuk');
  });
});

describe('Unified AIService', () => {
  it('delegates askAI to the active provider with empty history when userId is omitted', async () => {
    const mockProvider = {
      name: 'MockProvider',
      model: 'mock-1',
      generateResponse: vi.fn().mockResolvedValue('Balasan dari Mock AI'),
    };

    const service = new AIService(mockProvider);
    const result = await service.askAI('Tes pertanyaan', 'Bob');

    expect(result).toBe('Balasan dari Mock AI');
    expect(mockProvider.generateResponse).toHaveBeenCalledWith('Tes pertanyaan', 'Bob', [], undefined);
  });

  it('manages conversation history per userId across multiple turns', async () => {
    const mockProvider = {
      name: 'MockProvider',
      model: 'mock-1',
      generateResponse: vi
        .fn()
        .mockResolvedValueOnce('Jawaban turn 1')
        .mockResolvedValueOnce('Jawaban turn 2'),
    };

    const service = new AIService(mockProvider);
    const testUserId = 'user-context-test';

    // Turn 1
    const res1 = await service.askAI('Siapa kamu?', 'Alice', testUserId);
    expect(res1).toBe('Jawaban turn 1');
    expect(mockProvider.generateResponse).toHaveBeenNthCalledWith(1, 'Siapa kamu?', 'Alice', [], testUserId);

    // Turn 2
    const res2 = await service.askAI('Apa yang baru saya tanyakan?', 'Alice', testUserId);
    expect(res2).toBe('Jawaban turn 2');
    expect(mockProvider.generateResponse).toHaveBeenNthCalledWith(2, 'Apa yang baru saya tanyakan?', 'Alice', [
      { role: 'user', content: 'Siapa kamu?' },
      { role: 'assistant', content: 'Jawaban turn 1' },
    ], testUserId);
  });
});
