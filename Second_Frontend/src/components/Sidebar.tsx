import React from 'react';
import {
  VStack,
  Box,
  Text,
  Button,
  useColorModeValue,
  Icon,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  HStack,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Navigation item interface
interface NavItem {
  label: string;
  path: string;
  icon?: React.ComponentType<any>;
  children?: NavItem[];
}

// Navigation items
const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
  },
  {
    label: 'Upload',
    path: '/upload',
  },
  {
    label: 'Analysis',
    path: '/analysis',
    children: [
      { label: 'Recent', path: '/analysis/recent' },
      { label: 'Archived', path: '/analysis/archived' },
    ],
  },
];

// User menu component
const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');

  if (!user) {
    return (
      <Button w="full" colorScheme="brand" size="lg">
        Sign In
      </Button>
    );
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        w="full"
        variant="ghost"
        size="lg"
        h="48px"
      >
        <HStack spacing={3}>
          <Avatar size="sm" name={user.name} />
          <Box textAlign="left">
            <Text fontSize="sm" fontWeight="medium">
              {user.name}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {user.role || 'User'}
            </Text>
          </Box>
        </HStack>
      </MenuButton>
      <MenuList bg={bgColor}>
        <MenuItem>Profile</MenuItem>
        <MenuItem>Settings</MenuItem>
        <MenuDivider />
        <MenuItem onClick={logout}>Sign Out</MenuItem>
      </MenuList>
    </Menu>
  );
};

// Sidebar content component
export const SidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleNavClick = (path: string) => {
    navigate(path);
    onClose?.();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <VStack spacing={0} align="stretch" h="full">
      {/* Logo/Brand */}
      <Box p={6} borderBottom="1px" borderColor={borderColor}>
        <Text fontSize="2xl" fontWeight="bold" color="brand.500">
          CogniSpeech
        </Text>
        <Text fontSize="sm" color="gray.500">
          Voice Analysis Platform
        </Text>
      </Box>

      {/* Navigation */}
      <VStack spacing={1} align="stretch" flex={1} p={4}>
        {NAV_ITEMS.map((item) => (
          <Box key={item.path}>
            <Button
              w="full"
              justifyContent="flex-start"
              variant={isActive(item.path) ? 'solid' : 'ghost'}
              colorScheme={isActive(item.path) ? 'brand' : 'gray'}
              onClick={() => handleNavClick(item.path)}
              size="lg"
              h="48px"
            >
              {item.icon && <Icon as={item.icon} mr={3} />}
              {item.label}
            </Button>
            
            {/* Sub-navigation */}
            {item.children && isActive(item.path) && (
              <VStack spacing={1} ml={6} mt={2}>
                {item.children.map((child) => (
                  <Button
                    key={child.path}
                    w="full"
                    justifyContent="flex-start"
                    variant={isActive(child.path) ? 'solid' : 'ghost'}
                    colorScheme={isActive(child.path) ? 'brand' : 'gray'}
                    onClick={() => handleNavClick(child.path)}
                    size="md"
                    h="40px"
                  >
                    {child.label}
                  </Button>
                ))}
              </VStack>
            )}
          </Box>
        ))}
      </VStack>

      {/* User section */}
      <Box p={4} borderTop="1px" borderColor={borderColor}>
        <UserMenu />
      </Box>
    </VStack>
  );
};
