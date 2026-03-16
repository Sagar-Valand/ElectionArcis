import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Grid,
  Text,
  Spinner,
  Center,
  useColorModeValue,
  Checkbox,
  Flex,
  Select,
  Image
} from "@chakra-ui/react";
// Added getAllAssemblyStatsForUser import
import { getAllDistrictStatsForUser, getAllAssemblyStatsForUser } from "../actions/cameraActions";
import MobileHeader from "../components/MobileHeader";

// ---------------- LEGEND (No changes) ------------------
const Legend = ({ onFilterChange, activeFilters }) => {
  const legendItems = [
    { id: "online_90_plus", color: "#6AA70E", label: ">= 90% Online", min: 90, max: 100 },
    { id: "online_90_minus", color: "#07B6D5", label: "< 90% Online", min: 70, max: 89.99 },
    { id: "online_70_minus", color: "#D948EF", label: "<= 70% Online", min: 50, max: 69.99 },
    { id: "online_50_minus", color: "#E7B008", label: "<= 50% Online", min: 30, max: 49.99 },
    { id: "online_30_minus", color: "#F27013", label: "<= 30% Online", min: 10, max: 29.99 },
    { id: "online_10_minus", color: "#F43E5C", label: "<= 10% Online", min: 0, max: 9.99 }
  ];

  const containerBg = useColorModeValue(
    "linear-gradient(156deg, rgba(63,119,165,0.08) 15.53%, rgba(255,255,255,0.00) 80.08%)",
    "linear-gradient(156deg, rgba(22,59,116,0.6) 15.53%, rgba(3,7,17,0.6) 80.08%)"
  );

  const conditionTextColor = useColorModeValue("black", "white");

  return (
    <Grid
      templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }}
      gap={3}
      mb={4}
    >
      {legendItems.map((item) => (
        <Box
          key={item.id}
          display="flex"
          alignItems="center"
          border="1px solid #D6D6D6"
          borderRadius="12px"
          px={4}
          py={2}
          background={containerBg}
          color={conditionTextColor}
          fontSize="md"
        >
          <Checkbox
            mr={2}
            isChecked={activeFilters.some((f) => f.min === item.min && f.max === item.max)}
            onChange={() => onFilterChange(item)}
            sx={{
              ".chakra-checkbox__control": {
                borderColor: item.color,
                width: "26px",
                height: "26px",
                borderRadius: "7px"
              },
              ".chakra-checkbox__control[data-checked]": {
                backgroundColor: item.color,
                borderColor: item.color
              }
            }}
          />
          {item.label}
        </Box>
      ))}
    </Grid>
  );
};

// ---------------- TILE (No changes) ------------------
const ConnectedHeatMapTile = ({ districtName, connectedCount, totalCount, percentage }) => {
  const gradients = {
    g90: useColorModeValue("linear-gradient(135deg, #6AA70E 4.29%, rgba(214,214,214,0.60) 92.44%)", "linear-gradient(135deg, #6AA70E 4.29%, rgba(3,7,17,0.60) 92.44%)"),
    g70: useColorModeValue("linear-gradient(135deg, #07B6D5 4.29%, rgba(214,214,214,0.60) 92.44%)", "linear-gradient(135deg, #07B6D5 4.29%, rgba(3,7,17,0.60) 92.44%)"),
    g50: useColorModeValue("linear-gradient(135deg, #D948EF 4.29%, rgba(214,214,214,0.60) 92.44%)", "linear-gradient(135deg, #D948EF 4.29%, rgba(3,7,17,0.60) 92.44%)"),
    g30: useColorModeValue("linear-gradient(135deg, #E7B008 4.29%, rgba(214,214,214,0.60) 92.44%)", "linear-gradient(135deg, #E7B008 4.29%, rgba(3,7,17,0.60) 92.44%)"),
    g10: useColorModeValue("linear-gradient(135deg, #F27013 4.29%, rgba(214,214,214,0.60) 92.44%)", "linear-gradient(135deg, #F27013 4.29%, rgba(3,7,17,0.60) 92.44%)"),
    g0: useColorModeValue("linear-gradient(135deg, #F43E5C 4.29%, rgba(214,214,214,0.60) 92.44%)", "linear-gradient(135deg, #F43E5C 4.29%, rgba(3,7,17,0.60) 92.44%)")
  };

  const getColorByPercentage = (p) => {
    if (p >= 90) return gradients.g90;
    if (p >= 70) return gradients.g70;
    if (p >= 50) return gradients.g50;
    if (p >= 30) return gradients.g30;
    if (p >= 10) return gradients.g10;
    return gradients.g0;
  };

  const bgColor = getColorByPercentage(percentage);
  const isLightMode = useColorModeValue(true, false);
  let textColor = percentage >= 90 ? "white" : percentage < 30 ? (isLightMode ? "black" : "white") : isLightMode ? "gray.800" : "white";

  return (
    <Box
      bg={bgColor}
      p={3}
      minH="120px"
      height="100px"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      color={textColor}
      border="1px solid rgba(255,255,255,0.1)"
    >
      <Text fontSize="13px" fontWeight="bold" isTruncated mb={2}>{districtName}</Text>
      <Text fontSize="lg" fontWeight="bold" mb={1}>{connectedCount}/{totalCount}</Text>
      <Text fontSize="sm" fontWeight="semibold">({percentage}%)</Text>
    </Box>
  );
};

// ---------------- MAIN PAGE ------------------
const ConnectedHeatmap = () => {
  // 1. CALL ALL HOOKS AT THE VERY TOP
  const bgGradient = useColorModeValue(
    "linear-gradient(156deg, rgba(255,255,255,0.60) 15.53%, rgba(234,234,234,0.15) 59.32%)",
    "linear-gradient(to bottom, rgba(22,59,116,0.60), rgba(3,7,17,0.60))"
  );
  const textColor = useColorModeValue("gray.800", "white");
  const selectBg = useColorModeValue("white", "gray.800");

  const [allDistrictStats, setAllDistrictStats] = useState([]);
  const [allAssemblyStats, setAllAssemblyStats] = useState([]); 
  const [filteredStats, setFilteredStats] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("all"); 
  const [isLoading, setIsLoading] = useState(true);

  const [activeFilters, setActiveFilters] = useState([
    { min: 90, max: 100 }, { min: 70, max: 89.99 }, { min: 50, max: 69.99 },
    { min: 30, max: 49.99 }, { min: 10, max: 29.99 }, { min: 0, max: 9.99 },
  ]);

  const applyFilters = useCallback((data, filters) => {
    if (filters.length === 0) return [];
    return data.filter((d) =>
      filters.some((f) => d.percentage >= f.min && d.percentage <= f.max)
    );
  }, []);

  const fetchData = useCallback(async () => {
    const email = localStorage.getItem("email");
    if (!email) return;

    try {
      setIsLoading(true);
      const [distRes, assemRes] = await Promise.all([
        getAllDistrictStatsForUser(email),
        getAllAssemblyStatsForUser(email)
      ]);

      if (distRes.success) {
        setAllDistrictStats(distRes.data.map((d) => {
          const total = d.totalCamera || 0;
          const connected = d.isLiveCount || 0;
          return {
            ...d,
            displayName: d.districtName || d.dist_name,
            totalCameras: total,
            connectedCameras: connected,
            percentage: total > 0 ? Math.round((connected / total) * 100) : 0
          };
        }));
      }

      if (assemRes.success) {
        setAllAssemblyStats(assemRes.data.map((a) => {
          const total = a.totalCamera || 0;
          const connected = a.isLiveCount || 0;
          return {
            ...a,
            displayName: a.accName, 
            totalCameras: total,
            connectedCameras: connected,
            percentage: total > 0 ? Math.round((connected / total) * 100) : 0
          };
        }));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    let baseData = [];
    if (selectedDistrict === "all") {
      baseData = allDistrictStats;
    } else {
      baseData = allAssemblyStats.filter(a => a.parentDistrict === selectedDistrict);
    }
    setFilteredStats(applyFilters(baseData, activeFilters));
  }, [allDistrictStats, allAssemblyStats, activeFilters, applyFilters, selectedDistrict]);

  const handleFilterChange = useCallback((item) => {
    setActiveFilters((prev) => {
      const exists = prev.some((f) => f.min === item.min && f.max === item.max);
      return exists ? prev.filter((f) => !(f.min === item.min && f.max === item.max)) : [...prev, item];
    });
  }, []);

  return (
    <>
      <MobileHeader title="Connected Heat Map" />

      <Box p={4} maxW="1500px" mx="auto" background={bgGradient} color={textColor} mb={6} minH="750px">
        
        <Flex justify="space-between" align="center" mb={6} wrap="wrap">
          <Text fontSize="xl" fontWeight="bold" color={textColor}>
            {selectedDistrict === "all" 
              ? " Connected Once Status " 
              : `Assembly Status: ${selectedDistrict}`}
          </Text>

          <Select 
            w="220px" 
            size="sm" 
            borderRadius="8px"
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

        {isLoading && filteredStats.length === 0 ? (
          <Center h="400px"><Spinner size="xl" /></Center>
        ) : (
          <Grid
            templateColumns={{
              base: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(4, 1fr)",
              lg: "repeat(7, 1fr)"
            }}
            gap={0}
          >
            {filteredStats.map((d, i) => (
              <ConnectedHeatMapTile
                key={d.assemblyCode || d.districtAssemblyCode || i}
                districtName={d.displayName} 
                connectedCount={d.connectedCameras}
                totalCount={d.totalCameras}
                percentage={d.percentage}
              />
            ))}
          </Grid>
        )}

        {!isLoading && filteredStats.length === 0 && (
           <Center h="200px">
              <Text color={textColor}>No data available for the selected filters.</Text>
           </Center>
        )}
      </Box>
    </>
  );
};

export default ConnectedHeatmap;
