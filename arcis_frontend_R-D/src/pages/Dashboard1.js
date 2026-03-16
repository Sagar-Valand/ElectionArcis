// dashboard1.js
import React, { useEffect, useState, useCallback } from "react";
import { Box, Button, Grid, Text, Spinner, Center, useColorModeValue } from "@chakra-ui/react";
import { Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

import {
  getUserCameraStats,
  getdistrictwiseAccess,
  getDistrictCameraStats,
  getAllDistrictStatsForUser,
} from "../actions/cameraActions";
import MobileHeader from "../components/MobileHeader";

// Custom Card Component (inline) with dark mode support
const CustomCard = ({ title, value, color = "#333" }) => {
  const bgColor = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  
  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="lg"
      boxShadow="sm"
      textAlign="center"
      border="1px solid #e2e8f0"
    >
      <Text fontSize="sm" color={textColor} mb={2}>
        {title}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" color={color}>
        {value}
      </Text>
    </Box>
  );
};

// Modified DistrictCard component with dark mode support
const DistrictCard = ({ districtName, stats }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headerBgColor = useColorModeValue("gray.700", "gray.600");
  
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
        bg={headerBgColor}
        py={2}
        borderRadius="md"
        isTruncated
      >
        {districtName}
      </Text>
      <Grid templateColumns="repeat(4, 1fr)" gap={2} mt="auto">
        <Box>
          <Box bg="blue.500" color="white" p={2} borderRadius="md" fontSize="sm" fontWeight="bold">
            {stats?.totalCamera || stats?.totalCameras || 0}
          </Box>
          <Text fontSize="xs" mt={1}>Total</Text>
        </Box>
        <Box>
          <Box bg="green.500" color="white" p={2} borderRadius="md" fontSize="sm" fontWeight="bold">
            {stats?.onlineCamera || stats?.onlineCameras || 0}
          </Box>
          <Text fontSize="xs" mt={1}>Online</Text>
        </Box>
        <Box>
          <Box bg="blue.400" color="white" p={2} borderRadius="md" fontSize="sm" fontWeight="bold">
            {stats?.isLiveCount || stats?.connectedCameras || 0}
          </Box>
          <Text fontSize="xs" mt={1}>Connected</Text>
        </Box>
        <Box>
          <Box bg="red.500" color="white" p={2} borderRadius="md" fontSize="sm" fontWeight="bold">
            {stats?.offlineCamera || stats?.offlineCameras || 0}
          </Box>
          <Text fontSize="xs" mt={1}>Offline</Text>
        </Box>
      </Grid>
    </Box>
  );
};

const Dashboard1 = () => {
  const [totalCameras, setTotalCameras] = useState(0);
  const [onlineCameras, setOnlineCameras] = useState(0);
  const [offlineCameras, setOfflineCameras] = useState(0);
  const [isLiveCountValue, setIsLiveCountValue] = useState(0);

  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [allDistrictStats, setAllDistrictStats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    const email = localStorage.getItem("email");
    if (!email) return;

    try {
      // Fetch user camera stats
      const userStatsResponse = await getUserCameraStats(email);
      if (userStatsResponse.success && userStatsResponse.cameraStats) {
        const stats = userStatsResponse.cameraStats;
        setTotalCameras(stats.totalCameras || 0);
        setOnlineCameras(stats.onlineCameras || 0);
        setOfflineCameras(stats.offlineCameras || 0);
        setIsLiveCountValue(stats.isLiveCount || 0);
      }
      
      // Fetch district stats for the cards
      const districtStatsResponse = await getAllDistrictStatsForUser(email);
      console.log("District stats response:", districtStatsResponse); // Debug log
      if (districtStatsResponse.success) {
        setAllDistrictStats(districtStatsResponse.data || []);
      }
      
      // Fetch district access (only once, as this doesn't change frequently)
      if (districts.length === 0) {
        const accessResponse = await getdistrictwiseAccess(email);
        if (accessResponse.success) {
          setDistricts(accessResponse.matchedDistricts || []);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }, [districts.length]);

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 1 minute (60000 milliseconds)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      console.log("Auto-refreshing dashboard data..."); // Debug log
      fetchDashboardData();
    }, 60000); // 1 minute = 60000 milliseconds

    // Cleanup interval on component unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchDashboardData]);

  const handleDistrictSelect = async (district) => {
    setSelectedDistrict(district);
    const email = localStorage.getItem("email");

    if (!district) {
      if (email) {
        getUserCameraStats(email).then(res => {
          if (res.success && res.cameraStats) {
            setTotalCameras(res.cameraStats.totalCameras || 0);
            setOnlineCameras(res.cameraStats.onlineCameras || 0);
            setOfflineCameras(res.cameraStats.offlineCameras || 0);
            setIsLiveCountValue(res.cameraStats.isLiveCount || 0);
          }
        });
      }
      return;
    }

    try {
      if (!email) { return; }
      setIsLoading(true);

      const cardResponse = await getDistrictCameraStats(email, district.districtAssemblyCode);
      
      if (cardResponse.success && cardResponse.data) {
        setTotalCameras(cardResponse.data.totalCamera || 0);
        setOnlineCameras(cardResponse.data.onlineCamera || 0);
        setOfflineCameras(cardResponse.data.offlineCamera || 0);
        setIsLiveCountValue(cardResponse.data.isLiveCount || 0);
      } else {
        setTotalCameras(0);
        setOnlineCameras(0);
        setOfflineCameras(0);
        setIsLiveCountValue(0);
      }
    } catch (error) {
      console.error("Error during district selection:", error);
      setTotalCameras(0);
      setOnlineCameras(0);
      setOfflineCameras(0);
      setIsLiveCountValue(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={3} maxW="1440px" mx="auto" mb={{ base: "20", md: "5" }}>
      <MobileHeader title="Dashboard" />
      
      {/* Header Section */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        flexDirection={{ base: "column", md: "row" }} 
        gap={4} 
        mt={{ base: "12", md: "0" }} 
        mb={6}
      >
        <Text 
          display={{ base: "none", md: "block" }} 
          fontSize="2xl" 
          fontWeight="bold"
        >
          Dashboard
        </Text>
        <Menu>
          <MenuButton 
            as={Button} 
            rightIcon={<ChevronDownIcon />} 
            colorScheme="teal" 
            width="250px" 
            textAlign="left"
          >
            {selectedDistrict ? selectedDistrict.dist_name : "All Districts"}
          </MenuButton>
          <MenuList width="250px">
            <MenuItem key="all-districts" onClick={() => handleDistrictSelect(null)}>
              All Districts
            </MenuItem>
            {districts.map((district) => (
              <MenuItem key={district._id} onClick={() => handleDistrictSelect(district)}>
                {district.dist_name}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </Box>

      {/* Summary Cards */}
      <Grid 
        width="100%" 
        templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} 
        gap={6} 
        mb={8}
      >
        <CustomCard title="Total Cameras" value={totalCameras} />
        <CustomCard title="Online Cameras" value={onlineCameras} color="#38a169" />
        <CustomCard title="Offline Cameras" value={offlineCameras} color="#e53e3e" />
        <CustomCard title="Connected Cameras" value={isLiveCountValue} color="#805ad5" />
      </Grid>

      {/* District-wise Camera Statistics Section */}
      <Box mb={6}>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          District-wise Camera Statistics
        </Text>
        
        {isLoading ? (
          <Center h="200px">
            <Spinner size="xl" color="teal.500" />
          </Center>
        ) : allDistrictStats.length > 0 ? (
          <Grid 
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} 
            gap={6}
          >
            {allDistrictStats.map((district, index) => {
              console.log("Rendering district:", district); // Debug log
              return (
                <DistrictCard
                  key={`${district.districtAssemblyCode || district._id || index}`}
                  districtName={district.districtName || district.dist_name || 'Unknown District'}
                  stats={district}
                />
              );
            })}
          </Grid>
        ) : (
          <Box p={5} borderWidth="1px" borderRadius="lg" textAlign="center">
            <Text>No district data available.</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard1;

