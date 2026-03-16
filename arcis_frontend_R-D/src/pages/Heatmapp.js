// Heatmapp.js
import React, { useEffect, useState, useCallback } from "react";
import { 
  Box, Grid, Text, Spinner, Center, useColorModeValue, 
  Checkbox, Flex, Image, Select 
} from "@chakra-ui/react";
import { getAllDistrictStatsForUser, getAllAssemblyStatsForUser } from "../actions/cameraActions";
import MobileHeader from "../components/MobileHeader";
import ConnectedHeatmap from "./ConnectedHeatmap";

// ---------------- LEGEND ------------------
const Legend = ({ activeFilters, onFilterChange }) => {
  const legendItems = [
    { id: "online_90_plus", label: ">= 90% Online", color: "#6AA70E", min: 90, max: 100 },
    { id: "online_90_minus", label: "< 90% Online", color: "#07B6D5", min: 70, max: 89.99 },
    { id: "online_70_minus", label: "<= 70% Online", color: "#D948EF", min: 50, max: 69.99 },
    { id: "online_50_minus", label: "<= 50% Online", color: "#E7B008", min: 30, max: 49.99 },
    { id: "online_30_minus", label: "<= 30% Online", color: "#F27013", min: 10, max: 29.99 },
    { id: "online_10_minus", label: "<= 10% Online", color: "#F43E5C", min: 0, max: 9.99 }
  ];

  const containerBg = useColorModeValue(
    "linear-gradient(156deg, rgba(63, 119, 165, 0.08) 15.53%, rgba(255, 255, 255, 0.00) 80.08%)",
    "linear-gradient(156deg, rgba(22, 59, 116, 0.6) 15.53%, rgba(3, 7, 17, 0.60) 80.08%)"
  );

  const conditionTextColor = useColorModeValue("black", "white");

  return (
    <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }} gap={3} mb={4}>
      {legendItems.map((item) => (
        <Box
          key={item.id}
          display="flex"
          alignItems="center"
          justifyContent="flex-start"
          border="1px solid #D6D6D6"
          borderRadius="12px"
          px={4}
          py={2}
          color={conditionTextColor}
          fontSize="md"
          background={containerBg}
        >
          <Checkbox
            size="md"
            mr={2}
            isChecked={activeFilters.some(
              (filter) => filter.min === item.min && filter.max === item.max
            )}
            onChange={() => onFilterChange(item)}
            sx={{
              ".chakra-checkbox__control": {
                borderColor: item.color,
                width: "26px",
                height: "26px",
                borderRadius: "7px",
              },
              ".chakra-checkbox__control[data-checked]": {
                backgroundColor: item.color,
                borderColor: item.color,
              },
              ".chakra-checkbox__icon": {
                color: "white",
              },
            }}
          />
          {item.label}
        </Box>
      ))}
    </Grid>
  );
};

// ---------------- TILE ------------------
const HeatMapTile = ({ districtName, onlineCount, totalCount, percentage }) => {
  const color90Light = useColorModeValue("linear-gradient(135deg, #6AA70E 4.29%, rgba(214,214,214,0.60) 92.44%)",
    "linear-gradient(135deg, #6AA70E 4.29%, rgba(3,7,17,0.60) 92.44%)");
  const color70Light = useColorModeValue("linear-gradient(135deg, #07B6D5 4.29%, rgba(214,214,214,0.60) 92.44%)",
    "linear-gradient(135deg, #07B6D5 4.29%, rgba(3,7,17,0.60) 92.44%)");
  const color50Light = useColorModeValue("linear-gradient(135deg, #D948EF 4.29%, rgba(214,214,214,0.60) 92.44%)",
    "linear-gradient(135deg, #D948EF 4.29%, rgba(3,7,17,0.60) 92.44%)");
  const color30Light = useColorModeValue("linear-gradient(135deg, #E7B008 4.29%, rgba(214,214,214,0.60) 92.44%)",
    "linear-gradient(135deg, #E7B008 4.29%, rgba(3,7,17,0.60) 92.44%)");
  const color10Light = useColorModeValue("linear-gradient(135deg, #F27013 4.29%, rgba(214,214,214,0.60) 92.44%)",
    "linear-gradient(135deg, #F27013 4.29%, rgba(3,7,17,0.60) 92.44%)");
  const color0Light = useColorModeValue("linear-gradient(135deg, #F43E5C 4.29%, rgba(214,214,214,0.60) 92.44%)",
    "linear-gradient(135deg, #F43E5C 4.29%, rgba(3,7,17,0.60) 92.44%)");

  const isLightMode = useColorModeValue(true, false);

  const getStatusColor = (val) => {
    if (val >= 90) return color90Light;
    if (val >= 70) return color70Light;
    if (val >= 50) return color50Light;
    if (val >= 30) return color30Light;
    if (val >= 10) return color10Light;
    return color0Light;
  };

  const bgColor = getStatusColor(percentage);

  let textColor;
  if (percentage >= 90) textColor = "white";
  else if (percentage < 30) textColor = isLightMode ? "black" : "white";
  else textColor = isLightMode ? "gray.800" : "white";

  return (
    <Box
      bg={bgColor}
      color={textColor}
      p={2}
      shadow="md"
      minH="120px"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      height="100px"
      border="1px solid rgba(255,255,255,0.1)"
    >
      <Text fontWeight="bold" fontSize="13px" isTruncated mb={2}>{districtName}</Text>
      <Text fontSize="lg" fontWeight="bold" mb={1}>{`${onlineCount}/${totalCount}`}</Text>
      <Text fontSize="sm">{`(${percentage}%)`}</Text>
    </Box>
  );
};

// ---------------- MAIN PAGE ------------------
const Heatmapp = () => {
  // 1. ALL HOOKS AT THE TOP (Fixes deployment errors)
  const bgGradient = useColorModeValue(
    "linear-gradient(156deg, rgba(255, 255, 255, 0.60) 15.53%, rgba(234, 234, 234, 0.15) 59.32%)",
    "linear-gradient(to bottom, rgba(22, 59, 116, 0.60) 0%, rgba(3, 7, 17, 0.60) 100%)"
  );
  const activeTabBg = useColorModeValue(
    "linear-gradient(94deg, #9CBAD2 0.56%, #CDDEEB 94.58%)",
    "linear-gradient(to bottom, rgba(22, 59, 116, 0.60) 0%, rgba(3, 7, 17, 0.60) 100%)"
  );
  const textColor = useColorModeValue("gray.800", "white");
  const text = useColorModeValue('gray.500', 'gray.400');
  const selectBg = useColorModeValue("white", "gray.800");
  const activeTabTextColor = useColorModeValue("black", "white");
  const inactiveTabTextColor = useColorModeValue("gray.800", "gray.300");

  const [allDistrictStats, setAllDistrictStats] = useState([]);
  const [allAssemblyStats, setAllAssemblyStats] = useState([]); 
  const [filteredDistrictStats, setFilteredDistrictStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cameraStatus");
  const [selectedDistrict, setSelectedDistrict] = useState("all");

  const [activeFilters, setActiveFilters] = useState([
    { min: 90, max: 100 }, { min: 70, max: 89.99 }, { min: 50, max: 69.99 },
    { min: 30, max: 49.99 }, { min: 10, max: 29.99 }, { min: 0, max: 9.99 },
  ]);

  const applyFilters = useCallback((data, filters) => {
    if (filters.length === 0) return [];
    return data.filter((item) =>
      filters.some((filter) => item.percentage >= filter.min && item.percentage <= filter.max)
    );
  }, []);

  const fetchHeatMapData = useCallback(async () => {
    const email = localStorage.getItem("email");
    if (!email) return;

    try {
      setIsLoading(true);
      const [distRes, assemRes] = await Promise.all([
        getAllDistrictStatsForUser(email),
        getAllAssemblyStatsForUser(email)
      ]);

      if (distRes.success) {
        setAllDistrictStats(distRes.data.map((d) => ({
          ...d,
          displayName: d.districtName || d.dist_name,
          totalCameras: d.totalCamera || 0,
          onlineCameras: d.onlineCamera || 0,
          percentage: d.totalCamera > 0 ? Math.round((d.onlineCamera / d.totalCamera) * 100) : 0,
        })));
      }

      if (assemRes.success) {
        setAllAssemblyStats(assemRes.data.map((a) => ({
          ...a,
          displayName: a.accName, 
          totalCameras: a.totalCamera || 0,
          onlineCameras: a.onlineCamera || 0,
          percentage: a.totalCamera > 0 ? Math.round((a.onlineCamera / a.totalCamera) * 100) : 0,
        })));
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeatMapData();
  }, [fetchHeatMapData]);

  // 1 Minute Auto Refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHeatMapData();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchHeatMapData]);

  useEffect(() => {
    let baseData = [];
    if (selectedDistrict === "all") {
      baseData = allDistrictStats;
    } else {
      baseData = allAssemblyStats.filter(a => a.parentDistrict === selectedDistrict);
    }
    setFilteredDistrictStats(applyFilters(baseData, activeFilters));
  }, [allDistrictStats, allAssemblyStats, activeFilters, applyFilters, selectedDistrict]);

  const handleFilterChange = useCallback((item) => {
    setActiveFilters((prev) => {
      const exists = prev.some((f) => f.min === item.min && f.max === item.max);
      return exists ? prev.filter((f) => !(f.min === item.min && f.max === item.max)) : [...prev, item];
    });
  }, []);

  return (
    <>
      <MobileHeader title="Heat Map" />

      <Flex direction="column" align="flex-start" mx="auto" px={0} mb={4}>
        <Flex align="center" w="100%">
          <Text fontSize="26px" fontWeight="400" color={text} mr={2}>
            Heatmap - District wise
          </Text>
          <Image src="/images/right_of_text.png" h="1px" flex="1" display={{ base: "none", md: "block" }} />
          <Flex border="1px solid #868686" borderRadius="12px" overflow="hidden" height="40px" minW="320px">
            <Box as="button" flex="1" fontWeight="600" fontSize="14px"
              bg={activeTab === "cameraStatus" ? activeTabBg : "transparent"}
              color={activeTab === "cameraStatus" ? activeTabTextColor : inactiveTabTextColor}
              borderRight="1px solid #868686"
              onClick={() => setActiveTab("cameraStatus")}
            >
              Camera Status
            </Box>
            <Box as="button" flex="1" fontWeight="600" fontSize="14px"
              bg={activeTab === "connectingStatus" ? activeTabBg : "transparent"}
              color={activeTab === "connectingStatus" ? activeTabTextColor : inactiveTabTextColor}
              onClick={() => setActiveTab("connectingStatus")}
            >
              Connected Status
            </Box>
          </Flex>
        </Flex>
      </Flex>

      {activeTab === "cameraStatus" && (
        <Box p={3} maxW="1500px" height="1009px" mx="auto" mb={{ base: "20", md: "5" }} background={bgGradient} boxShadow="inset 0 1px 2px rgba(255,255,255,0.1)">
          <Box mt={{ base: "12", md: "0" }}>
            
            {/* Header with Title and District Selector on the right */}
            <Flex justify="space-between" align="center" mb={6}>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {selectedDistrict === "all" ? "Camera Status" : `Assembly Status: ${selectedDistrict}`}
              </Text>
              
              <Select 
                w="220px" size="sm" borderRadius="8px"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                bg={selectBg}
              >
                <option value="all">All Districts (Overview)</option>
                {allDistrictStats.map((d, i) => (
                  <option key={i} value={d.displayName}>{d.displayName}</option>
                ))}
              </Select>
            </Flex>

            <Legend activeFilters={activeFilters} onFilterChange={handleFilterChange} />
          </Box>

          {isLoading && filteredDistrictStats.length === 0 ? (
            <Center h="400px"><Spinner size="xl" color="teal.500" /></Center>
          ) : filteredDistrictStats.length > 0 ? (
            <Grid
              templateColumns={{
                base: "repeat(2, 147px)",
                sm: "repeat(3, 147px)",
                md: "repeat(4, 147px)",
                lg: "repeat(7, 1fr)",
              }}
              gap={0}
            >
              {filteredDistrictStats.map((item, idx) => (
                <HeatMapTile
                  key={item.assemblyCode || item.districtAssemblyCode || idx}
                  districtName={item.displayName}
                  onlineCount={item.onlineCameras}
                  totalCount={item.totalCameras}
                  percentage={item.percentage}
                />
              ))}
            </Grid>
          ) : (
            <Center h="200px">
              <Box p={5} borderWidth="1px" borderRadius="lg" textAlign="center">
                <Text color={textColor}>No data available for the selected filters.</Text>
              </Box>
            </Center>
          )}
        </Box>
      )}

      {activeTab === "connectingStatus" && <ConnectedHeatmap />}
    </>
  );
};

export default Heatmapp;
