import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from './components/SelectMenu.js';
import { InfoPanel } from './InfoPanel.js';
import type { AgentBatonConfig } from '../types/index.js';

interface NavProps {
  navigate: (screen: unknown) => void;
  goBack: () => void;
  goToMainMenu: () => void;
  exit: () => void;
}

interface MainScreenProps {
  config: AgentBatonConfig;
  nav: NavProps
}

export function MainScreen({ config, nav }: MainScreenProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">┌ </Text>
        <Text bold>AgentBaton — 智能体设置管理</Text>
      </Box>
      <InfoPanel config={config} key={refreshKey}/>
      <SelectMenu
        message="选择菜单："
        options={[
          { value: 'agent', label: '智能体' },
          { value: 'provider', label: '模型供应商' },
          { value: 'display', label: '查看当前设置' },
          { value: 'exit', label: '退出' },
        ]}
        onSubmit={(value) => {
          switch (value) {
            case 'agent':
              nav.navigate({ type: 'agentSelect' });
              break;
            case 'provider':
              nav.navigate({ type: 'providerSelect' });
              break;
            case 'display':
              setRefreshKey(k => k + 1);
              break;
            case 'exit':
              nav.exit();
              break;
          }
        }}
      />
    </Box>
  );
}

