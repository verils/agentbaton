import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

type Option = { value: string; label: string };

type SelectMenuProps = {
  message: string;
  options: Option[];
  onSubmit: (value: string) => void;
  onEscape?: () => void;
};

export function SelectMenu({ message, options, onSubmit, onEscape }: SelectMenuProps) {
  const [focusIndex, setFocusIndex] = useState(0);

  useInput((_input, key) => {
    if (key.escape) {
      onEscape?.();
    } else if (key.upArrow) {
      setFocusIndex(i => (i - 1 + options.length) % options.length);
    } else if (key.downArrow) {
      setFocusIndex(i => (i + 1) % options.length);
    } else if (key.return) {
      onSubmit(options[focusIndex].value);
    }
  });

  return (
    <Box flexDirection="column">
      {message && (
        <Text bold>
          <Text color="cyan">◆</Text> {message}
        </Text>
      )}
      {options.map((opt, i) => (
        <Text key={opt.value}>
          <Text color={i === focusIndex ? 'green' : 'gray'}>
            {i === focusIndex ? '● ' : '○ '}
          </Text>
          <Text bold={i === focusIndex}>{opt.label}</Text>
        </Text>
      ))}
    </Box>
  );
}
