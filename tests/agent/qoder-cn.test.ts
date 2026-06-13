import { defineSyncAgentTests } from './define-sync-agent-tests';
import { qoderCn } from '../../src/agent/qoder-cn';

defineSyncAgentTests({
  agent: qoderCn,
  expectedId: 'qoder-cn',
  expectedName: 'Qoder CN',
  expectedCommand: 'qoder-cn',
  expectedApiType: 'openai',
});
