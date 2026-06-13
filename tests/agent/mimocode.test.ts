import { defineSyncAgentTests } from './define-sync-agent-tests';
import { mimoCode } from '../../src/agent/mimocode';

defineSyncAgentTests({
  agent: mimoCode,
  expectedId: 'mimocode',
  expectedName: 'MiMoCode',
  expectedCommand: 'mimo',
  expectedApiType: 'openai',
});
