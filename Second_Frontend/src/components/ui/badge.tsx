import React from 'react';
import { Badge as ChakraBadge, BadgeProps as ChakraBadgeProps } from '@chakra-ui/react';

interface BadgeProps extends ChakraBadgeProps {
  children: React.ReactNode;
  variant?: 'solid' | 'subtle' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'subtle', ...props }) => (
  <ChakraBadge
    variant={variant}
    colorScheme="blue"
    {...props}
  >
    {children}
  </ChakraBadge>
);
