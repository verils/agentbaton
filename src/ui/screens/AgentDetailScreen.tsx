import React from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from '../components/SelectMenu.js';
import type { AgentBatonConfig } from '../../types/index.js';
import { findAgent } from '../../agent/builtin.js';
import { resolvePlatformHome, maskApiKey } from '../../utils/index.js';
import type { NavProps } from '../types.js';

export function AgentDetailScreen({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId);
  if (!agent) {
    return (
      <Box flexDirection="column">
        <Text color="red">智能体不存在</Text>
        <SelectMenu message="" options={[
          { value: '__back__', label: '↑ 返回上一级菜单' },
          { value: '__main_menu__', label: '↩ 返回主菜单' },
        ]} onSubmit={v => v === '__main_menu__' ? nav.goToMainMenu() : nav.goBack()} onEscape={() => nav.goBack()} />
      </Box>
    );
  }
  if (agent.multiProvider) {
    return <MultiProviderAgentMenu agentId={agentId} config={config} nav={nav} />;
  }
  return <SingleProviderAgentMenu agentId={agentId} config={config} nav={nav} />;
}

function SingleProviderAgentMenu({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const agentEntry = config.agents[agentId];
  const configPath = agent.home ? resolvePlatformHome(agent.home) : '(未配置)';
  const providerName = agentEntry?.currentProvider
    ? config.providers.find(p => p.id === agentEntry.currentProvider)?.name
    : undefined;

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" paddingLeft={1} borderStyle="round" borderColor="gray" marginBottom={1}>
        <Text color="gray">配置目录: {configPath}</Text>
        <Text color="gray">API 类型: {agent.apiType}</Text>
        {providerName && <Text color="gray">当前供应商: {providerName}</Text>}
        <Box flexDirection="column" marginTop={1}>
          <Text>模型：</Text>
          {agent.models.map(slot => {
            const modelId = agentEntry?.modelSlots?.[slot.slot];
            return <Text key={slot.slot} color="gray">  {slot.name}：{modelId ?? '（获取失败）'}</Text>;
          })}
        </Box>
      </Box>
      <SelectMenu message={`${agent.name}：`} options={[
        { value: 'chooseProvider', label: '设置模型供应商' },
        { value: 'chooseModel', label: '设置模型' },
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        if (value === 'chooseProvider') {
          nav.navigate({ type: 'chooseProvider', agentId });
        } else if (value === 'chooseModel') {
          nav.navigate({ type: 'chooseModel', agentId });
        }
      }} onEscape={() => nav.goBack()} />
    </Box>
  );
}

function MultiProviderAgentMenu({ agentId, config, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const configPath = agent.home ? resolvePlatformHome(agent.home) : '(未配置)';
  const bindings = config.agents[agentId]?.providers ?? {};
  const entries = Object.entries(bindings);

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" paddingLeft={1} borderStyle="round" borderColor="gray" marginBottom={1}>
        <Text color="gray">配置目录: {configPath}</Text>
        <Text color="gray">API 类型: {agent.apiType}</Text>
        <Text>已绑定供应商：</Text>
        {entries.length === 0 ? (
          <Text color="gray">  （暂无绑定）</Text>
        ) : entries.map(([key, binding]) => {
          const p = config.providers.find(pp => pp.id === key);
          const name = p?.name ?? key;
          const keyDisplay = binding.apiKey ? maskApiKey(binding.apiKey) : '(继承默认)';
          return <Text key={key} color="gray">  {name}  Key: {keyDisplay}</Text>;
        })}
      </Box>
      <SelectMenu message={`${agent.name}：`} options={[
        { value: 'add', label: '添加供应商' },
        { value: 'remove', label: '移除供应商' },
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        if (value === 'add') {
          nav.navigate({ type: 'addProviderBinding', agentId });
        } else {
          nav.navigate({ type: 'removeProviderBinding', agentId });
        }
      }} onEscape={() => nav.goBack()} />
    </Box>
  );
}
