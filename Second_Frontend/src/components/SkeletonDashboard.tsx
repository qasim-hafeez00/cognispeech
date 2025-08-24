import React from 'react'
import { Box, Skeleton, VStack, HStack } from '@chakra-ui/react'

interface SkeletonDashboardProps {
  /** Additional CSS classes */
  className?: string
}

export const SkeletonDashboard: React.FC<SkeletonDashboardProps> = ({ className = "" }) => {
  return (
    <Box className={className}>
      <VStack spacing={6} align="stretch">
        {/* Header skeleton */}
        <Box>
          <Skeleton height="32px" width="200px" mb={2} />
          <Skeleton height="16px" width="300px" />
        </Box>

        {/* Stats grid skeleton */}
        <HStack spacing={4} wrap="wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} flex="1" minW="200px">
              <Skeleton height="100px" borderRadius="md" />
            </Box>
          ))}
        </HStack>

        {/* Chart skeleton */}
        <Box>
          <Skeleton height="400px" borderRadius="md" />
        </Box>

        {/* Table skeleton */}
        <Box>
          <Skeleton height="20px" width="150px" mb={4} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="16px" mb={2} />
          ))}
        </Box>
      </VStack>
    </Box>
  )
}
