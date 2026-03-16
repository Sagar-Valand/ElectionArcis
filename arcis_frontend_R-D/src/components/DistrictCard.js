// src/components/DistrictCard.js

import React, { useState, useEffect, memo } from 'react';
import { Box, Grid, Text, Skeleton, useColorModeValue } from '@chakra-ui/react';
import { getDistrictCameraStats } from '../actions/cameraActions';

// Inner display component is memoized to prevent re-renders.
const StatsDisplay = memo(({ districtName, stats }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      textAlign="center"
      shadow="sm"
      height="100%"
      display="flex"
      flexDirection="column"
    >
      <Text
        fontSize="lg"
        fontWeight="bold"
        mb={3}
        color="white"
        bg="gray.700"
        py={2}
        borderRadius="md"
        isTruncated // Prevents long names from breaking layout
      >
        {districtName}
      </Text>
      <Grid templateColumns="repeat(4, 1fr)" gap={2} mt="auto">
        <Box>
          <Box bg="blue.500" color="white" p={2} borderRadius="md" fontSize="sm" fontWeight="bold">
            {stats?.totalCamera || 0}
          </Box>
          <Text fontSize="xs" mt={1}>Total</Text>
        </Box>
        <Box>
          <Box bg="green.500" color="white" p={2} borderRadius="md" fontSize="sm" fontWeight="bold">
            {stats?.onlineCamera || 0}
          </Box>
          <Text fontSize="xs" mt={1}>Online</Text>
        </Box>
        <Box>
          <Box bg="blue.400" color="white" p={2} borderRadius="md" fontSize="sm" fontWeight="bold">
            {stats?.isLiveCount || 0}
          </Box>
          <Text fontSize="xs" mt={1}>Connected</Text>
        </Box>
        <Box>
          <Box bg="red.500" color="white" p={2} borderRadius="md" fontSize="sm" fontWeight="bold">
            {stats?.offlineCamera || 0}
          </Box>
          <Text fontSize="xs" mt={1}>Offline</Text>
        </Box>
      </Grid>
    </Box>
  );
});

// Wrapper that fetches data and shows a skeleton while loading.
// The `style` prop is passed by react-window for positioning.
const DistrictCard = ({ districtAssemblyCode, districtName, style }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const response = await getDistrictCameraStats(districtAssemblyCode);
        if (isMounted && response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error(`Failed to fetch stats for ${districtName}`, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStats();

    return () => {
      isMounted = false; // Cleanup to prevent state updates on unmounted components
    };
  }, [districtAssemblyCode, districtName]);

  return (
    <Box style={style} p="8px"> {/* Padding to create a gap between cards */}
      {isLoading ? (
        <Skeleton height="160px" borderRadius="md" />
      ) : (
        <StatsDisplay districtName={districtName} stats={stats} />
      )}
    </Box>
  );
};

export default memo(DistrictCard);
