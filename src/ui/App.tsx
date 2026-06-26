import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useApp } from 'ink';
import { loadConfig } from '../config/index.js';
import { detectInstalledAgents } from '../agent/detect.js';
import { AgentBatonConfig } from '../types/index.js';
import { SelectMenu } from './components/SelectMenu.js';
import { MainScreen } from './MainScreen.js';
import { AgentDetailScreen, ChooseProviderScreen, ConfirmProviderSwitchScreen, PromptChooseModelScreen, ChooseModelScreen, AddProviderBindingScreen, RemoveProviderBindingScreen } from './agent.js';
import { AddProviderScreen, ModifyProviderScreen } from './provider.js';

type Screen =
  | { type: 'main' }
  | { type: 'agentSelect' }
  | { type: 'agentDetail'; agentId: string }
  | { type: 'chooseProvider'; agentId: string }
  | { type: 'confirmProviderSwitch'; agentId: string; providerId: string }
  | { type: 'promptChooseModel'; agentId: string }
  | { type: 'chooseModel'; agentId: string }
  | { type: 'addProviderBinding'; agentId: string }
  | { type: 'removeProviderBinding'; agentId: string }
  | { type: 'providerSelect' }
  | { type: 'addProvider'; returnTo?: Screen }
  | { type: 'modifyProvider'; providerId: string };

export async function openTUI(): Promise<void> {
  const { waitUntilExit } = render(<App />);
  await waitUntilExit();
}

function App() {
  const { exit } = useApp();
  const [, setHistory] = useState<Screen[]>([]);
  const [current, setCurrent] = useState<Screen>({ type: 'main' });
  const [config, setConfig] = useState<AgentBatonConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig().then(setConfig).catch(e => {
      setError(String(e));
    });
  }, []);

  const navigate = useCallback((screen: Screen) => {
    setHistory(h => [...h, current]);
    setCurrent(screen);
  }, [current]);

  const goBack = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) {
        setCurrent({ type: 'main' });
        return [];
      }
      const prev = h[h.length - 1];
      setCurrent(prev);
      return h.slice(0, -1);
    });
  }, []);

  const goToMainMenu = useCallback(() => {
    setHistory([]);
    setCurrent({ type: 'main' });
  }, []);

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="red">错误：{error}</Text>
        <Text dimColor>按 Ctrl+C 退出</Text>
      </Box>
    );
  }

  if (!config) {
    return <Text color="cyan">加载中...</Text>;
  }

  const nav = { navigate, goBack, goToMainMenu, exit };

  switch (current.type) {
    case 'main':
      return <MainScreen config={config} nav={nav} />;
    case 'agentSelect':
      return <AgentSelectScreen config={config} nav={nav} />;
    case 'agentDetail':
      return <AgentDetailScreen agentId={current.agentId} config={config} nav={nav} />;
    case 'chooseProvider':
      return <ChooseProviderScreen agentId={current.agentId} config={config} nav={nav} />;
    case 'confirmProviderSwitch':
      return <ConfirmProviderSwitchScreen agentId={current.agentId} providerId={current.providerId} config={config} nav={nav} />;
    case 'promptChooseModel':
      return <PromptChooseModelScreen agentId={current.agentId} nav={nav} />;
    case 'chooseModel':
      return <ChooseModelScreen agentId={current.agentId} config={config} nav={nav} />;
    case 'addProviderBinding':
      return <AddProviderBindingScreen agentId={current.agentId} config={config} nav={nav} />;
    case 'removeProviderBinding':
      return <RemoveProviderBindingScreen agentId={current.agentId} config={config} nav={nav} />;
    case 'providerSelect':
      return <ProviderSelectScreen config={config} nav={nav} />;
    case 'addProvider':
      return <AddProviderScreen config={config} nav={nav} returnTo={current.returnTo} />;
    case 'modifyProvider':
      return <ModifyProviderScreen providerId={current.providerId} config={config} nav={nav} />;
    default:
      return <MainScreen config={config} nav={nav} />;
  }
}

type NavProps = {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  goToMainMenu: () => void;
  exit: () => void;
};



function AgentSelectScreen({ config, nav }: { config: AgentBatonConfig; nav: NavProps }) {
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

function ProviderSelectScreen({ config, nav }: { config: AgentBatonConfig; nav: NavProps }) {
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
