import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

type TextInputProps = {
  promptMessage: string;
  placeholder?: string;
  mask?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export function TextInput({ promptMessage, placeholder, mask, onSubmit, onCancel }: TextInputProps) {
  const [value, setValue] = useState('');

  useInput((input, key) => {
    if (key.return && value.length > 0) { onSubmit(value); return; }
    if (key.escape) { onCancel(); return; }
    if (key.backspace) { setValue(v => v.slice(0, -1)); return; }
    if (input && !key.ctrl && !key.meta) { setValue(v => v + input); }
  });

  const display = mask ? value.replace(/./g, mask) : value;

  return (
    <Box flexDirection="column">
      <Text bold>{promptMessage}</Text>
      {placeholder && <Text color="gray">{placeholder}</Text>}
      <Box marginTop={1}>
        <Text color="cyan">{'>'} </Text>
        <Text>{display}<Text color="gray">█</Text></Text>
      </Box>
      <Text color="gray" dimColor>Enter 确认 · Esc 取消</Text>
    </Box>
  );
}
