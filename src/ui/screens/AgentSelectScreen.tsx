import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { SelectMenu } from '../components/SelectMenu.js';
import { detectInstalledAgents } from '../../agent/detect.js';
import type { AgentBatonConfig } from '../../types/index.js';

type NavProps = {
  navigate: (screen: any) => void;
  goBack: () => void;
  goToMainMenu: () => void;
  exit: () => void;
};

export function AgentSelectScreen({ config, nav }: { config: AgentBatonConfig; nav: NavProps }) {
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    detectInstalledAgents().then(setAgents);
  }, []);

  if (agents.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">未检测到已安装的智能体</Text>
        <SelectMenu message="" options={[
          { value: 'back', label: '↑ 返回上一级菜单' },
          { value: 'main', label: '↩ 返回主菜单' },
        ]} onSubmit={v => v === 'main' ? nav.goToMainMenu() : nav.goBack()} onEscape={() => nav.goBack()} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <SelectMenu message="选择智能体：" options={[
        ...agents.map(a => ({ value: a.id, label: a.name })),
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        nav.navigate({ type: 'agentDetail', agentId: value });
      }} onEscape={() => nav.goBack()} />
    </Box>
  );
}
