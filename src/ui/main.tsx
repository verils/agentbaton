import React, { useState, useEffect, useCallback } from 'react';
import { render, Box, Text, useApp } from 'ink';
import { loadConfig, saveConfig } from '../config/index.js';
import { getStringWidth, isCommandAvailable, maskApiKey, padEndWidth } from '../utils/index.js';
import { builtinAgents } from '../agent/builtin.js';
import { detectInstalledAgents } from '../agent/detect.js';
import { AgentBatonConfig } from '../types/index.js';
import { SelectMenu } from './components/select-menu.js';

type Screen =
  | { type: 'main' }
  | { type: 'agentSelect' }
  | { type: 'agentDetail'; agentId: string }
  | { type: 'providerSelect' }
  | { type: 'addProvider' }
  | { type: 'modifyProvider'; providerId: string };

export async function runPrompt(): Promise<void> {
  const { waitUntilExit } = render(<App />);
  await waitUntilExit();
}

function App() {
  const { exit } = useApp();
  const [history, setHistory] = useState<Screen[]>([]);
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

  const handleSaveConfig = useCallback(async (cfg: AgentBatonConfig) => {
    await saveConfig(cfg);
    setConfig({ ...cfg });
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
      return <MainMenu config={config} nav={nav} />;
    case 'agentSelect':
      return <AgentSelectScreen config={config} nav={nav} />;
    case 'providerSelect':
      return <ProviderSelectScreen config={config} nav={nav} />;
    default:
      return <MainMenu config={config} nav={nav} />;
  }
}

type NavProps = {
  navigate: (screen: Screen) => void;
  goBack: () => void;
  goToMainMenu: () => void;
  exit: () => void;
};

function MainMenu({ config, nav }: { config: AgentBatonConfig; nav: NavProps }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">┌ </Text>
        <Text bold>AgentBaton — 智能体设置管理</Text>
      </Box>
      <InfoPanel config={config} key={refreshKey} />
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

function AgentSelectScreen({ config, nav }: { config: AgentBatonConfig; nav: NavProps }) {
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    detectInstalledAgents().then(setAgents);
  }, []);

  if (agents.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">未检测到已安装的智能体</Text>
        <SelectMenu
          message=""
          options={[
            { value: 'back', label: '↑ 返回上一级菜单' },
            { value: 'main', label: '↩ 返回主菜单' },
          ]}
          onSubmit={(v) => v === 'main' ? nav.goToMainMenu() : nav.goBack()}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <SelectMenu
        message="选择智能体："
        options={[
          ...agents.map(a => ({ value: a.id, label: a.name })),
          { value: '__back__', label: '↑ 返回上一级菜单' },
          { value: '__main_menu__', label: '↩ 返回主菜单' },
        ]}
        onSubmit={(value) => {
          if (value === '__back__') {
            nav.goBack();
          } else if (value === '__main_menu__') {
            nav.goToMainMenu();
          } else {
            nav.navigate({ type: 'agentDetail', agentId: value });
          }
        }}
      />
    </Box>
  );
}

function ProviderSelectScreen({ config, nav }: { config: AgentBatonConfig; nav: NavProps }) {
  return (
    <Box flexDirection="column">
      <SelectMenu
        message="选择模型供应商："
        options={[
          ...config.providers.map(p => ({ value: p.id, label: p.name })),
          { value: 'addProvider', label: '添加模型供应商' },
          { value: '__back__', label: '↑ 返回上一级菜单' },
          { value: '__main_menu__', label: '↩ 返回主菜单' },
        ]}
        onSubmit={(value) => {
          if (value === '__back__') {
            nav.goBack();
          } else if (value === '__main_menu__') {
            nav.goToMainMenu();
          } else if (value === 'addProvider') {
            nav.navigate({ type: 'addProvider' });
          } else {
            nav.navigate({ type: 'modifyProvider', providerId: value });
          }
        }}
      />
    </Box>
  );
}

function InfoPanel({ config }: { config: AgentBatonConfig }) {
  const [agentStatuses, setAgentStatuses] = useState<Array<{ name: string; installed: boolean }>>([]);

  useEffect(() => {
    Promise.all(
      builtinAgents.map(async a => ({
        name: a.name,
        installed: await isCommandAvailable(a.command),
      }))
    ).then(setAgentStatuses);
  }, []);

  const agentWidth = agentStatuses.length > 0
    ? Math.max(...agentStatuses.map(a => getStringWidth(a.name)))
    : 0;

  return (
    <Box flexDirection="column" paddingLeft={1} borderStyle="round" borderColor="gray" marginBottom={1}>
      <Box flexDirection="column" marginBottom={1}>
        <Text>
          <Text color="blue">●</Text> 智能体 🤖
        </Text>
        {agentStatuses.map(a => (
          <Text key={a.name} color="gray">
            │  {padEndWidth(a.name, agentWidth)} （{a.installed ? '✅ 已安装' : '❌ 未安装'}）
          </Text>
        ))}
      </Box>
      <Box flexDirection="column">
        <Text>
          <Text color="blue">●</Text> 模型供应商 🔌
        </Text>
        {config.providers.length === 0 ? (
          <Text color="gray">│  （暂无供应商，请先添加）</Text>
        ) : (() => {
          const pw = Math.max(...config.providers.map(p => getStringWidth(p.name)));
          return config.providers.map(p => (
            <Text key={p.id} color="gray">
              │  {padEndWidth(p.name, pw)} （{maskApiKey(p.apiKey)}）
            </Text>
          ));
        })()}
      </Box>
    </Box>
  );
}
