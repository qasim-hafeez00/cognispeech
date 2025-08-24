import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Button,
  Text,
  Heading,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  IconButton,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FiEye, FiEyeOff, FiLock, FiUser } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  variant?: 'default' | 'minimal' | 'card';
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToSignup,
  variant = 'default',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { login, error, clearError } = useAuth();
  const toast = useToast();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  // Validation functions
  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    clearError();

    try {
      await login(email, password);
      
      toast({
        title: 'Login successful',
        description: 'Welcome to CogniSpeech!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  // Handle demo login
  const handleDemoLogin = async () => {
    setEmail('demo@cognispeech.com');
    setPassword('demo123');
    
    // Small delay to show the demo credentials
    setTimeout(async () => {
      setIsLoading(true);
      clearError();
      
      try {
        await login('demo@cognispeech.com', 'demo123');
        onSuccess?.();
      } catch (error) {
        console.error('Demo login error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  };

  // Render different variants
  if (variant === 'minimal') {
    return (
      <Box as="form" onSubmit={handleSubmit} w="full" maxW="400px">
        <VStack spacing={4} align="stretch">
          <FormControl isInvalid={!!errors.email}>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailChange}
              size="lg"
            />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.password}>
            <InputGroup size="lg">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={handlePasswordChange}
                pr="4.5rem"
              />
              <InputRightElement>
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  icon={showPassword ? <FiEyeOff /> : <FiEye />}
                  onClick={() => setShowPassword(!showPassword)}
                  variant="ghost"
                  size="sm"
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password}</FormErrorMessage>
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            size="lg"
            isLoading={isLoading}
            loadingText="Signing in..."
            w="full"
          >
            Sign In
          </Button>
        </VStack>
      </Box>
    );
  }

  if (variant === 'card') {
    return (
      <Box
        bg={bgColor}
        p={8}
        borderRadius="xl"
        border="1px solid"
        borderColor={borderColor}
        boxShadow="xl"
        w="full"
        maxW="450px"
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading size="lg" color={textColor} mb={2}>
              Welcome Back
            </Heading>
            <Text color="gray.500">
              Sign in to your CogniSpeech account
            </Text>
          </Box>

          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl isInvalid={!!errors.email}>
                <FormLabel color={textColor}>Email Address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  size="lg"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel color={textColor}>Password</FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter your password"
                    pr="4.5rem"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <FiEyeOff /> : <FiEye />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                      size="sm"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                isLoading={isLoading}
                loadingText="Signing in..."
                w="full"
                leftIcon={<FiUser />}
              >
                Sign In
              </Button>
            </VStack>
          </Box>

          <Divider />

          <VStack spacing={3}>
            <Button
              variant="outline"
              colorScheme="gray"
              size="md"
              onClick={handleDemoLogin}
              isLoading={isLoading}
              w="full"
            >
              Try Demo Account
            </Button>

            {onSwitchToSignup && (
              <HStack spacing={1} justify="center">
                <Text color="gray.500">Don't have an account?</Text>
                <Button
                  variant="link"
                  colorScheme="blue"
                  onClick={onSwitchToSignup}
                  size="sm"
                >
                  Sign up
                </Button>
              </HStack>
            )}
          </VStack>
        </VStack>
      </Box>
    );
  }

  // Default variant
  return (
    <Box
      bg={bgColor}
      p={8}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      w="full"
      maxW="500px"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="xl" color={textColor} mb={2}>
            Sign In to CogniSpeech
          </Heading>
          <Text color="gray.500" fontSize="lg">
            Access your vocal health dashboard and analysis results
          </Text>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={5} align="stretch">
            <FormControl isInvalid={!!errors.email}>
              <FormLabel color={textColor} fontSize="md" fontWeight="medium">
                Email Address
              </FormLabel>
              <Input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email address"
                size="lg"
                bg={useColorModeValue('white', 'gray.700')}
                borderColor={useColorModeValue('gray.300', 'gray.600')}
                _focus={{
                  borderColor: accentColor,
                  boxShadow: `0 0 0 1px ${accentColor}`,
                }}
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.password}>
              <FormLabel color={textColor} fontSize="md" fontWeight="medium">
                Password
              </FormLabel>
              <InputGroup size="lg">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  pr="4.5rem"
                  bg={useColorModeValue('white', 'gray.700')}
                  borderColor={useColorModeValue('gray.300', 'gray.600')}
                  _focus={{
                    borderColor: accentColor,
                    boxShadow: `0 0 0 1px ${accentColor}`,
                  }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? <FiEyeOff /> : <FiEye />}
                    onClick={() => setShowPassword(!showPassword)}
                    variant="ghost"
                    size="sm"
                    color="gray.500"
                    _hover={{ color: 'gray.700' }}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>

            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              isLoading={isLoading}
              loadingText="Signing in..."
              w="full"
              leftIcon={<FiLock />}
              h="50px"
              fontSize="md"
              fontWeight="semibold"
              _hover={{
                transform: 'translateY(-1px)',
                boxShadow: 'lg',
              }}
              transition="all 0.2s"
            >
              {isLoading ? <Spinner size="sm" /> : 'Sign In'}
            </Button>
          </VStack>
        </Box>

        {/* Demo Account Section */}
        <Box>
          <Divider mb={4} />
          <VStack spacing={3}>
            <Text color="gray.500" fontSize="sm" textAlign="center">
              Want to explore the platform? Try our demo account
            </Text>
            <Button
              variant="outline"
              colorScheme="gray"
              size="md"
              onClick={handleDemoLogin}
              isLoading={isLoading}
              w="full"
              leftIcon={<FiUser />}
            >
              Try Demo Account
            </Button>
          </VStack>
        </Box>

        {/* Sign Up Link */}
        {onSwitchToSignup && (
          <Box textAlign="center">
            <HStack spacing={1} justify="center">
              <Text color="gray.500">Don't have an account?</Text>
              <Button
                variant="link"
                colorScheme="blue"
                onClick={onSwitchToSignup}
                size="md"
                fontWeight="medium"
              >
                Create one now
              </Button>
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};
