import type { ProviderDefinition } from '../../types/provider.js';
import { bailian } from './bailian.js';
import { deepseek } from './deepseek.js';
import { minimax } from './minimax.js';
import { moonshot } from './moonshot.js';
import { tencent } from './tencent.js';
import { volcengine } from './volcengine.js';
import { xiaomiMimo } from './xiaomi-mimo.js';
import { zhipu } from './zhipu.js';

export const builtinProviders: ProviderDefinition[] = [
  bailian,
  deepseek,
  minimax,
  moonshot,
  tencent,
  volcengine,
  xiaomiMimo,
  zhipu,
];
