import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { builtinAgents } from '../agent/builtin.js';
import { getStringWidth, isCommandAvailable, maskApiKey, padEndWidth } from '../utils/index.js';
import type { AgentBatonConfig } from '../types/index.js';

export function InfoPanel({ config }: { config: AgentBatonConfig }) {
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
