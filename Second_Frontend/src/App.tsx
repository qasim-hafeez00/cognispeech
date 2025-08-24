import React from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorMode,
  useColorModeValue,
  IconButton,
  Flex,
  Spinner,
  useToast,
  Container,
  Heading,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { FiSun, FiMoon, FiMic, FiUpload, FiBarChart, FiLogOut, FiTrendingUp } from 'react-icons/fi';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { theme } from '@/styles/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginForm, AudioRecorder, FileUpload } from '@/components';
import { AnalysisDashboard } from '@/features/analysis/components';
import EnhancedAnalysisPage from '@/pages/EnhancedAnalysisPage';
import { BACKEND_CONFIG } from '@/lib/config';

// Color mode toggle component
const ColorModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      aria-label="Toggle color mode"
      icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
      onClick={toggleColorMode}
      variant="ghost"
      size="sm"
    />
  );
};

// Header component
const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');

  return (
    <Box
      as="header"
      bg={bgColor}
      borderBottom="1px solid"
      borderColor={borderColor}
      px={6}
      py={4}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex justify="space-between" align="center">
        <HStack spacing={4}>
          <Heading size="lg" color={textColor}>
            CogniSpeech
          </Heading>
          <Badge colorScheme="blue" variant="subtle">
            Beta
          </Badge>
        </HStack>
        
        <HStack spacing={3}>
          <ColorModeToggle />
          {user && (
            <>
              <HStack spacing={2}>
                <Text fontSize="sm" color="gray.500">
                  Welcome,
                </Text>
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  {user.name || user.email}
                </Text>
                <Badge colorScheme="green" variant="subtle">
                  {user.role}
                </Badge>
              </HStack>
              <Button
                leftIcon={<FiLogOut />}
                variant="ghost"
                colorScheme="gray"
                size="sm"
                onClick={logout}
              >
                Logout
              </Button>
            </>
          )}
        </HStack>
      </Flex>
      
      {/* Navigation Links */}
      {user && (
        <HStack spacing={6} mt={4} justify="center">
          <Link to="/record">
            <Button
              variant={location.pathname === '/record' ? 'solid' : 'ghost'}
              colorScheme="red"
              leftIcon={<FiMic />}
              size="sm"
            >
              Record Audio
            </Button>
          </Link>
          <Link to="/upload">
            <Button
              variant={location.pathname === '/upload' ? 'solid' : 'ghost'}
              colorScheme="blue"
              leftIcon={<FiUpload />}
              size="sm"
            >
              Upload Files
            </Button>
          </Link>
          <Link to="/analysis">
            <Button
              variant={location.pathname === '/analysis' ? 'solid' : 'ghost'}
              colorScheme="green"
              leftIcon={<FiBarChart />}
              size="sm"
            >
              Analysis Dashboard
            </Button>
          </Link>
          <Link to="/enhanced-analysis">
            <Button
              variant={location.pathname === '/enhanced-analysis' ? 'solid' : 'ghost'}
              colorScheme="purple"
              leftIcon={<FiTrendingUp />}
              size="sm"
            >
              Enhanced Analysis
            </Button>
          </Link>
        </HStack>
      )}
    </Box>
  );
};

// Main content component
const MainContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const containerBg = useColorModeValue('gray.50', 'gray.900');
  
  // Handle recording completion
  const handleRecordingComplete = (_audioBlob: Blob, duration: number) => {
    toast({
      title: 'Recording completed',
      description: `Audio recorded for ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="calc(100vh - 80px)"
        bg={containerBg}
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.500">Loading CogniSpeech...</Text>
        </VStack>
      </Box>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="calc(100vh - 80px)"
        bg={containerBg}
        p={6}
      >
        <LoginForm
          variant="card"
          onSuccess={() => {
            toast({
              title: 'Welcome to CogniSpeech!',
              description: 'You can now start analyzing your vocal biomarkers.',
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
          }}
        />
      </Box>
    );
  }

  // Main authenticated content
  return (
    <Box bg={containerBg} minH="calc(100vh - 80px)">
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Welcome Section */}
          <Box textAlign="center">
            <Heading size="xl" color={textColor} mb={3}>
              Welcome to Your Vocal Health Dashboard
            </Heading>
            <Text fontSize="lg" color={useColorModeValue('gray.500', 'gray.400')} maxW="2xl" mx="auto">
              Record your voice or upload audio files to analyze vocal biomarkers and get AI-powered insights into your vocal health.
            </Text>
          </Box>

          {/* Routes */}
          <Routes>
            <Route path="/record" element={
              <Box bg={bgColor} borderRadius="xl" border="1px solid" borderColor={borderColor} p={8}>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" color={textColor} mb={2}>
                      Record Your Voice
                    </Heading>
                    <Text color={useColorModeValue('gray.500', 'gray.400')}>
                      Use your microphone to record audio for vocal biomarker analysis
                    </Text>
                  </Box>
                  
                  <AudioRecorder
                    onRecordingComplete={handleRecordingComplete}
                    maxDuration={300}
                    showStats={true}
                    variant="default"
                    userId={user?.id?.toString()}
                    autoUpload={true}
                  />
                </VStack>
              </Box>
            } />
            
            <Route path="/upload" element={
              <Box bg={bgColor} borderRadius="xl" border="1px solid" borderColor={borderColor} p={8}>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" color={textColor} mb={2}>
                      Upload Audio Files
                    </Heading>
                    <Text color={useColorModeValue('gray.500', 'gray.400')}>
                      Upload existing audio or video files for analysis
                    </Text>
                  </Box>
                  
                  <FileUpload
                    userId={user?.id || '1'}
                    acceptedTypes={BACKEND_CONFIG.ALLOWED_AUDIO_TYPES}
                    maxFileSize={BACKEND_CONFIG.MAX_FILE_SIZE}
                    maxDuration={BACKEND_CONFIG.MAX_RECORDING_DURATION}
                    variant="drag-drop"
                    multiple={false}
                  />
                </VStack>
              </Box>
            } />
            
            <Route path="/analysis" element={
              <Box bg={bgColor} borderRadius="xl" border="1px solid" borderColor={borderColor} p={8}>
                <AnalysisDashboard userId={user?.id || '1'} />
              </Box>
            } />

            <Route path="/enhanced-analysis" element={
              <Box bg={bgColor} borderRadius="xl" border="1px solid" borderColor={borderColor} p={8}>
                <EnhancedAnalysisPage userId={user?.id || '1'} />
              </Box>
            } />
            
            {/* Default route - redirect to record */}
            <Route path="/" element={
              <Box bg={bgColor} borderRadius="xl" border="1px solid" borderColor={borderColor} p={8}>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center">
                    <Heading size="lg" color={textColor} mb={2}>
                      Welcome to CogniSpeech
                    </Heading>
                    <Text color={useColorModeValue('gray.500', 'gray.400')}>
                      Choose an option from the navigation above to get started
                    </Text>
                  </Box>
                </VStack>
              </Box>
            } />
          </Routes>

          {/* Information Section */}
          <Box bg={bgColor} p={6} borderRadius="lg" border="1px solid" borderColor={borderColor}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="lg" fontWeight="semibold" color={textColor} textAlign="center">
                About CogniSpeech
              </Text>
              <Text color={useColorModeValue('gray.500', 'gray.400')} textAlign="center" lineHeight="tall">
                CogniSpeech is an advanced vocal biomarker analysis platform that uses AI and machine learning 
                to analyze your voice for health insights. Our technology examines pitch, jitter, shimmer, 
                and other vocal characteristics to provide comprehensive vocal health assessments.
              </Text>
              <Divider />
              <HStack spacing={8} justify="center" wrap="wrap">
                <VStack spacing={2} align="center">
                  <Badge colorScheme="blue" variant="solid" px={3} py={1}>
                    Vocal Biomarkers
                  </Badge>
                  <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')} textAlign="center">
                    Pitch, Jitter, Shimmer, HNR
                  </Text>
                </VStack>
                <VStack spacing={2} align="center">
                  <Badge colorScheme="green" variant="solid" px={3} py={1}>
                    AI Analysis
                  </Badge>
                  <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')} textAlign="center">
                    Sentiment & Transcription
                  </Text>
                </VStack>
                <VStack spacing={2} align="center">
                  <Badge colorScheme="purple" variant="solid" px={3} py={1}>
                    Health Insights
                  </Badge>
                  <Text fontSize="sm" color={useColorModeValue('gray.500', 'gray.400')} textAlign="center">
                    Longitudinal Tracking
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <AuthProvider>
          <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
            <Header />
            <MainContent />
          </Box>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
};

export default App;
