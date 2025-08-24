import React, { useState } from 'react';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  Checkbox,
  CheckboxGroup,
  Stack,
  useDisclosure,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Badge,
  Divider,
  useColorModeValue,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import { analysisService } from '@/services/analysis.service';
import { AnalysisState, ExportOptions } from '@/types/analysis.types';

export interface ExportAnalysisProps {
  analysis: AnalysisState;
  trigger?: React.ReactElement;
  onExportComplete?: (format: string, filename: string) => void;
  onError?: (error: string) => void;
}



/**
 * ExportAnalysis component provides data export functionality
 * 
 * Features:
 * - Multiple export formats (JSON, CSV)
 * - Selective data inclusion options
 * - Download progress tracking
 * - Error handling and retry functionality
 * - Customizable trigger button
 * 
 * @example
 * ```tsx
 * <ExportAnalysis 
 *   analysis={analysisData}
 *   onExportComplete={(format, filename) => console.log(`Exported ${filename} as ${format}`)}
 *   onError={(error) => console.error(error)}
 * />
 * ```
 */
export const ExportAnalysis: React.FC<ExportAnalysisProps> = ({
  analysis,
  trigger,
  onExportComplete,
  onError,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeTimeSeries: false,
    includeSummary: true,
    includeEmotions: true,
    includeDialogueActs: true,
  });
  
  const toast = useToast();
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');

  /**
   * Handle export option changes
   */
  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Generate filename based on analysis and format
   */
  const generateFilename = (format: string): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `cognispeech_analysis_${analysis.id}_${timestamp}.${format}`;
  };

  /**
   * Download blob data as file
   */
  const downloadBlob = (data: any, filename: string, format: string) => {
    let blob: Blob;
    
    if (format === 'json') {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    } else if (format === 'csv') {
      // Handle CSV data from backend
      const csvContent = typeof data === 'string' ? data : data.csv_data || '';
      blob = new Blob([csvContent], { type: 'text/csv' });
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  /**
   * Handle export process
   */
  const handleExport = async () => {
    if (!analysis.results) {
      const error = 'Analysis must be completed before export';
      toast({
        title: 'Export Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      onError?.(error);
      return;
    }

    setIsExporting(true);
    
    try {
      const filename = generateFilename(exportOptions.format);
      
      // Call the export API
      const response = await analysisService.exportAnalysis(
        parseInt(analysis.id),
        exportOptions
      );
      
      // Handle the response based on format
      if (exportOptions.format === 'json') {
        downloadBlob(response, filename, 'json');
      } else if (exportOptions.format === 'csv') {
        downloadBlob(response, filename, 'csv');
      }
      
      toast({
        title: 'Export Successful',
        description: `Analysis data exported as ${filename}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onExportComplete?.(exportOptions.format, filename);
      onClose();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';
      
      toast({
        title: 'Export Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      onError?.(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Check if export is possible
   */
  const canExport = analysis.status === 'completed' && analysis.results;

  /**
   * Render the trigger button
   */
  const renderTrigger = () => {
    if (trigger) {
      return React.cloneElement(trigger, { onClick: onOpen });
    }
    
    return (
      <Tooltip label={canExport ? 'Export analysis data' : 'Analysis must be completed to export'}>
        <IconButton
          aria-label="Export analysis"
          icon={<FiDownload />}
          size="sm"
          variant="outline"
          colorScheme="blue"
          onClick={onOpen}
          isDisabled={!canExport}
        />
      </Tooltip>
    );
  };

  /**
   * Render export options
   */
  const renderExportOptions = () => (
    <VStack spacing={6} align="stretch">
      {/* Format Selection */}
      <FormControl>
        <FormLabel color={textColor}>Export Format</FormLabel>
        <Select
          value={exportOptions.format}
          onChange={(e) => handleOptionChange('format', e.target.value as 'json' | 'csv')}
          bg={bgColor}
        >
          <option value="json">JSON - Complete data structure</option>
          <option value="csv">CSV - Tabular format for Excel</option>
        </Select>
        <FormHelperText color={mutedColor}>
          {exportOptions.format === 'json' 
            ? 'Preserves all data relationships and structure'
            : 'Flattened format suitable for spreadsheet applications'
          }
        </FormHelperText>
      </FormControl>
      
      <Divider />
      
      {/* Data Inclusion Options */}
      <FormControl>
        <FormLabel color={textColor}>Include Data Sections</FormLabel>
        <CheckboxGroup
          value={Object.entries(exportOptions)
            .filter(([key, value]) => key !== 'format' && value)
            .map(([key]) => key)
          }
          onChange={(values) => {
            const newOptions = { ...exportOptions };
            // Reset all boolean options
            Object.keys(newOptions).forEach(key => {
              if (key !== 'format') {
                (newOptions as any)[key] = values.includes(key);
              }
            });
            setExportOptions(newOptions);
          }}
        >
          <Stack spacing={3}>
            <Checkbox value="includeTimeSeries" colorScheme="blue">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">Time Series Data</Text>
                <Text fontSize="xs" color={mutedColor}>
                  Vocal biomarker trends over time
                </Text>
              </VStack>
            </Checkbox>
            
            <Checkbox value="includeSummary" colorScheme="blue">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">Analysis Summary</Text>
                <Text fontSize="xs" color={mutedColor}>
                  AI-generated insights and key findings
                </Text>
              </VStack>
            </Checkbox>
          </Stack>
        </CheckboxGroup>
        <FormHelperText color={mutedColor}>
          Select which data sections to include in the export
        </FormHelperText>
      </FormControl>
    </VStack>
  );

  return (
    <>
      {renderTrigger()}
      
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={bgColor} borderColor={borderColor}>
          <ModalHeader color={textColor}>
            <HStack spacing={3}>
              <FiDownload />
              <Text>Export Analysis Data</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Analysis Info */}
              <Box>
                <HStack spacing={3} mb={3}>
                  <Badge colorScheme="blue" variant="subtle">
                    Analysis #{analysis.id}
                  </Badge>
                  <Badge 
                    colorScheme={analysis.status === 'completed' ? 'green' : 'yellow'} 
                    variant="subtle"
                  >
                    {analysis.status}
                  </Badge>
                </HStack>
                
                {!canExport && (
                  <Alert status="warning" size="sm">
                    <AlertIcon />
                    <AlertDescription>
                      Analysis must be completed before export is available.
                    </AlertDescription>
                  </Alert>
                )}
              </Box>
              
              {canExport && renderExportOptions()}
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleExport}
                isDisabled={!canExport}
                isLoading={isExporting}
                loadingText="Exporting..."
                leftIcon={isExporting ? <Spinner size="sm" /> : <FiDownload />}
              >
                Export {exportOptions.format.toUpperCase()}
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ExportAnalysis;
