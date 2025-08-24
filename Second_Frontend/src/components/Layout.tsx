import React from 'react'
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  IconButton,
  useDisclosure,
  useColorModeValue,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useBreakpointValue,
  Icon,
} from '@chakra-ui/react'
import { HamburgerIcon, ChevronDownIcon } from '@chakra-ui/icons'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { SidebarContent } from './Sidebar'

// Navigation item interface
export interface NavItem {
  label: string
  path: string
  icon?: React.ComponentType<any>
  children?: NavItem[]
}

// Layout props interface
export interface LayoutProps {
  children: React.ReactNode
  headerSlot?: React.ReactNode
  sidebarSlot?: React.ReactNode
  footerSlot?: React.ReactNode
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
]



// User menu component
const UserMenu: React.FC = () => {
  const { user, logout } = useAuth()
  const bgColor = useColorModeValue('white', 'gray.800')

  if (!user) {
    return (
      <Button w="full" colorScheme="brand" size="lg">
        Sign In
      </Button>
    )
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        w="full"
        variant="ghost"
        rightIcon={<ChevronDownIcon />}
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
  )
}

// Header component
const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const isMobile = useBreakpointValue({ base: true, md: false })

  return (
    <Box
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      px={4}
      py={3}
      position="sticky"
      top={0}
      zIndex="sticky"
    >
      <Flex align="center" justify="space-between">
        <HStack spacing={4}>
          {isMobile && (
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon />}
              variant="ghost"
              onClick={onMenuClick}
              size="lg"
            />
          )}
          <Text fontSize="lg" fontWeight="semibold" color={useColorModeValue('gray.700', 'white')}>
            CogniSpeech
          </Text>
        </HStack>

        {/* Right side header content */}
        <HStack spacing={4}>
          {/* Add any header actions here */}
        </HStack>
      </Flex>
    </Box>
  )
}

// Main layout component
export const Layout: React.FC<LayoutProps> = ({
  children,
  headerSlot,
  footerSlot,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const sidebarWidth = useBreakpointValue({ base: 'full', md: '280px' })
  
  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const sidebarBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box minH="100vh" bg={bgColor}>
      {/* Mobile drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="full">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody p={0}>
            <SidebarContent onClose={onClose} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Flex>
        {/* Desktop sidebar */}
        {!isMobile && (
          <Box
            w={sidebarWidth}
            bg={sidebarBg}
            borderRight="1px"
            borderColor={borderColor}
            position="fixed"
            h="100vh"
            zIndex="sidebar"
            overflowY="auto"
          >
            <SidebarContent />
          </Box>
        )}

        {/* Main content area */}
        <Box
          flex={1}
          ml={!isMobile ? sidebarWidth : 0}
          minH="100vh"
          display="flex"
          flexDirection="column"
        >
          {/* Header */}
          {headerSlot || <Header onMenuClick={onOpen} />}

          {/* Main content */}
          <Box as="main" flex={1} p={6}>
            {children}
          </Box>

          {/* Footer */}
          {footerSlot && (
            <Box as="footer" p={6} borderTop="1px" borderColor={borderColor}>
              {footerSlot}
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  )
}

export default Layout
