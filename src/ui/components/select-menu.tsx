import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Select, type Option } from '@inkjs/ui';

type SelectMenuProps = {
  message: string;
  options: Option[];
  onSubmit: (value: string) => void;
};

export function SelectMenu({ message, options, onSubmit }: SelectMenuProps) {
  const [value, setValue] = useState<string | undefined>();

  useInput((_input, key) => {
    if (key.return && value !== undefined) {
      onSubmit(value);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>
        <Text color="cyan">◆</Text> {message}
      </Text>
      <Select
        options={options}
        onChange={setValue}
      />
    </Box>
  );
}
