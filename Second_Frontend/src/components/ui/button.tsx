import React from 'react';
import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react';

interface ButtonProps extends ChakraButtonProps {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  colorScheme?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'solid',
  size = 'md',
  colorScheme = 'blue',
  ...props 
}) => (
  <ChakraButton
    variant={variant}
    size={size}
    colorScheme={colorScheme}
    {...props}
  >
    {children}
  </ChakraButton>
);
