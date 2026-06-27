import React from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from '../components/SelectMenu.js';
import type { AgentBatonConfig, AgentModel } from '../../types/index.js';
import { findAgent } from '../../agent/builtin.js';
import { saveConfig } from '../../config/index.js';
import type { NavProps } from '../types.js';

export function ChooseProviderScreen({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const compatible = config.providers.filter(p => p.endpoints.some(e => e.type === agent.apiType));
  const noProviders = compatible.length === 0;

  if (noProviders) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">没有兼容 {agent.apiType} 类型的供应商</Text>
        <SelectMenu message="是否立即添加？" options={[
          { value: 'yes', label: '是，去添加' },
          { value: 'no', label: '否，返回' },
        ]} onSubmit={value => {
          if (value === 'yes') {
            nav.navigate({ type: 'addProvider', returnTo: { type: 'chooseProvider', agentId } });
          } else {
            nav.goBack();
          }
        }} />
      </Box>
    );
  }

  const providers = compatible;

  return (
    <Box flexDirection="column">
      <SelectMenu message="切换到：" options={[
        ...providers.map(p => ({ value: p.id, label: p.name })),
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        nav.navigate({ type: 'confirmProviderSwitch', agentId, providerId: value });
      }} onEscape={() => nav.goBack()} />
    </Box>
  );
}

export function ConfirmProviderSwitchScreen({ agentId, providerId, config, nav }: {
  agentId: string;
  providerId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const provider = config.providers.find(p => p.id === providerId)!;

  return (
    <Box flexDirection="column">
      <Text>切换 {agent.name} 的供应商到 {provider.name}？</Text>
      <SelectMenu message="" options={[
        { value: 'yes', label: '确认切换' },
        { value: 'no', label: '取消' },
      ]} onSubmit={async value => {
        if (value === 'no') { nav.goBack(); return; }

        const agentEntry = config.agents[agentId] ?? { id: agentId, currentProvider: '', modelSlots: {} };

        if (agentEntry.currentProvider && Object.keys(agentEntry.modelSlots).length > 0) {
          if (!agentEntry.history) { agentEntry.history = {}; }
          agentEntry.history[agentEntry.currentProvider] = { ...agentEntry.modelSlots };
        }

        agentEntry.currentProvider = providerId;
        agentEntry.modelSlots = agentEntry.history?.[providerId] ? { ...agentEntry.history[providerId] } : {};
        config.agents[agentId] = agentEntry;

        try {
          const models: AgentModel[] = Object.entries(agentEntry.modelSlots).map(([slot, id]) => ({ slot, id }));
          await agent.saveNativeConfig({
            baseUrl: provider.endpoints.find(e => e.type === agent.apiType)?.baseUrl,
            apiKey: provider.apiKey,
            models,
          });
          await saveConfig(config);

          if (Object.keys(agentEntry.modelSlots).length === 0 && agent.models.length > 0) {
            nav.navigate({ type: 'promptChooseModel', agentId });
          } else {
            nav.navigate({ type: 'agentDetail', agentId });
          }
        } catch (e) {
          nav.navigate({ type: 'agentDetail', agentId });
        }
      }} />
    </Box>
  );
}

export function PromptChooseModelScreen({ agentId, nav }: {
  agentId: string;
  nav: NavProps;
}) {
  return (
    <Box flexDirection="column">
      <Text color="yellow">当前供应商尚未配置模型</Text>
      <SelectMenu message="是否立即设置？" options={[
        { value: 'yes', label: '是' },
        { value: 'no', label: '否，返回' },
      ]} onSubmit={value => {
        if (value === 'yes') {
          nav.navigate({ type: 'chooseModel', agentId });
        } else {
          nav.navigate({ type: 'agentDetail', agentId });
        }
      }} />
    </Box>
  );
}
