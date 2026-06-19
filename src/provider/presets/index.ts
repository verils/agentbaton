import type {ProviderPreset} from "../../types";
import {bailian} from "./bailian";
import {deepseek} from "./deepseek";
import {xiaomiMimo} from "./xiaomi-mimo";
import {volcengine} from "./volcengine";

export const providerPresets: ProviderPreset[] = [
  bailian,
  deepseek,
  // minimax,
  // moonshot,
  // tencent,
  volcengine,
  xiaomiMimo,
  // zhipu,
];

export function findProviderPreset(providerPresetId: string) {
  return providerPresets.find(t => t.id === providerPresetId) !
}
