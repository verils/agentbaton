import { defineSyncAgentTests } from './define-sync-agent-tests';
import { qwenCode } from '../../src/agent/qwen-code';

defineSyncAgentTests({
  agent: qwenCode,
  expectedId: 'qwen-code',
  expectedName: 'Qwen Code',
  expectedCommand: 'qwen',
  expectedApiType: 'openai',
});
