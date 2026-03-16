import {
  Box,
  Flex,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Select,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Tabs,
  Text,
  Tooltip,
  useBreakpointValue,
  useColorModeValue,
  Spinner,
  Button,
  Input,
   Radio,
  RadioGroup
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import {
  getdistrictwiseAccess,
  getDistrictNameByAssemblyName,
  getYourCameras,
  getAssemblyWiseCameras,
  getDistrictWiseCameras,
} from "../actions/cameraActions";
import Player from "../components/Player";
import SimpleFLVPlayer from "../components/SimpleFLVPlayer"; // 1. FLV Player Import
import NoCameraFound from "../components/NoCameraFound";
import { PullToRefreshify } from "react-pull-to-refreshify";
import Loading from "../components/Loading";
import MobileHeader from "../components/MobileHeader";
import ChatPanel from "./ChatPanel";
import { BsArrowsFullscreen, BsVolumeMute, BsVolumeUp } from "react-icons/bs";

// --- Pagination Helper ---
const getPageNumbersForBlockPagination = (activePage, totalPages, windowSize = 3) => {
  if (totalPages <= 0) return [];
  const currentActivePage = Math.max(1, Math.min(activePage, totalPages));
  const blockIndex = Math.floor((currentActivePage - 1) / windowSize);
  const startPageOfBlock = blockIndex * windowSize + 1;
  const pages = [];
  for (let i = 0; i < windowSize; i++) {
    const pageNum = startPageOfBlock + i;
    if (pageNum > totalPages) break;
    pages.push(pageNum);
  }
  return pages;
};

function MultipleView() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [gridOption, setGridOption] = useState("2x2");
  const [gridLayout, setGridLayout] = useState("repeat(2, 1fr)");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef(null);
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(isMobile ? 6 : 4);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const placeholderColor = useColorModeValue("gray.600", "gray.400");

  const [camerasTab, setCamerasTab] = useState("My Cameras");
  const bgColor = useColorModeValue("custom.primary", "custom.darkModePrimary");

  // Filter Panel Theme Values
  const filterPanelBg = useColorModeValue("white", "rgba(0, 0, 0, 0.9)");
  const filterPanelColor = useColorModeValue("gray.800", "white");
  const filterPanelBorder = useColorModeValue("rgba(0,0,0,0.1)", "rgba(255,255,255,0.1)");
  const filterInputBg = useColorModeValue("gray.50", "rgba(255,255,255,0.1)");
  const filterInputColor = useColorModeValue("gray.800", "white");
  const filterInputBorder = useColorModeValue("gray.200", "transparent");
  const filterOptionBg = useColorModeValue("white", "#2D3748");
  const [mutedCameras, setMutedCameras] = useState({});

  const [userEmail, setUserEmail] = useState(typeof window !== 'undefined' ? localStorage.getItem("email") || '' : '');
  const [uniqueDistricts, setUniqueDistricts] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedAssemblyValue, setSelectedAssemblyValue] = useState("");
  const [selectedLocationType, setSelectedLocationType] = useState("all");

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingAssemblies, setLoadingAssemblies] = useState(false);
  const [districtError, setDistrictError] = useState("");
  const [assemblyError, setAssemblyError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [allFetchedCameras, setAllFetchedCameras] = useState([]);
  const [camerasToDisplay, setCamerasToDisplay] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const cardTextColor = useColorModeValue("gray.800", "white");
  const [psOption, setPsOption] = useState("ps"); // "ps" for Vehicle No, "camera" for Camera ID
  const [searchDeviceId, setSearchDeviceId] = useState("");
  const textColor = useColorModeValue("black", "white");

  const [autoRefreshInterval, setAutoRefreshInterval] = useState(0);
  const timerId = useRef(null);

  // --- URL GENERATION LOGIC (Production Safe) ---
  const generateStreamUrl = (camera) => {
    if (!camera) return "";

    // 1. SSAN Check
    if (camera.deviceId && camera.deviceId.startsWith("SSAN")) {
      return `wss://ptz.vmukti.com/live-record/${camera.deviceId}.flv`;
    }

    // 2. Existing P2P Logic
    if (camera.plan === "LIVE" && camera.p2purl && camera.token) {
      return `https://${camera.deviceId}.${camera.p2purl}/flv/live_ch0_0.flv?verify=${camera.token}`;
    }

    // 3. Media URL Logic
    if (camera.mediaUrl) {
      return `wss://${camera.mediaUrl}/jessica/DVR/${camera.deviceId}.flv`;
    }
    return "";
  };

  // --- Auto Refresh Timer ---
  useEffect(() => {
    if (timerId.current) clearInterval(timerId.current);
    if (autoRefreshInterval > 0 && totalPages > 1) {
      timerId.current = setInterval(() => {
        setActivePage((prevPage) => (prevPage >= totalPages ? 1 : prevPage + 1));
      }, autoRefreshInterval);
    }
    return () => { if (timerId.current) clearInterval(timerId.current); };
  }, [autoRefreshInterval, totalPages]);

  // --- Fetch Districts ---
  useEffect(() => {
    if (!userEmail) {
      setDistrictError("User email not found.");
      setUniqueDistricts([]);
      setLoadingDistricts(false);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      setDistrictError("");
      try {
        const response = await getdistrictwiseAccess(userEmail);
        if (response?.success && Array.isArray(response.matchedDistricts)) {
          const distinctDistrictsData = [];
          const seenNames = new Set();
          response.matchedDistricts.forEach(d => {
            if (d.dist_name && d.districtAssemblyCode && !seenNames.has(d.dist_name)) {
              distinctDistrictsData.push({ name: d.dist_name, districtAssemblyCode: d.districtAssemblyCode });
              seenNames.add(d.dist_name);
            }
          });
          setUniqueDistricts(distinctDistrictsData.sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          setDistrictError(response?.message || "No districts found.");
          setUniqueDistricts([]);
        }
      } catch (err) {
        setDistrictError(err.message || "Error fetching districts.");
        setUniqueDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [userEmail]);

  // --- Fetch Assemblies ---
  useEffect(() => {
    if (userEmail && selectedDistrictName) {
      const fetchAssembliesForDistrict = async () => {
        setLoadingAssemblies(true);
        setAssemblyError("");
        try {
          const response = await getDistrictNameByAssemblyName(userEmail, selectedDistrictName);
          if (response.success && Array.isArray(response.districts)) {
            const sortedAssemblies = response.districts.sort((a, b) =>
              (a.accName || a.name || '').localeCompare(b.accName || b.name || '')
            );
            setAssemblies(sortedAssemblies);
          } else {
            setAssemblyError(response.message || "Failed to fetch assemblies.");
            setAssemblies([]);
          }
        } catch (error) {
          setAssemblyError("Error fetching assemblies.");
          setAssemblies([]);
        } finally {
          setLoadingAssemblies(false);
        }
      };
      fetchAssembliesForDistrict();
    } else {
      setAssemblies([]);
    }
  }, [userEmail, selectedDistrictName]);

  // Reset all mutes to "True" (Default) whenever the page or layout changes
useEffect(() => {
  setMutedCameras({});
}, [activePage, itemsPerPage]);

  // --- Mute/Fullscreen Handlers ---
const toggleMute = (deviceId) => {
    setMutedCameras(prev => ({
      ...prev,
      // Default to true (muted) if undefined, then flip
      [deviceId]: !(prev[deviceId] ?? true) 
    }));
    
    // Remove the manual "video.muted" lines here. 
    // Your Player.js component is now handling the audio engine correctly via the 'muted' prop.
  };

  const toggleCameraFullscreen = (deviceId) => {
    const el = document.getElementById(`camera-box-${deviceId}`);
    if (!el) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    } else {
      el.requestFullscreen?.() || el.webkitRequestFullscreen?.();
    }
  };

 const toggleFullScreen = () => {
    const container = containerRef.current;
    if (!container) return;
    
    if (!isFullScreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
      // Do NOT set activePage(1) here
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  function renderText(pullStatus, percent) {
    switch (pullStatus) {
      case "pulling":
        return <div style={{ display: "flex", alignItems: "center", height: 50 }}><Loading percent={percent} /><div style={{ whiteSpace: "nowrap", marginLeft: "8px" }}>Pull down</div></div>;
      case "canRelease": return `Release`;
      case "refreshing": return "Refreshing...";
      case "complete": return "Refresh succeed";
      default: return "";
    }
  }

  // --- Data Fetching ---
  const fetchCamerasByFilters = async () => {
    if (!userEmail && camerasTab === "My Cameras") {
      setIsLoading(false); setAllFetchedCameras([]); return;
    }
    if (camerasTab !== "My Cameras") { setIsLoading(false); return; }

    setIsLoading(true);
    setAllFetchedCameras([]);
    try {
      let response;
      if (selectedAssemblyValue && selectedDistrictName) {
        response = await getAssemblyWiseCameras(userEmail, selectedDistrictName, selectedAssemblyValue);
      } else if (selectedDistrictName) {
        response = await getDistrictWiseCameras(userEmail, selectedDistrictName);
      } else {
        response = await getYourCameras(userEmail);
      }

      let fetchedCameras = Array.isArray(response) ? response : [];
      // Sorting: Online first
      fetchedCameras.sort((a, b) => {
        const aStatus = !!a.status;
        const bStatus = !!b.status;
        if (aStatus && !bStatus) return -1;
        if (!aStatus && bStatus) return 1;
        return 0;
      });

      setAllFetchedCameras(fetchedCameras);

    } catch (err) {
      console.error("Camera Fetch Error:", err);
      setAllFetchedCameras([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Pagination & Filtering Logic ---
useEffect(() => {
  if (isLoading) return;

  let camerasToProcess = allFetchedCameras;

  // 1. APPLY ROLE-BASED RESTRICTION (Keep from Local)
  const currentUserRole = localStorage.getItem("role");
  if (currentUserRole === "CEO" || currentUserRole === "ECI") {
    camerasToProcess = camerasToProcess.filter(camera => !!camera.status);
  }

  // 2. LOCATION TYPE FILTER
  if (selectedLocationType && selectedLocationType !== 'all') {
    camerasToProcess = camerasToProcess.filter(camera => {
      const locationType = camera.location_Type ? camera.location_Type.toLowerCase() : null;
      if (selectedLocationType === 'auxiliary') return locationType === 'auxiliary';
      return locationType === selectedLocationType;
    });
  }

  // 3. INTEGRATED SEARCH LOGIC (From Github)
  const activeSearch = searchDeviceId.trim() || searchInput.trim();
  if (activeSearch !== "") {
    const term = activeSearch.toLowerCase();
    camerasToProcess = camerasToProcess.filter(c => {
      if (psOption === "ps") {
        // Search by Vehicle No (checks locations array or location string)
        const vehicleNo = Array.isArray(c.locations) ? c.locations[0] : (c.location || "");
        return String(vehicleNo).toLowerCase().includes(term);
      } else {
        // Search by Camera ID or Name
        return (
          c.deviceId?.toLowerCase().includes(term) || 
          c.name?.toLowerCase().includes(term) ||
          c.operatorName?.toLowerCase().includes(term)
        );
      }
    });
  }

  // 4. Update Pagination (Keep from Local)
  const calculatedTotalPages = Math.ceil(camerasToProcess.length / itemsPerPage);
  setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);

  let currentPageToUse = activePage;
  if (activePage > calculatedTotalPages && calculatedTotalPages > 0) currentPageToUse = calculatedTotalPages;
  else if (calculatedTotalPages > 0 && activePage < 1) currentPageToUse = 1;

  if (currentPageToUse !== activePage) setActivePage(currentPageToUse);

  const startIndex = (currentPageToUse - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  setCamerasToDisplay(camerasToProcess.slice(startIndex, endIndex));

}, [allFetchedCameras, searchInput, searchDeviceId, psOption, activePage, itemsPerPage, isLoading, selectedLocationType]);


  const refreshMultipleCameras = () => {
    return new Promise(async (resolve) => {
      setRefreshing(true);
      try { await fetchCamerasByFilters(); resolve(); } catch (e) { resolve(); } finally { setRefreshing(false); }
    });
  };

  const setMainCameraIndex = (index) => {
    if (index >= 0 && index < camerasToDisplay.length) setCurrentCameraIndex(index);
  };

  const getResponsivePlayerStyle = () => ({
    width: "100%",
    height: "auto",
    aspectRatio: "16 / 9",
    borderRadius: "8px",
  });

  const handleGridChange = (event) => {
    const value = event.target.value;
    if (value === gridOption) return; // Add this to prevent unnecessary resets

    setGridOption(value);
    let newItemsPerPage = 4;
    switch (value) {
      case "2x2": newItemsPerPage = 4; setGridLayout("repeat(2, 1fr)"); break;
      case "3x3": newItemsPerPage = 6; setGridLayout("repeat(3, 1fr)"); break;
      default: newItemsPerPage = 4; setGridLayout("repeat(2, 1fr)");
    }
    setItemsPerPage(newItemsPerPage);
    setActivePage(1); // Only reset to page 1 when the grid size changes
  };

  const handleDistrictChange = async (event) => {
    const selectedDistName = event.target.value;
    console.log("selectedDistName: ", selectedDistName);

    setSelectedDistrictName(selectedDistName);
    setSelectedAssemblyValue('');
    setSelectedLocationType('all');
    setAssemblies([]);
    setAssemblyError("");

    // activePage reset is handled by the effect below
  };

  const handleAssemblyChange = (e) => setSelectedAssemblyValue(e.target.value);
  const handlePageChange = (page) => setActivePage(page);

  useEffect(() => {
    if (activePage !== 1) setActivePage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrictName, selectedAssemblyValue, searchInput, selectedLocationType]);

  useEffect(() => {
    if (camerasTab === "My Cameras" && userEmail) fetchCamerasByFilters();
    else if (!userEmail && camerasTab === "My Cameras") { setIsLoading(false); setAllFetchedCameras([]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrictName, selectedAssemblyValue, userEmail, camerasTab]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullScreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullScreenChange);
    };
  }, []);

 

  const Camera = camerasToDisplay.length > 0 && currentCameraIndex < camerasToDisplay.length ? camerasToDisplay[currentCameraIndex] : null;
  const text = useColorModeValue('gray.500', 'gray.400');
  const buttonGradientColor = useColorModeValue("linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)", "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)");

  return (
    <Box maxW="1440px" mx="auto" height={isMobile ? "calc(100vh - 90px)" : "auto"} overflowY={isMobile ? "auto" : "visible"}>
      {!isMobile && (
        <Box maxW="1440px" mx="auto" mt={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexDirection={{ base: "column", md: "row" }} mb={4}>
            <Text fontWeight={400} fontSize="26px" color={text}>Multiscreen</Text>
            <Flex justifyContent={"space-between"} alignItems={"center"} gap={2} flexWrap="wrap">
              {totalPages > 1 && (
                <Flex align="center" justify="center" gap={1}>
                  <Button size="sm" onClick={() => handlePageChange(activePage - 1)} isDisabled={activePage === 1}>previous</Button>
                  {getPageNumbersForBlockPagination(activePage, totalPages, 3).map((page) => (
                    <Button key={`desktop-page-${page}`} size="sm" colorScheme={activePage === page ? "#65758B" : "gray"} variant={activePage === page ? "solid" : "outline"} onClick={() => handlePageChange(page)} bg={bgColor}>{page}</Button>
                  ))}
                  <Button size="sm" onClick={() => handlePageChange(activePage + 1)} isDisabled={activePage === totalPages}>next</Button>
                </Flex>
              )}
              <Select bg={bgColor} width={{ base: "100%", md: "120px" }} mt={{ base: 2, md: 0 }} mb={-2} value={gridOption} onChange={handleGridChange} borderRadius={"8px"}>
                <option value="2x2">2x2 Grid</option>
                <option value="3x3">3x2 Grid</option>
              </Select>
              <Tooltip label="Fullscreen"><IconButton bg={bgColor} borderRadius={"8px"} icon={<BsArrowsFullscreen />} onClick={toggleFullScreen} boxSize={"10"} variant="outline" /></Tooltip>
            </Flex>
          </Box>
          <Flex gap={4} flexWrap="wrap" mb={{ base: 2, md: 2 }}>

            <Select value={selectedDistrictName} onChange={handleDistrictChange} placeholder={loadingDistricts ? "Loading..." : "Select District"} isDisabled={loadingDistricts || !userEmail} borderRadius="10px" bg={buttonGradientColor} w={"auto"} height={"34px"} fontSize={"12px"}>
              {uniqueDistricts.map((d) => (<option key={d.dist_name} value={d.name}>{d.name}</option>))}
            </Select>


            <Select value={selectedAssemblyValue} onChange={handleAssemblyChange} placeholder={loadingAssemblies ? "Loading..." : "Select Assembly"} isDisabled={!selectedDistrictName} borderRadius="10px" bg={buttonGradientColor} w={"auto"} height={"34px"} fontSize={"12px"}>
              {assemblies.map((a) => (<option key={a._id} value={a.accName}>{a.accName}</option>))}
            </Select>

             {/* NEW SEARCH TOGGLE FROM GITHUB */}
  <RadioGroup onChange={setPsOption} value={psOption}>
    <HStack spacing={3}>
      <Radio value="ps" size="md" colorScheme="blue">
        <Text fontSize="12px" fontWeight={psOption === "ps" ? "bold" : "normal"}>Location</Text>
      </Radio>
      <Radio value="camera" size="md" colorScheme="blue">
        <Text fontSize="12px" fontWeight={psOption === "camera" ? "bold" : "normal"}>Camera ID</Text>
      </Radio>
    </HStack>
  </RadioGroup>

  <Input
    placeholder={psOption === "ps" ? "Search Location" : "Search Camera ID"}
    value={searchDeviceId}
    onChange={(e) => setSearchDeviceId(e.target.value)}
    width={"160px"}
    height={"34px"}
    fontSize={"12px"}
    bg={buttonGradientColor}
    borderRadius={"10px"}
    _placeholder={{ color: placeholderColor }}
  />

            <Select mt={{ base: 2, md: 0 }} mb={-2} value={autoRefreshInterval} onChange={(e) => setAutoRefreshInterval(Number(e.target.value))} borderRadius={"8px"} bg={buttonGradientColor} width={"70px"} height={"34px"} fontSize={"12px"}>
              <option value={0}>Off</option>
              <option value={45000}>45s</option>
              <option value={60000}>60s</option>
            </Select>
          </Flex>

          <Box ref={containerRef} position="relative" width="100%" bg={isFullScreen ? bgColor : "transparent"} overflow={isFullScreen ? "auto" : "visible"}>
            {isFullScreen && (
              <Box position="absolute" top="4" right="4" zIndex="1000"><Button onClick={() => setShowFilterPanel(!showFilterPanel)} colorScheme="blue" size="sm" borderRadius="full">Filter</Button></Box>
            )}
            {isFullScreen && totalPages > 1 && (
              <Box position="absolute" top="4" left="50%" transform="translateX(-50%)" zIndex="1000">
                <Flex align="center" justify="center" gap={1}>
                  <Button size="sm" colorScheme="gray" variant="outline" onClick={() => handlePageChange(activePage - 1)} isDisabled={activePage === 1}>previous</Button>
                  
                  {getPageNumbersForBlockPagination(activePage, totalPages, 3).map((page) => (
                    <Button
                      key={`fs-pagination-${page}`} 
                      size="sm"
                      colorScheme="gray"
                      variant={activePage === page ? "solid" : "outline"}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button size="sm" colorScheme="gray" variant="outline" onClick={() => handlePageChange(activePage + 1)} isDisabled={activePage === totalPages}>next</Button>
                </Flex>
              </Box>
            )}
            {isFullScreen && showFilterPanel && (
              <Box position="fixed" top="4" right="4" bottom="4" width="300px" bg={filterPanelBg} backdropFilter="blur(20px)" borderRadius="2xl" zIndex="999" p={6} boxShadow="dark-lg" color={filterPanelColor} border={`1px solid ${filterPanelBorder}`}>
                <Flex justifyContent="space-between" alignItems="center" mb={6} bg="blue.500" p={2} borderRadius="xl" boxShadow="md">
                  <Text fontSize="md" fontWeight="bold" color="white" px={2}>Filter Options</Text>
                  <IconButton size="sm" variant="ghost" color="white" icon={<Text>×</Text>} onClick={() => setShowFilterPanel(false)} aria-label="Close" />
                </Flex>
                <Flex flexDirection="column" gap={4}>
                  {/* Re-implementing filter logic inside panel for fullscreen */}
                  <Box>
                    <Text fontSize="2xs" mb={1} color="white" bg="blue.500" px={2} py={0.5} borderRadius="md" w="fit-content" fontWeight="bold" textTransform="uppercase">Select District</Text>
                    <Select value={selectedDistrictName} onChange={handleDistrictChange} placeholder="All District" bg={filterInputBg} color={filterInputColor}>{uniqueDistricts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}</Select>
                  </Box>
                  <Box>
                    <Text fontSize="2xs" mb={1} color="white" bg="blue.500" px={2} py={0.5} borderRadius="md" w="fit-content" fontWeight="bold" textTransform="uppercase">Select Assembly</Text>
                    <Select value={selectedAssemblyValue} onChange={handleAssemblyChange} placeholder="All Assembly" bg={filterInputBg} color={filterInputColor}>{assemblies.map(a => <option key={a.accName} value={a.accName}>{a.accName}</option>)}</Select>
                  </Box>
                  <Box>
                    <Text fontSize="2xs" mb={1} color="white" bg="blue.500" px={2} py={0.5} borderRadius="md" w="fit-content" fontWeight="bold" textTransform="uppercase">Select Grid Layout</Text>
                    <Select
                      value={gridOption}
                      onChange={handleGridChange}
                      bg={filterInputBg}
                      color={filterInputColor}
                      borderColor={filterInputBorder}
                      borderRadius="xl"
                      height="45px"
                    >
                      <option value="2x2" style={{ background: filterOptionBg, color: filterInputColor }}>2x2 Grid</option>
                      <option value="3x3" style={{ background: filterOptionBg, color: filterInputColor }}>3x2 Grid</option>
                    </Select>
                  </Box>

                  <Box>
                    <Text fontSize="2xs" mb={1} color="white" bg="blue.500" px={2} py={0.5} borderRadius="md" w="fit-content" fontWeight="bold" textTransform="uppercase">Select Auto Refresh</Text>
                    <Select
                      value={autoRefreshInterval}
                      onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                      bg={filterInputBg}
                      color={filterInputColor}
                      borderColor={filterInputBorder}
                      borderRadius="xl"
                      height="45px"
                    >
                      <option value={0} style={{ background: filterOptionBg, color: filterInputColor }}>NONE</option>
                      <option value={45000} style={{ background: filterOptionBg, color: filterInputColor }}>45 sec</option>
                      <option value={60000} style={{ background: filterOptionBg, color: filterInputColor }}>60 sec</option>
                    </Select>
                  </Box>

                  {/* <Box>
                    <Text fontSize="2xs" mb={1} color="white" bg="blue.500" px={2} py={0.5} borderRadius="md" w="fit-content" fontWeight="bold" textTransform="uppercase">Search</Text>
                    <Input
                      placeholder="Search camera..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      bg={filterInputBg}
                      color={filterInputColor}
                      borderColor={filterInputBorder}
                      borderRadius="xl"
                      height="45px"
                      _placeholder={{ color: "gray.500" }}
                    />
                  </Box> */}

                  {/* <Button
                    mt={4}
                    colorScheme="blue"
                    borderRadius="xl"
                    height="45px"
                    onClick={() => setShowFilterPanel(false)}
                    boxShadow="lg"
                  >
                    Search
                  </Button> */}
                </Flex>
              </Box>
            )}

           {/* Inside the Desktop Grid .map loop (around line 470) */}
<Grid templateColumns={gridLayout} gap={1} width="100%" pt={isFullScreen ? 2 : 0} borderRadius="md" boxShadow="sm" overflow="hidden">
  {camerasToDisplay.length > 0 ? camerasToDisplay.map((camera, index) => {
    // Local variable to determine mute state (Default to true)
    const isMuted = mutedCameras[camera.deviceId] ?? true;

    return (
      <Box key={camera.deviceId + "-desktop" + index} id={`camera-box-${camera.deviceId}`} position="relative" borderRadius="8px" overflow="hidden" >
        <Box position="relative">
          {camera.deviceId && camera.deviceId.startsWith("SSAN") ? (
            <SimpleFLVPlayer 
              url={generateStreamUrl(camera)} 
              style={getResponsivePlayerStyle()} 
              muted={isMuted} 
            />
          ) : (
            <Player
              device={camera}
              initialPlayUrl={generateStreamUrl(camera)}
              width="100%"
              style={getResponsivePlayerStyle()}
              height="100%"
              showControls={false}
              showOverlay={false}
              muted={isMuted} // Passing to updated Player.js
            />
          )}

          <Box position="absolute" bottom="0" left="0" right="0" bg="rgba(0, 0, 0, 0.5)" p={2} zIndex="10">
  <Text color="white" fontSize="11px" fontWeight="500" noOfLines={1}>
    {camera.dist_name} / {camera.accName} / 
    {Array.isArray(camera.locations) ? ` ${camera.locations[0]} / ` : ""} 
    {camera.name}
  </Text>
</Box>

          {/* Action Buttons Overlay - Fixed width/variant prevents collapsing */}
          <HStack position="absolute" bottom="35px" right="10px" zIndex="20" spacing={2}>
            <IconButton 
              variant="solid" 
              size="sm" 
              bg="rgba(0,0,0,0.6)" 
              _hover={{ bg: "black" }}
              color="white" 
              borderRadius="full"
              icon={isMuted ? <BsVolumeMute fontSize="18px" /> : <BsVolumeUp fontSize="18px" />} 
              onClick={() => toggleMute(camera.deviceId)} 
            />
            <IconButton 
              variant="solid" 
              size="sm" 
              bg="rgba(0,0,0,0.6)" 
              _hover={{ bg: "black" }}
              color="white" 
              borderRadius="full"
              icon={<BsArrowsFullscreen fontSize="16px" />} 
              onClick={() => toggleCameraFullscreen(camera.deviceId)} 
            />
          </HStack>
        </Box>
      </Box>
    );
  }) : (!isLoading && <GridItem colSpan={2}><NoCameraFound title="No cameras" /></GridItem>)}
</Grid>
          </Box>
        </Box>
      )}

      <Flex align="center" justifyContent="space-between" w="100%" mt={{ base: "12", md: "0" }} mb={4} flexWrap={{ base: "wrap", md: "nowrap" }}>
        <Tabs display={{ base: "none", md: "block" }} variant="filled" borderRadius="10px" minW="200px" />
      </Flex>

      <MobileHeader title="Multiscreen" />

      {isMobile && (
        <Box p={2} mt="50px">
          {totalPages > 1 && (
            <Flex align="center" justify="center" gap={1} mb={3}>
              <Button size="xs" bg={bgColor} onClick={() => handlePageChange(activePage - 1)} isDisabled={activePage === 1}>Prev</Button>
              {getPageNumbersForBlockPagination(activePage, totalPages, 3).map((page) => (
                <Button key={`mob-${page}`} size="xs" bg={bgColor} colorScheme={activePage === page ? "blue" : "gray"} onClick={() => handlePageChange(page)}>{page}</Button>
              ))}
              <Button size="xs" bg={buttonGradientColor} onClick={() => handlePageChange(activePage + 1)} isDisabled={activePage === totalPages}>Next</Button>
            </Flex>
          )}
          <Flex direction="column" gap={2}>
            <Flex gap={2}>
              <Select value={selectedDistrictName} onChange={handleDistrictChange} placeholder="District" size="sm" borderRadius="8px" bg={buttonGradientColor}>{uniqueDistricts.map((d) => (<option key={d.dist_name} value={d.name}>{d.name}</option>))}</Select>
              <Select value={selectedAssemblyValue} onChange={handleAssemblyChange} placeholder="Assembly" size="sm" borderRadius="8px" bg={buttonGradientColor} isDisabled={!selectedDistrictName}>{assemblies.map((a) => (<option key={a._id} value={a.accName}>{a.accName}</option>))}</Select>
            </Flex>
            <Flex gap={2}>
              <Input placeholder="Search..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} size="sm" borderRadius="8px" bg={buttonGradientColor} />
              <Select value={autoRefreshInterval} onChange={(e) => setAutoRefreshInterval(Number(e.target.value))} size="sm" borderRadius="8px" bg={buttonGradientColor} width="120px"><option value={0}>Off</option><option value={45000}>45s</option><option value={60000}>60s</option></Select>
            </Flex>
          </Flex>
        </Box>
      )}

      {camerasTab === "My Cameras" ? (
        <>
          {isLoading ? (
            <SimpleGrid columns={{ base: 1, sm: 2, md: itemsPerPage === 9 ? 3 : 2 }} spacing={4} mt={{ base: "12", md: "2" }}>
              {Array.from({ length: itemsPerPage }).map((_, index) => (
                <GridItem key={index}><Skeleton height={isMobile ? "172px" : "242px"} borderRadius="8px" /></GridItem>
              ))}
            </SimpleGrid>
          ) : allFetchedCameras.length > 0 ? (
            <>
              {isMobile && (
                <PullToRefreshify refreshing={refreshing} onRefresh={refreshMultipleCameras} renderText={renderText}>
                  <Box mt={{ base: "2", md: "0" }}>
                    {Camera ? (
                      <Box key={Camera.deviceId + "-main"} borderRadius="md" p={0} mb={2} width="100%" overflow="hidden" position="relative" id={`camera-box-${Camera.deviceId}`}>
                        <Box position="relative">
                          <Box id={`video-${Camera.deviceId}`}>
                           {/* Replace Main Mobile Player (around line 560) */}
{Camera.deviceId && Camera.deviceId.startsWith("SSAN") ? (
  <SimpleFLVPlayer url={generateStreamUrl(Camera)} style={getResponsivePlayerStyle()} muted={mutedCameras[Camera.deviceId] ?? true} />
) : (
  <Player device={Camera} initialPlayUrl={generateStreamUrl(Camera)} width="100%" style={getResponsivePlayerStyle()} height="100%" showControls={false} showOverlay={false} muted={mutedCameras[Camera.deviceId] ?? true} />
)}

{/* Mobile Main Mute Button */}
<IconButton 
  variant="solid" 
  size="sm" 
  bg="rgba(0,0,0,0.6)" 
  color="white" 
  borderRadius="full" 
  icon={(mutedCameras[Camera.deviceId] ?? true) ? <BsVolumeMute fontSize="20px" /> : <BsVolumeUp fontSize="20px" />} 
  onClick={() => toggleMute(Camera.deviceId)} 
/>
                            <Box position="absolute" bottom="0" left="0" right="0" bg="rgba(0,0,0,0.5)" p={2} zIndex="10"><Text color="white" fontSize="12px" fontWeight="500">
                              {Camera.dist_name} / {Camera.accName} / {Camera.name} / {Camera.operatorName} / {Camera.operatorMobile}
                            </Text></Box>
                          </Box>
                          {!(Camera.deviceId && Camera.deviceId.startsWith("SSAN")) && (
                            <HStack position="absolute" bottom="40px" right="15px" zIndex="20" spacing={3}>
                              <IconButton variant="solid" size="sm" bg="rgba(0,0,0,0.6)" color="white" borderRadius="full" icon={<BsVolumeMute fontSize="20px" />} onClick={() => toggleMute(Camera.deviceId)} />
                              <IconButton variant="solid" size="sm" bg="rgba(0,0,0,0.6)" color="white" borderRadius="full" icon={<BsArrowsFullscreen fontSize="18px" />} onClick={() => toggleCameraFullscreen(Camera.deviceId)} />
                            </HStack>
                          )}
                        </Box>

                        <HStack justifyContent="space-between" alignItems="center">
                          <Text fontSize="small" p={1}>
                            {/* {Camera.dist_name} / {Camera.accName} / {Camera.name} / {Camera.operatorName} / {Camera.operatorMobile} */}
                          </Text>
                        </HStack>
                      </Box>
                    ) : (!isLoading && <NoCameraFound title="No Camera" description="Tap below." />)}

                    <Box overflowY="auto" maxH="auto" pb={0}>
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                        {camerasToDisplay.map((camera, index) => (
                          <GridItem key={camera.deviceId + "-grid"}>
                            <Box onClick={() => setMainCameraIndex(index)} borderRadius="md" p={0} mb={0} width="100%" position="relative" overflow="hidden" id={`camera-box-${camera.deviceId}`}>
                              <Box position="relative">
                                {/* Replace Mobile Grid Player (around line 595) */}
{camera.deviceId && camera.deviceId.startsWith("SSAN") ? (
  <SimpleFLVPlayer url={generateStreamUrl(camera)} style={getResponsivePlayerStyle()} muted={mutedCameras[camera.deviceId] ?? true} />
) : (
  <Player device={camera} initialPlayUrl={generateStreamUrl(camera)} width="100%" style={getResponsivePlayerStyle()} height="100%" showControls={false} showOverlay={false} muted={mutedCameras[camera.deviceId] ?? true} />
)}

{/* Mobile Grid Mute Button */}
<IconButton 
  size="xs" 
  variant="solid" 
  bg="rgba(0,0,0,0.6)" 
  color="white" 
  borderRadius="full"
  icon={(mutedCameras[camera.deviceId] ?? true) ? <BsVolumeMute /> : <BsVolumeUp />} 
  onClick={(e) => { e.stopPropagation(); toggleMute(camera.deviceId); }} 
/>
                                <Box position="absolute" bottom="0" left="0" right="0" bg="rgba(0,0,0,0.5)" p={1} zIndex="10"><Text color="white" fontSize="10px" noOfLines={1}>
                                  {camera.dist_name} / {camera.accName} / {camera.name} / {camera.operatorName} / {camera.operatorMobile}
                                </Text></Box>
                                {!(camera.deviceId && camera.deviceId.startsWith("SSAN")) && (
                                  <HStack position="absolute" bottom="25px" right="5px" zIndex="20" spacing={1}>
                                    <IconButton size="xs" variant="solid" bg="rgba(0,0,0,0.5)" color="white" icon={<BsVolumeMute />} onClick={(e) => { e.stopPropagation(); toggleMute(camera.deviceId); }} />
                                    <IconButton size="xs" variant="solid" bg="rgba(0,0,0,0.5)" color="white" icon={<BsArrowsFullscreen />} onClick={(e) => { e.stopPropagation(); toggleCameraFullscreen(camera.deviceId); }} />
                                  </HStack>
                                )}
                              </Box>
                            </Box>
                          </GridItem>
                        ))}
                      </SimpleGrid>
                    </Box>
                  </Box>
                </PullToRefreshify>
              )}
            </>
          ) : (<NoCameraFound title="No Cameras" description="Check filters." />)}
        </>
      ) : (<ChatPanel />)}
    </Box>
  );
}

export default MultipleView;
