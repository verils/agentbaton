import { defineSyncAgentTests } from './define-sync-agent-tests';
import { codexCli } from '../../src/agent/codex-cli';

defineSyncAgentTests({
  agent: codexCli,
  expectedId: 'codex-cli',
  expectedName: 'Codex CLI',
  expectedCommand: 'codex',
  expectedApiType: 'openai',
});
