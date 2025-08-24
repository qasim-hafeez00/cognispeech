import React from 'react';
import { Box, BoxProps, Text, TextProps } from '@chakra-ui/react';

interface CardProps extends BoxProps {
  children: React.ReactNode;
}

interface CardHeaderProps extends BoxProps {
  children: React.ReactNode;
}

interface CardContentProps extends BoxProps {
  children: React.ReactNode;
}

interface CardTitleProps extends TextProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, ...props }) => (
  <Box
    bg="white"
    _dark={{ bg: "gray.800", borderColor: "gray.600" }}
    borderRadius="lg"
    border="1px solid"
    borderColor="gray.200"
    shadow="sm"
    p={6}
    {...props}
  >
    {children}
  </Box>
);

export const CardHeader: React.FC<CardHeaderProps> = ({ children, ...props }) => (
  <Box mb={4} {...props}>
    {children}
  </Box>
);

export const CardContent: React.FC<CardContentProps> = ({ children, ...props }) => (
  <Box {...props}>
    {children}
  </Box>
);

export const CardTitle: React.FC<CardTitleProps> = ({ children, ...props }) => (
  <Text
    fontSize="lg"
    fontWeight="semibold"
    color="gray.800"
    _dark={{ color: "white" }}
    {...props}
  >
    {children}
  </Text>
);
