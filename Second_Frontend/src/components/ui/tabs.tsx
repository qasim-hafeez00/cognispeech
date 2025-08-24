import React from 'react';
import { 
  Tabs as ChakraTabs, 
  TabList as ChakraTabList, 
  Tab as ChakraTab, 
  TabPanels as ChakraTabPanels, 
  TabPanel as ChakraTabPanel,
  TabsProps as ChakraTabsProps,
  TabListProps as ChakraTabListProps,
  TabProps as ChakraTabProps,
  TabPanelsProps as ChakraTabPanelsProps,
  TabPanelProps as ChakraTabPanelProps
} from '@chakra-ui/react';

interface TabsProps extends ChakraTabsProps {
  children: React.ReactNode;
}

interface TabListProps extends ChakraTabListProps {
  children: React.ReactNode;
}

interface TabProps extends ChakraTabProps {
  children: React.ReactNode;
}

interface TabPanelsProps extends ChakraTabPanelsProps {
  children: React.ReactNode;
}

interface TabPanelProps extends ChakraTabPanelProps {
  children: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ children, ...props }) => (
  <ChakraTabs {...props}>
    {children}
  </ChakraTabs>
);

export const TabList: React.FC<TabListProps> = ({ children, ...props }) => (
  <ChakraTabList {...props}>
    {children}
  </ChakraTabList>
);

export const Tab: React.FC<TabProps> = ({ children, ...props }) => (
  <ChakraTab {...props}>
    {children}
  </ChakraTab>
);

export const TabPanels: React.FC<TabPanelsProps> = ({ children, ...props }) => (
  <ChakraTabPanels {...props}>
    {children}
  </ChakraTabPanels>
);

export const TabPanel: React.FC<TabPanelProps> = ({ children, ...props }) => (
  <ChakraTabPanel {...props}>
    {children}
  </ChakraTabPanel>
);

// Also export the old names for backward compatibility
export const TabsList = TabList;
export const TabsTrigger = Tab;
export const TabsContent = TabPanel;
