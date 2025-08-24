import React from 'react'
import { Box, Flex, Button, Text, useToast, useColorModeValue } from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'

interface NavigationProps {
  isAuthenticated: boolean
  onLogout: () => void
}

export const Navigation: React.FC<NavigationProps> = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('blue.600', 'blue.300')

  if (!isAuthenticated) return null

  const handleLogout = () => {
    onLogout()
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
      status: "info",
      duration: 3000,
      isClosable: true,
    })
    navigate('/login')
  }

  return (
    <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} px={6} py={4}>
      <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
        <Flex align="center" gap={8}>
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            color={textColor} 
            cursor="pointer"
            onClick={() => navigate('/')}
          >
            🚀 CogniSpeech
          </Text>
          
          <Flex ml={8} gap={4}>
            <Button
              variant={location.pathname === '/' ? 'solid' : 'ghost'}
              colorScheme="blue"
              onClick={() => navigate('/')}
            >
              Dashboard
            </Button>
            <Button
              variant={location.pathname === '/upload' ? 'solid' : 'ghost'}
              colorScheme="blue"
              onClick={() => navigate('/upload')}
            >
              Upload
            </Button>
          </Flex>
        </Flex>
        
        <Button onClick={handleLogout} colorScheme="red" variant="outline" size="sm">
          Logout
        </Button>
      </Flex>
    </Box>
  )
}
