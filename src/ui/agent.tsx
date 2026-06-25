import React from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from './components/select-menu.js';
import type { AgentBatonConfig } from '../types/index.js';
import { findAgent } from '../agent/builtin.js';
import { resolvePlatformHome, maskApiKey } from '../utils/index.js';

type NavProps = {
  navigate: (screen: any) => void;
  goBack: () => void;
  goToMainMenu: () => void;
  exit: () => void;
};

export function AgentDetailScreen({ agentId, config, onSave, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  onSave: (cfg: AgentBatonConfig) => Promise<void>;
  nav: NavProps;
}) {
  const agent = findAgent(agentId);
  if (!agent) {
    return (
      <Box flexDirection="column">
        <Text color="red">智能体不存在</Text>
        <SelectMenu
          message=""
          options={[
            { value: '__back__', label: '↑ 返回上一级菜单' },
            { value: '__main_menu__', label: '↩ 返回主菜单' },
          ]}
          onSubmit={(v) => v === '__main_menu__' ? nav.goToMainMenu() : nav.goBack()}
        />
      </Box>
    );
  }

  if (agent.multiProvider) {
    return <MultiProviderAgentMenu agentId={agentId} config={config} onSave={onSave} nav={nav} />;
  }
  return <SingleProviderAgentMenu agentId={agentId} config={config} onSave={onSave} nav={nav} />;
}

function SingleProviderAgentMenu({ agentId, config, onSave, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  onSave: (cfg: AgentBatonConfig) => Promise<void>;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const agentConfig = config.agents[agentId];

  const configPath = agent.home ? resolvePlatformHome(agent.home) : '(未配置)';
  const models: string[] = [];
  for (const slot of agent.models) {
    const modelId = agentConfig?.modelSlots?.[slot.slot];
    models.push(`${slot.name}：${modelId ?? '（获取失败）'}`);
  }

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" paddingLeft={1} borderStyle="round" borderColor="gray" marginBottom={1}>
        <Text color="gray">配置目录: {configPath}</Text>
        <Text color="gray">API 类型: {agent.apiType}</Text>
        {agentConfig?.currentProvider && (
          <Text color="gray">当前供应商: {config.providers.find(p => p.id === agentConfig.currentProvider)?.name ?? '未知'}</Text>
        )}
        <Box flexDirection="column" marginTop={1}>
          <Text>模型：</Text>
          {models.map((m, i) => (
            <Text key={i} color="gray">  {m}</Text>
          ))}
        </Box>
      </Box>
      <SelectMenu
        message={`${agent.name}：`}
        options={[
          { value: 'chooseProvider', label: '设置模型供应商' },
          { value: 'chooseModel', label: '设置模型' },
          { value: '__back__', label: '↑ 返回上一级菜单' },
          { value: '__main_menu__', label: '↩ 返回主菜单' },
        ]}
        onSubmit={(value) => {
          if (value === '__back__') {
            nav.goBack();
          } else if (value === '__main_menu__') {
            nav.goToMainMenu();
          }
        }}
      />
    </Box>
  );
}

function MultiProviderAgentMenu({ agentId, config, onSave, nav }: {
  agentId: string;
  config: AgentBatonConfig;
  onSave: (cfg: AgentBatonConfig) => Promise<void>;
  nav: NavProps;
}) {
  const agent = findAgent(agentId)!;
  const configPath = agent.home ? resolvePlatformHome(agent.home) : '(未配置)';

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" paddingLeft={1} borderStyle="round" borderColor="gray" marginBottom={1}>
        <Text color="gray">配置目录: {configPath}</Text>
        <Text color="gray">API 类型: {agent.apiType}</Text>
        <Text>已绑定供应商：</Text>
        <Text color="gray">  （暂无绑定）</Text>
      </Box>
      <SelectMenu
        message={`${agent.name}：`}
        options={[
          { value: 'add', label: '添加供应商' },
          { value: 'remove', label: '移除供应商' },
          { value: '__back__', label: '↑ 返回上一级菜单' },
          { value: '__main_menu__', label: '↩ 返回主菜单' },
        ]}
        onSubmit={(value) => {
          if (value === '__back__') {
            nav.goBack();
          } else if (value === '__main_menu__') {
            nav.goToMainMenu();
          }
        }}
      />
    </Box>
  );
}
