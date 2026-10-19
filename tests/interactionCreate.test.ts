import { describe, it, expect, vi } from 'vitest';
import { handleInteractionCreate } from '../src/events/interactionCreate.js';
import * as askCmd from '../src/commands/ask.js';
import * as resetCmd from '../src/commands/reset.js';
import * as afkCmd from '../src/commands/afk.js';
import * as helpCmd from '../src/commands/help.js';
import * as aboutCmd from '../src/commands/about.js';

describe('interactionCreate Handler', () => {
  it('ignores non-chat-input interactions', async () => {
    const mockInteraction: any = {
      isChatInputCommand: vi.fn().mockReturnValue(false),
    };

    await handleInteractionCreate(mockInteraction);
    expect(mockInteraction.isChatInputCommand).toHaveBeenCalled();
  });

  it('routes "help" command to handleHelpCommand', async () => {
    const spy = vi.spyOn(helpCmd, 'handleHelpCommand').mockResolvedValue(undefined);
    const mockInteraction: any = {
      isChatInputCommand: vi.fn().mockReturnValue(true),
      commandName: 'help',
    };

    await handleInteractionCreate(mockInteraction);
    expect(spy).toHaveBeenCalledWith(mockInteraction);
  });

  it('routes "about" command to handleAboutCommand', async () => {
    const spy = vi.spyOn(aboutCmd, 'handleAboutCommand').mockResolvedValue(undefined);
    const mockInteraction: any = {
      isChatInputCommand: vi.fn().mockReturnValue(true),
      commandName: 'about',
    };

    await handleInteractionCreate(mockInteraction);
    expect(spy).toHaveBeenCalledWith(mockInteraction);
  });

  it('routes "ask", "reset", "afk", and "unafk" commands correctly', async () => {
    const askSpy = vi.spyOn(askCmd, 'handleAskCommand').mockResolvedValue(undefined);
    const resetSpy = vi.spyOn(resetCmd, 'handleResetCommand').mockResolvedValue(undefined);
    const afkSpy = vi.spyOn(afkCmd, 'handleAfkCommand').mockResolvedValue(undefined);
    const unafkSpy = vi.spyOn(afkCmd, 'handleUnafkCommand').mockResolvedValue(undefined);

    await handleInteractionCreate({ isChatInputCommand: () => true, commandName: 'ask' } as any);
    expect(askSpy).toHaveBeenCalled();

    await handleInteractionCreate({ isChatInputCommand: () => true, commandName: 'reset' } as any);
    expect(resetSpy).toHaveBeenCalled();

    await handleInteractionCreate({ isChatInputCommand: () => true, commandName: 'afk' } as any);
    expect(afkSpy).toHaveBeenCalled();

    await handleInteractionCreate({ isChatInputCommand: () => true, commandName: 'unafk' } as any);
    expect(unafkSpy).toHaveBeenCalled();
  });
});
