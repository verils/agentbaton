import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from '../components/SelectMenu.js';
import { TextInput } from '../components/TextInput.js';
import type { AgentBatonConfig, AgentDefinition, AgentModel } from '../../types/index.js';
import { findAgent } from '../../agent/builtin.js';
import { saveConfig } from '../../config/index.js';
import type { NavProps } from '../types.js';

export function ChooseModelScreen({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const agentEntry = config.agents[agentId];
  const [slotIndex, setSlotIndex] = useState(0);
  const [assignments, setAssignments] = useState<AgentModel[]>([]);
  const noProvider = !agentEntry?.currentProvider;
  const [showManual, setShowManual] = useState(false);
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (noProvider) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">尚未设置模型供应商</Text>
        <SelectMenu message="是否立即设置？" options={[
          { value: 'yes', label: '是' },
          { value: 'no', label: '否，返回' },
        ]} onSubmit={value => {
          if (value === 'yes') {
            nav.navigate({ type: 'chooseProvider', agentId });
          } else {
            nav.goBack();
          }
        }} />
      </Box>
    );
  }

  const provider = config.providers.find(p => p.id === agentEntry!.currentProvider);
  if (!provider) {
    return (
      <Box flexDirection="column">
        <Text color="red">当前绑定的供应商不存在，请重新设置</Text>
        <SelectMenu message="" options={[
          { value: 'back', label: '返回' },
        ]} onSubmit={() => nav.goBack()} />
      </Box>
    );
  }

  if (done) {
    return (
      <Box flexDirection="column">
        <Text color={saveError ? 'red' : 'green'}>
          {saveError ? `保存失败：${saveError}` : '✅ 模型已更新'}
        </Text>
        <SelectMenu message="" options={[
          { value: 'back', label: '返回' },
        ]} onSubmit={() => nav.navigate({ type: 'agentDetail', agentId })} />
      </Box>
    );
  }

  const currentSlot = agent.models[slotIndex];

  if (showManual) {
    return <TextInput
      promptMessage={`输入 ${currentSlot.name} 的模型 ID`}
      placeholder="例如: gpt-4o"
      onSubmit={modelId => {
        const next = [...assignments, { slot: currentSlot.slot, id: modelId }];
        if (slotIndex + 1 >= agent.models.length) {
          finishModelAssignment(agent, agentEntry!, provider, next, config, nav, agentId, setDone, setSaveError);
        } else {
          setAssignments(next);
          setSlotIndex(slotIndex + 1);
          setShowManual(false);
        }
      }}
      onCancel={() => setShowManual(false)}
    />;
  }

  const modelOptions = [
    ...provider.models.map(m => ({ value: m.id, label: m.name })),
    { value: '__manual__', label: '手动输入' },
  ];

  return (
    <Box flexDirection="column">
      <Text color="gray">({slotIndex + 1}/{agent.models.length})</Text>
      <SelectMenu message={`${currentSlot.name} (${currentSlot.slot})`} options={modelOptions} onSubmit={value => {
        if (value === '__manual__') {
          setShowManual(true);
        } else {
          const next = [...assignments, { slot: currentSlot.slot, id: value }];
          if (slotIndex + 1 >= agent.models.length) {
            finishModelAssignment(agent, agentEntry!, provider, next, config, nav, agentId, setDone, setSaveError);
          } else {
            setAssignments(next);
            setSlotIndex(slotIndex + 1);
          }
        }
      }} />
    </Box>
  );
}

async function finishModelAssignment(
  agent: AgentDefinition,
  agentEntry: { currentProvider: string; modelSlots: Record<string, string> },
  provider: { endpoints: Array<{ type: string; baseUrl: string }>; apiKey: string },
  assignments: AgentModel[],
  config: AgentBatonConfig,
  nav: NavProps,
  agentId: string,
  setDone: (v: boolean) => void,
  setSaveError: (v: string | null) => void,
) {
  agentEntry.modelSlots = Object.fromEntries(assignments.map(m => [m.slot, m.id]));
  try {
    await agent.saveNativeConfig({
      baseUrl: provider.endpoints.find(e => e.type === agent.apiType)?.baseUrl,
      apiKey: provider.apiKey,
      models: assignments,
    });
    await saveConfig(config);
    setDone(true);
  } catch (e) {
    setSaveError(e instanceof Error ? e.message : String(e));
    setDone(true);
  }
}
