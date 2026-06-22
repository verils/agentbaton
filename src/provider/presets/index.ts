import type {ProviderPreset} from "../../types/index.js";
import {bailian} from "./bailian.js";
import {deepseek} from "./deepseek.js";
import {xiaomiMimo} from "./xiaomi-mimo.js";
import {volcengine} from "./volcengine.js";
import { moonshot } from "./moonshot.js";

export const providerPresets: ProviderPreset[] = [
  bailian,
  deepseek,
  // minimax,
  moonshot,
  // tencent,
  volcengine,
  xiaomiMimo,
  // zhipu,
];

export function findProviderPreset(providerPresetId: string) {
  return providerPresets.find(t => t.id === providerPresetId) !
}
