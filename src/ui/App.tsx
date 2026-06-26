import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useApp } from 'ink';
import { loadConfig } from '../config/index.js';
import { AgentBatonConfig } from '../types/index.js';
import type { Screen, NavProps } from './types.js';
import { MainScreen } from './screens/MainScreen.js';
import { AgentSelectScreen } from './screens/AgentSelectScreen.js';
import { ProviderSelectScreen } from './screens/ProviderSelectScreen.js';
import { AgentDetailScreen } from './screens/AgentDetailScreen.js';
import { ChooseProviderScreen, ConfirmProviderSwitchScreen, PromptChooseModelScreen } from './screens/ChooseProviderScreen.js';
import { ChooseModelScreen } from './screens/ChooseModelScreen.js';
import { AddProviderBindingScreen, RemoveProviderBindingScreen } from './screens/ProviderBindingScreen.js';
import { AddProviderScreen } from './screens/AddProviderScreen.js';
import { ModifyProviderScreen } from './screens/ModifyProviderScreen.js';

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

  const nav: NavProps = { navigate, goBack, goToMainMenu, exit };

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

