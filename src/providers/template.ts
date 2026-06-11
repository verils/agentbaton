import type { ProviderTemplate } from "../types";
import { bailian } from "./bailian";
import { deepseek } from "./deepseek";
import { minimax } from "./minimax";
import { moonshot } from "./moonshot";
import { tencent } from "./tencent";
import { volcengine } from "./volcengine";
import { xiaomiMimo } from "./xiaomi-mimo";
import { zhipu } from "./zhipu";

export const providerTemplates: ProviderTemplate[] = [
  bailian,
  deepseek,
  minimax,
  moonshot,
  tencent,
  volcengine,
  xiaomiMimo,
  zhipu,
];

export function findProviderTemplate(providerTemplateId: string) {
  return providerTemplates.find(t => t.id === providerTemplateId) !!
}
