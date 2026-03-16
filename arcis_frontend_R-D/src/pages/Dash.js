// src/pages/Dash.js
import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import {
  Box,
  Button,
  Grid,
  Text,
  VStack,
  useColorModeValue,
  Flex,
  Heading,
  SimpleGrid,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import CustomCard from "../components/CustomCard";
import {
  BsCameraVideoFill,
  BsPlayCircleFill,
  BsWifiOff,
  BsHddNetwork
} from "react-icons/bs";
import DistrictBarChart from "../components/CameraStatusChart";

import {
  getUserCameraStats,
  getdistrictwiseAccess,
  getDistrictCameraStats,
  getAllDistrictStatsForUser,
  getAssemblyCameraStats,
} from "../actions/cameraActions";
import MobileHeader from "../components/MobileHeader";

/* ✅ PURE FUNCTION (no hooks inside) */
const getRadialChartOptions = (online, offline, centerTextColor) => ({
  chart: {
    type: "radialBar",
    sparkline: { enabled: true }
  },
  plotOptions: {
    radialBar: {
      dataLabels: {
        total: {
          show: true,
          fontSize: "11px",
          formatter: () => `${online}/${offline}`,
          color: centerTextColor
        }
      },
      track: {
        background: "#EDF2F7",
        strokeWidth: "95%"
      }
    }
  },
  labels: ["Online", "Offline"],
  colors: [
    online > 0 ? "#65A30D" : "transparent",
    offline > 0 ? "#EF4444" : "transparent"
  ],
  stroke: {
    lineCap: online > 0 && offline > 0 ? "round" : "butt"
  }
});

const Dash = () => {
  // --- States ---
  const [totalCameras, setTotalCameras] = useState(0);
  const [onlineCameras, setOnlineCameras] = useState(0);
  const [offlineCameras, setOfflineCameras] = useState(0);
  const [isLiveCountValue, setIsLiveCountValue] = useState(0);

  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [allDistrictStats, setAllDistrictStats] = useState([]);
  const [assemblyChartData, setAssemblyChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rotationIndex, setRotationIndex] = useState(0);

  // --- Theme Colors ---
  const cardBorderColor = useColorModeValue("gray.200", "whiteAlpha.400");
  const chartBg = useColorModeValue("#F7FAFC", "gray.700");
  const textColor = useColorModeValue("gray.500", "gray.400");
  const chartCenterTextColor = useColorModeValue("#1A202C", "#F7FAFC");
  const cardBg = useColorModeValue("white", "gray.800");
  const subTextColor = useColorModeValue("gray.600", "gray.300");

  // --- Data Fetching ---
  const fetchData = async () => {
    const email = localStorage.getItem("email");
    if (!email) return;

    getUserCameraStats(email).then(res => {
      if (res.success && res.cameraStats && !selectedDistrict) {
        const stats = res.cameraStats;
        setTotalCameras(stats.totalCameras || 0);
        setOnlineCameras(stats.onlineCameras || 0);
        setOfflineCameras(stats.offlineCameras || 0);
        setIsLiveCountValue(stats.isLiveCount || 0);
      }
    });

    getAllDistrictStatsForUser(email).then(res => {
      if (res.success) {
        setAllDistrictStats(
          res.data.filter(
            d => (d.onlineCamera || 0) > 0 || (d.offlineCamera || 0) > 0
          )
        );
      }
    });

    getdistrictwiseAccess(email).then(res => {
      if (res.success && res.matchedDistricts) setDistricts(res.matchedDistricts);
    });

    if (selectedDistrict) {
      const assemblyResponse = await getAssemblyCameraStats(
        email,
        selectedDistrict.dist_name
      );
      if (assemblyResponse.success && assemblyResponse.assemblies) {
        setAssemblyChartData(
          assemblyResponse.assemblies.filter(
            a => a.onlineCamera + a.offlineCamera > 0
          )
        );
      }
    }
  };

  useEffect(() => {
    fetchData();
    const pollingInterval = setInterval(fetchData, 20000);
    return () => clearInterval(pollingInterval);
  }, [selectedDistrict]);

  useEffect(() => {
    let interval;
    if (allDistrictStats.length > 0) {
      interval = setInterval(() => {
        setRotationIndex(prev => (prev + 1) % allDistrictStats.length);
      }, 20000);
    }
    return () => clearInterval(interval);
  }, [allDistrictStats]);

  const handleDistrictSelect = async district => {
    setSelectedDistrict(district);
    const email = localStorage.getItem("email");

    if (!district) {
      setAssemblyChartData([]);
      fetchData();
      return;
    }

    try {
      setIsLoading(true);
      const cardResponse = await getDistrictCameraStats(
        email,
        district.districtAssemblyCode
      );
      if (cardResponse.success && cardResponse.data) {
        setTotalCameras(cardResponse.data.totalCamera || 0);
        setOnlineCameras(cardResponse.data.onlineCamera || 0);
        setOfflineCameras(cardResponse.data.offlineCamera || 0);
        setIsLiveCountValue(cardResponse.data.isLiveCount || 0);
      }

      const assemblyResponse = await getAssemblyCameraStats(
        email,
        district.dist_name
      );
      if (assemblyResponse.success && assemblyResponse.assemblies) {
        setAssemblyChartData(
          assemblyResponse.assemblies.filter(
            a => a.onlineCamera + a.offlineCamera > 0
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Sidebar rotation
  const currentSidebarData =
    allDistrictStats.length > 0 ? allDistrictStats[rotationIndex] : null;

  const displayDistName = currentSidebarData
    ? currentSidebarData.districtName
    : selectedDistrict
    ? selectedDistrict.dist_name
    : "All Districts";

  const displayTotal = currentSidebarData
    ? currentSidebarData.totalCameras ||
      currentSidebarData.onlineCamera + currentSidebarData.offlineCamera
    : totalCameras;

  const displayOnline = currentSidebarData
    ? currentSidebarData.onlineCamera
    : onlineCameras;

  const displayOffline = currentSidebarData
    ? currentSidebarData.offlineCamera
    : offlineCameras;

  const displayConnected = currentSidebarData
    ? currentSidebarData.isLiveCount
    : isLiveCountValue;

  return (
    <Box maxW="1600px" mx="auto" mb={{ base: "20", md: "5" }}>
      <MobileHeader title="CheckPost Dashboard" />

      {/* Top Cards */}
      <Box mt={{ base: 4, md: 0 }} mb={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight={400} fontSize="26px" color={textColor}>
            Dashboard
          </Text>
        </Flex>

        <Grid
          templateColumns={{
            base: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)"
          }}
          gap={3}
        >
          <CustomCard
            title="Total Cameras"
            value={totalCameras}
            color="#1C4ED8"
            IconComponent={BsCameraVideoFill}
            layout="vertical"
          />
          <CustomCard
            title="Online Cameras"
            value={onlineCameras}
            color="#65A30D"
            IconComponent={BsPlayCircleFill}
            layout="vertical"
          />
          <CustomCard
            title="Offline Cameras"
            value={offlineCameras}
            color="#EF4444"
            IconComponent={BsWifiOff}
            layout="vertical"
          />
          <CustomCard
            title="Connected Cameras"
            value={isLiveCountValue}
            color="#8B5CF6"
            IconComponent={BsHddNetwork}
            layout="vertical"
          />
        </Grid>
      </Box>

      {/* Main */}
      <Grid templateColumns={{ base: "1fr", lg: "70% 28%" }} gap={2}>
        <Box bg={chartBg} p={6} borderRadius="16px">
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={6}>
            District wise CheckPost Camera Status
          </Text>
          <Box width="100%" height="400px">
            <DistrictBarChart chartData={allDistrictStats} />
          </Box>
        </Box>

        <Box bg={chartBg} p={6} borderRadius="16px" height="fit-content">
          <Heading size="md" mb={4} color={textColor}>
            {displayDistName}
          </Heading>
          <VStack spacing={2} align="stretch">
            <CustomCard
              title="Total"
              value={displayTotal}
              color="#1C4ED8"
              IconComponent={BsCameraVideoFill}
              layout="horizontal"
            />
            <CustomCard
              title="Online"
              value={displayOnline}
              color="#65A30D"
              IconComponent={BsPlayCircleFill}
              layout="horizontal"
            />
            <CustomCard
              title="Offline"
              value={displayOffline}
              color="#EF4444"
              IconComponent={BsWifiOff}
              layout="horizontal"
            />
            <CustomCard
              title="Connected"
              value={displayConnected}
              color="#8B5CF6"
              IconComponent={BsHddNetwork}
              layout="horizontal"
            />
          </VStack>
        </Box>
      </Grid>

      {/* Assembly */}
      <Box borderWidth="1px" borderRadius="md" p={2} mb={1} bg={cardBg}>
        <Flex align="center" justify="space-between">
          <Text fontSize="lg" fontWeight="bold" color={textColor}>
            All Assembly Status
          </Text>

          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              size="sm"
              variant="outline"
            >
              {selectedDistrict ? selectedDistrict.dist_name : "Select District"}
            </MenuButton>

            <MenuList
              maxH="300px"
              overflowY="auto"
              bg={cardBg}
              borderColor={cardBorderColor}
            >
              <MenuItem onClick={() => handleDistrictSelect(null)}>
                All Districts
              </MenuItem>
              {districts.map((d, i) => (
                <MenuItem key={i} onClick={() => handleDistrictSelect(d)}>
                  {d.dist_name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Flex>
      </Box>

      <Box bg={chartBg} p={2} borderRadius="16px">
        {selectedDistrict && (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={2}>
            {assemblyChartData.map((asm, index) => (
              <VStack
                key={index}
                bg={cardBg}
                p={2}
                borderRadius="20px"
                shadow="sm"
                border="1px solid"
                borderColor="gray.100"
                color={subTextColor}
              >
                <Text
                  fontWeight="800"
                  fontSize="xs"
                  textAlign="center"
                  mb={-2}
                >
                  {asm.assemblyName}
                </Text>

                <Box w="100%" h="180px">
                  <ReactApexChart
                    options={getRadialChartOptions(
                      asm.onlineCamera,
                      asm.offlineCamera,
                      chartCenterTextColor
                    )}
                    series={[
                      asm.onlineCamera + asm.offlineCamera === 0
                        ? 0
                        : Math.round(
                            (asm.onlineCamera /
                              (asm.onlineCamera + asm.offlineCamera)) *
                              100
                          ),
                      asm.onlineCamera + asm.offlineCamera === 0
                        ? 0
                        : Math.round(
                            (asm.offlineCamera /
                              (asm.onlineCamera + asm.offlineCamera)) *
                              100
                          )
                    ]}
                    type="radialBar"
                    height="100%"
                  />
                </Box>
              </VStack>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
};

export default Dash;
