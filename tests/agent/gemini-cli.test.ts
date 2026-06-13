import { defineSyncAgentTests } from './define-sync-agent-tests';
import { geminiCli } from '../../src/agent/gemini-cli';

defineSyncAgentTests({
  agent: geminiCli,
  expectedId: 'gemini-cli',
  expectedName: 'Gemini CLI',
  expectedCommand: 'gemini',
  expectedApiType: 'google',
});
