import React from 'react';
import { Box } from 'ink';
import { SelectMenu } from '../components/SelectMenu.js';
import type { AgentBatonConfig } from '../../types/index.js';
import type { NavProps } from '../types.js';

export function ProviderSelectScreen({ config, nav }: { config: AgentBatonConfig; nav: NavProps }) {
  return (
    <Box flexDirection="column">
      <SelectMenu message="选择模型供应商：" options={[
        ...config.providers.map(p => ({ value: p.id, label: p.name })),
        { value: 'addProvider', label: '添加模型供应商' },
        { value: '__back__', label: '↑ 返回上一级菜单' },
        { value: '__main_menu__', label: '↩ 返回主菜单' },
      ]} onSubmit={value => {
        if (value === '__back__') { nav.goBack(); return; }
        if (value === '__main_menu__') { nav.goToMainMenu(); return; }
        if (value === 'addProvider') {
          nav.navigate({ type: 'addProvider' });
        } else {
          nav.navigate({ type: 'modifyProvider', providerId: value });
        }
      }} onEscape={() => nav.goBack()} />
    </Box>
  );
}
