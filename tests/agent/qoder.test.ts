import { defineSyncAgentTests } from './define-sync-agent-tests';
import { qoder } from '../../src/agent/qoder';

defineSyncAgentTests({
  agent: qoder,
  expectedId: 'qoder',
  expectedName: 'Qoder',
  expectedCommand: 'qoder',
  expectedApiType: 'openai',
});
