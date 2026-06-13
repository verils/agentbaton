import { defineSyncAgentTests } from './define-sync-agent-tests';
import { opencode } from '../../src/agent/opencode';

defineSyncAgentTests({
  agent: opencode,
  expectedId: 'opencode',
  expectedName: 'OpenCode',
  expectedCommand: 'opencode',
  expectedApiType: 'openai',
});
