import React from 'react';
import { Progress as ChakraProgress, ProgressProps as ChakraProgressProps } from '@chakra-ui/react';

interface ProgressProps extends ChakraProgressProps {
  value: number;
  max?: number;
}

export const Progress: React.FC<ProgressProps> = ({ value, max = 100, ...props }) => (
  <ChakraProgress
    value={value}
    max={max}
    colorScheme="blue"
    size="sm"
    borderRadius="full"
    {...props}
  />
);
