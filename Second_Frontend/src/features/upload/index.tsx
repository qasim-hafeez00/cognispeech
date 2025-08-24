import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Card,
  CardBody,
  Heading,
  Icon,
} from '@chakra-ui/react'
import { FiUpload, FiMic, FiFile } from 'react-icons/fi'
import { UploadForm } from './components/UploadForm'
import { RecordingInterface } from './components/RecordingInterface'

export const UploadFeature: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} textAlign="center">
              <Icon as={FiUpload} boxSize={12} color="blue.500" />
              <Heading size="lg">Upload Audio for Analysis</Heading>
              <Text color="gray.600" maxW="2xl">
                Choose how you'd like to provide audio for analysis. You can either upload an existing audio file 
                or record your voice directly in the browser. Our AI will analyze vocal biomarkers and provide 
                insights on speech patterns, sentiment, and linguistic features.
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Upload Options */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiMic} />
                    <Text>Record Audio</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FiFile} />
                    <Text>Upload File</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                  <VStack spacing={4}>
                    <Text fontSize="lg" fontWeight="medium" textAlign="center">
                      Record Your Voice
                    </Text>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Use your microphone to record audio directly in the browser. 
                      This is perfect for quick voice memos or speech samples.
                    </Text>
                    <RecordingInterface />
                  </VStack>
                </TabPanel>

                <TabPanel>
                  <VStack spacing={4}>
                    <Text fontSize="lg" fontWeight="medium" textAlign="center">
                      Upload Audio File
                    </Text>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Upload an existing audio file from your device. 
                      Supported formats: WAV, MP3, M4A, FLAC (max 50MB).
                    </Text>
                    <UploadForm />
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>

        {/* Information Cards */}
        <HStack spacing={6} align="stretch">
          <Card bg={cardBg} borderColor={borderColor} flex={1}>
            <CardBody>
              <VStack spacing={3} textAlign="center">
                <Icon as={FiMic} boxSize={8} color="green.500" />
                <Heading size="sm">Voice Recording</Heading>
                <Text fontSize="sm" color="gray.600">
                  Record audio directly in your browser using your microphone. 
                  Perfect for quick voice memos and speech samples.
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} flex={1}>
            <CardBody>
              <VStack spacing={3} textAlign="center">
                <Icon as={FiFile} boxSize={8} color="blue.500" />
                <Heading size="sm">File Upload</Heading>
                <Text fontSize="sm" color="gray.600">
                  Upload existing audio files from your device. 
                  Supports multiple formats and larger file sizes.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </HStack>

        {/* Analysis Information */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4}>
              <Heading size="md" textAlign="center">
                What We Analyze
              </Heading>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Our AI analyzes your audio for vocal biomarkers, sentiment analysis, speech patterns, 
                and linguistic features to provide comprehensive insights about your communication style.
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  )
}
