import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box as ChakraBox,
  Grid,
  Select,
  Input,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Flex,
  Spinner,
  Badge,
  useColorModeValue,
  Link as ChakraLink,
  useToast,
  HStack,
  Box
} from "@chakra-ui/react";
import { IoRefreshOutline } from "react-icons/io5";
import { FaDownload, FaFilePdf } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Link as RouterLink, useLocation } from "react-router-dom";

// --- Helper Styles ---
const tableHeaderRowStyle = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  borderRadius: "5px"
};

const tableHeaderStyle = {
  padding: "8px 10px",
  verticalAlign: "middle",
  textAlign: "center",
  position: "relative",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontSize: "12px",
  fontWeight: "bold"
};

const tableDataStyle = {
  padding: "8px 10px",
  verticalAlign: "middle",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  position: "relative",
  borderBottom: "1px solid #6c8aa5ff",
  fontSize: "12px"
};

const tableContainerStyle = {
  maxHeight: "calc(100vh - 250px)",
  overflowY: "auto",
  overflowX: "auto",
  border: "1px solid #b3b8d6ff",
  borderRadius: "5px",
};

const VerticalLine = () => (
  <span
    style={{
      position: "absolute",
      right: "0",
      top: "50%",
      transform: "translateY(-50%)",
      height: "60%",
      width: "2px",
      backgroundColor: "#3F77A5",
    }}
  ></span>
);

// --- Helper: Distance Calculation ---
const calculateTotalDistance = (gpsData) => {
  if (!gpsData || gpsData.length < 2) return "0.00";
  const toRad = (x) => (x * Math.PI) / 180;
  let totalDistance = 0;
  const R = 6371;

  for (let i = 0; i < gpsData.length - 1; i++) {
    const lat1 = parseFloat(gpsData[i].latitude || gpsData[i].lat);
    const lon1 = parseFloat(gpsData[i].longitude || gpsData[i].long);
    const lat2 = parseFloat(gpsData[i + 1].latitude || gpsData[i + 1].lat);
    const lon2 = parseFloat(gpsData[i + 1].longitude || gpsData[i + 1].long);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) continue;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
  }
  return totalDistance.toFixed(2);
};

const TripReport = () => {
  // --- Theme ---
  const buttonGradientColor = useColorModeValue(
    "linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)",
    "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)"
  );
  const textColor = useColorModeValue("gray.500", "white");

  // --- State ---
  const [allCameras, setAllCameras] = useState([]);
  const [filteredCameras, setFilteredCameras] = useState([]);
  
  const [districtsList, setDistrictsList] = useState([]);
  const [assembliesList, setAssembliesList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);

  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedAssembly, setSelectedAssembly] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Data Cache & Loading
  const [tripDataCache, setTripDataCache] = useState({});
  const [loadingRows, setLoadingRows] = useState({});
  const [initialLoading, setInitialLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false); // For PDF/Excel buttons

  const toast = useToast();
  const location = useLocation(); 

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // --- 1. Fetch & Normalize Data ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      const userEmail = localStorage.getItem("email");
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_URL}/api/camera/getcurrentUserCameras`,
          { email: userEmail }
        );
        const rawData = Array.isArray(response.data) ? response.data : [];

        // Normalize
        const normalizedData = rawData.map(item => ({
          ...item,
          district: item.dist_name || "Unknown",
          assembly: item.accName || "Unknown",
          vehicleNo: (Array.isArray(item.locations) && item.locations.length > 0)
            ? item.locations[0]
            : "N/A"
        }));

        setAllCameras(normalizedData);
        setFilteredCameras(normalizedData);

        const districts = [...new Set(normalizedData.map((c) => c.district).filter(d => d !== "Unknown"))];
        setDistrictsList(districts.sort());
      } catch (error) {
        console.error("Error fetching cameras:", error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- 2. Filter Logic ---
  useEffect(() => {
    let data = [...allCameras];
    if (selectedDistrict) data = data.filter((c) => c.district === selectedDistrict);
    if (selectedAssembly) data = data.filter((c) => c.assembly === selectedAssembly);
    if (selectedVehicle) data = data.filter((c) => c.vehicleNo === selectedVehicle);
    setFilteredCameras(data);
    setCurrentPage(1);
  }, [selectedDistrict, selectedAssembly, selectedVehicle, allCameras]);

  // Dropdowns
  useEffect(() => {
    if (selectedDistrict) {
      const filtered = allCameras.filter((c) => c.district === selectedDistrict);
      const assemblies = [...new Set(filtered.map((c) => c.assembly))];
      setAssembliesList(assemblies.sort());
    } else {
      setAssembliesList([]);
    }
  }, [selectedDistrict, allCameras]);

  useEffect(() => {
    if (selectedAssembly) {
      const filtered = allCameras.filter((c) => c.assembly === selectedAssembly);
      const vehicles = [...new Set(filtered.map(c => c.vehicleNo).filter(v => v !== "N/A"))];
      setVehiclesList(vehicles.sort());
    } else {
      setVehiclesList([]);
    }
  }, [selectedAssembly, allCameras]);

  // --- 3. Core Logic: Process Single Camera ---
  // Returns trip data for one camera (checks cache or calls API)
  const getTripDataForCamera = async (camera) => {
    const vehicleNo = camera.vehicleNo;
    if (!vehicleNo || vehicleNo === "N/A" || vehicleNo.trim() === "") {
        return { distance: "-", startTime: "-", endTime: "-", startAddress: "-", endAddress: "-" };
    }

    const cacheKey = `${vehicleNo}_${selectedDate}`;
    
    // Return cached if available
    if (tripDataCache[cacheKey]) return tripDataCache[cacheKey];

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_URL}/api/gps/getAllGpsData`,
        { name: vehicleNo, date: selectedDate }
      );
      const history = response.data;

      if (!history || history.length === 0) {
        const emptyResult = { distance: "0.00", startTime: "-", endTime: "-", startAddress: "-", endAddress: "-" };
        // Update Cache (optional: careful with state updates in loops)
        return emptyResult;
      }

      history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const dist = calculateTotalDistance(history);
      const first = history[0];
      const last = history[history.length - 1];
      const startLat = parseFloat(first.latitude || first.lat).toFixed(4);
      const startLong = parseFloat(first.longitude || first.long).toFixed(4);
      const endLat = parseFloat(last.latitude || last.lat).toFixed(4);
      const endLong = parseFloat(last.longitude || last.long).toFixed(4);

      const result = {
        distance: dist,
        startTime: new Date(first.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(last.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        startAddress: `Lat:${startLat}, Lng:${startLong}`,
        endAddress: `Lat:${endLat}, Lng:${endLong}`,
      };
      
      return result;

    } catch (error) {
      console.error(`Error ${vehicleNo}`, error);
      return { distance: "Error", startTime: "-", endTime: "-", startAddress: "-", endAddress: "-" };
    }
  };

  // --- 4. Lazy Load for Table ---
  const fetchTripDataForRow = async (camera) => {
    const vehicleNo = camera.vehicleNo;
    if (!vehicleNo || vehicleNo === "N/A" || vehicleNo.trim() === "") return;

    const cacheKey = `${vehicleNo}_${selectedDate}`;
    if (tripDataCache[cacheKey] || loadingRows[vehicleNo]) return;

    setLoadingRows((prev) => ({ ...prev, [vehicleNo]: true }));

    const data = await getTripDataForCamera(camera);
    
    setTripDataCache((prev) => ({ ...prev, [cacheKey]: data }));
    setLoadingRows((prev) => ({ ...prev, [vehicleNo]: false }));
  };

  useEffect(() => {
    if (filteredCameras.length === 0) return;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const visibleCameras = filteredCameras.slice(start, end);
    visibleCameras.forEach((cam) => fetchTripDataForRow(cam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filteredCameras, selectedDate]);


  // --- 5. Export Logic ---
  
  // Helper to gather data for ALL filtered rows
  const getExportData = async () => {
    setExportLoading(true);
    const rows = [];
    
    // Process all filtered cameras (Note: this might take time if list is huge)
    // We limit concurrency or just await sequentially for safety
    for (let i = 0; i < filteredCameras.length; i++) {
        const cam = filteredCameras[i];
        
        // Use helper function that checks cache first
        const tripInfo = await getTripDataForCamera(cam); 
        
        // Update cache so UI updates too if user scrolls there later
        if(cam.vehicleNo && cam.vehicleNo !== "N/A") {
             const cacheKey = `${cam.vehicleNo}_${selectedDate}`;
             setTripDataCache(prev => ({...prev, [cacheKey]: tripInfo}));
        }

        rows.push({
            "Sr No": i + 1,
            "District": cam.district,
            "Assembly": cam.assembly,
            "Vehicle No": cam.vehicleNo,
            "Distance (Kms)": tripInfo.distance,
            "Start Time": tripInfo.startTime,
            "End Time": tripInfo.endTime,
            "Start Address": tripInfo.startAddress,
            "End Address": tripInfo.endAddress
        });
    }
    setExportLoading(false);
    return rows;
  };

  const handleCSVExport = async () => {
    if (filteredCameras.length === 0) {
        toast({ title: "No data to export", status: "warning" });
        return;
    }
    toast({ title: "Generating Excel", description: "Please wait while we fetch GPS data...", status: "info" });
    
    const data = await getExportData();
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trip Report");
    XLSX.writeFile(wb, `TripReport_${selectedDate}.xlsx`);
    
    toast({ title: "Export Complete", status: "success" });
  };

  const handlePDFExport = async () => {
    if (filteredCameras.length === 0) {
        toast({ title: "No data to export", status: "warning" });
        return;
    }
    toast({ title: "Generating PDF", description: "Please wait while we fetch GPS data...", status: "info" });

    const data = await getExportData();
    
    const doc = new jsPDF("l", "mm", "a4"); // Landscape
    doc.text(`Trip Report - ${selectedDate}`, 14, 15);
    
    const tableColumn = ["Sr No", "District", "Assembly", "Vehicle No", "Distance", "Start Time", "End Time", "Start Addr", "End Addr"];
    const tableRows = data.map(item => [
        item["Sr No"],
        item["District"],
        item["Assembly"],
        item["Vehicle No"],
        item["Distance (Kms)"],
        item["Start Time"],
        item["End Time"],
        item["Start Address"],
        item["End Address"]
    ]);

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [63, 119, 165] }, // Match your blue theme
    });

    doc.save(`TripReport_${selectedDate}.pdf`);
    toast({ title: "Export Complete", status: "success" });
  };

  // --- Handlers ---
  const handleClearFilters = () => {
    setSelectedDistrict("");
    setSelectedAssembly("");
    setSelectedVehicle("");
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    setTripDataCache({});
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Table Data Slice
  const totalItemsAfterFilters = filteredCameras.length;
  const currentData = filteredCameras.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ padding: "20px 25px", fontFamily: "Arial, sans-serif" }}>
      <ChakraBox
        borderRadius="lg"
        p={4}
        h={"fit-content"}
        flexDirection="column"
        gap={4}
        display="flex"
      >
        {/* Header */}
         <Flex justify="space-between" align="center" mb={4}>
        <Text fontWeight={400} fontSize="26px" color={textColor}>
           Trip Report
        </Text>
        
                                   <HStack
                                   // bg="gray.100"
                                    
                                    border="2px solid"  
                                     borderColor="blue.400"
                                    p="4px"
                                    borderRadius="full"
                                    spacing={0}
                                  >
                                    {/* Route View */}
                                    <Box
                                      as={RouterLink}
                                      to="/tripreport"
                                      px={4}
                                      py={1.5}
                                       borderColor="blue.400"
                                      borderRadius="full"
                                      fontSize="sm"
                                      fontWeight="medium"
                                      bg={location.pathname === "/tripreport" ? "gray.300" : "transparent"}
                                      boxShadow={location.pathname === "/tripreport" ? "sm" : "none"}
                                      color={location.pathname === "/tripreport" ? "blue.600" : "gray.600"}
                                      _hover={{ textDecoration: "none" }}
                                    >
                                      Trip Report
                                    </Box>
                                
                                    {/* List View */}
                                    <Box
                                      as={RouterLink}
                                      to="/stopreport"
                                      px={4}
                                      py={1.5}
                                      borderRadius="full"
                                      fontSize="sm"
                                      fontWeight="medium"
                                      bg={location.pathname === "/stopreport" ? "gray.300" : "transparent"}
                                      boxShadow={location.pathname === "/stopreport" ? "sm" : "none"}
                                      color={location.pathname === "/stopreport" ? "blue.600" : "gray.600"}
                                      _hover={{ textDecoration: "none" }}
                                    >
                                      Stop Report
                                    </Box>
                                    <Box
                                      as={RouterLink}
                                      to="/eventreport"
                                      px={4}
                                      py={1.5}
                                      borderRadius="full"
                                      fontSize="sm"
                                      fontWeight="medium"
                                      bg={location.pathname === "/eventreport" ? "gray.300" : "transparent"}
                                      boxShadow={location.pathname === "/eventreport" ? "sm" : "none"}
                                      color={location.pathname === "/eventreport" ? "blue.600" : "gray.600"}
                                      _hover={{ textDecoration: "none" }}
                                    >
                                      Event Report
                                    </Box>
                                  </HStack>
                                  </Flex>

        {/* Filters Grid */}
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(3, 1fr)",
            lg: "repeat(7, 1fr)", // Match Installation Report layout
          }}
          gap={4}
          alignItems="center"
          p={4}
        >
          {/* District */}
          <Select
            placeholder="Select District"
            bg={buttonGradientColor}
            borderRadius="12px"
            height="34px"
            fontSize="12px"
            value={selectedDistrict}
            onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedAssembly("");
                setSelectedVehicle("");
            }}
            color={useColorModeValue("black", "white")}
            sx={{ "> option": { bg: useColorModeValue("white", "gray.700"), color: useColorModeValue("black", "white") } }}
          >
            {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>

          {/* Assembly */}
          <Select
            placeholder="Select Assembly"
            bg={buttonGradientColor}
            borderRadius="12px"
            height="34px"
            fontSize="12px"
            value={selectedAssembly}
            onChange={(e) => {
                setSelectedAssembly(e.target.value);
                setSelectedVehicle("");
            }}
            isDisabled={!selectedDistrict}
            color={useColorModeValue("black", "white")}
            sx={{ "> option": { bg: useColorModeValue("white", "gray.700"), color: useColorModeValue("black", "white") } }}
          >
            {assembliesList.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>

          {/* Vehicle */}
          <Select
            placeholder="Select Vehicle"
            bg={buttonGradientColor}
            borderRadius="12px"
            height="34px"
            fontSize="12px"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            isDisabled={!selectedAssembly}
            color={useColorModeValue("black", "white")}
            sx={{ "> option": { bg: useColorModeValue("white", "gray.700"), color: useColorModeValue("black", "white") } }}
          >
            {vehiclesList.map(v => <option key={v} value={v}>{v}</option>)}
          </Select>

          {/* Clear Filter */}
          <ChakraLink
            fontSize="12px"
            textDecoration="underline"
            onClick={handleClearFilters}
            color={useColorModeValue("black", "white")}
            whiteSpace="nowrap"
          >
            CLEAR FILTER
          </ChakraLink>

          {/* Refresh */}
          <Button
            bg={buttonGradientColor}
            borderRadius="12px"
            height="34px"
            fontSize="12px"
            color={useColorModeValue("black", "white")}
            size="sm"
            leftIcon={<IoRefreshOutline size={14} />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>

          {/* Date */}
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
                setSelectedDate(e.target.value);
                setTripDataCache({});
            }}
            bg={buttonGradientColor}
            borderRadius="12px"
            height="34px"
            fontSize="12px"
            color={useColorModeValue("black", "white")}
          />

          {/* Export Buttons (Col Span 1) */}
          <HStack spacing={2}>
            {/* XLSX */}
            <Button
                bg={buttonGradientColor}
                borderRadius="12px"
                height="34px"
                fontSize="12px"
                color={useColorModeValue("black", "white")}
                size="sm"
                leftIcon={<FaDownload size={12} />}
                _hover={{ opacity: 0.8 }}
                onClick={handleCSVExport}
                isLoading={exportLoading}
                loadingText="XLSX"
            >
                XLSX
            </Button>
            {/* PDF */}
            <Button
                bg={buttonGradientColor}
                borderRadius="12px"
                height="34px"
                fontSize="12px"
                color={useColorModeValue("black", "white")}
                size="sm"
                leftIcon={<FaFilePdf size={12} />}
                _hover={{ opacity: 0.8 }}
                onClick={handlePDFExport}
                isLoading={exportLoading}
                loadingText="PDF"
            >
                PDF
            </Button>
          </HStack>
        </Grid>

        {/* Table Content */}
        {initialLoading ? (
          <Flex justifyContent="center" alignItems="center" height="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : (
          <>
            <div style={tableContainerStyle}>
              <Table variant="simple" size="sm" borderRadius="15">
                <Thead>
                  <Tr style={tableHeaderRowStyle} bg={buttonGradientColor}>
                    <Th style={tableHeaderStyle}>Sr No.<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>District<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>Assembly<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>Vehicle No.<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>Distance (Kms)<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>Start Time<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>End Time<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>Start Address<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>End Address</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {currentData.length > 0 ? (
                    currentData.map((camera, index) => {
                      const vehicleNo = camera.vehicleNo;
                      const cacheKey = `${vehicleNo}_${selectedDate}`;
                      const tripInfo = tripDataCache[cacheKey];
                      const isLoading = loadingRows[vehicleNo];
                      const isValidVehicle = vehicleNo && vehicleNo !== "N/A";

                      return (
                        <Tr key={`${camera.deviceId}-${index}`}>
                          <Td style={tableDataStyle}>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle}>
                            {camera.district}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle}>
                            {camera.assembly}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle} fontWeight="bold">
                             {isValidVehicle ? vehicleNo : <Badge colorScheme="red" fontSize="10px">No Vehicle</Badge>}
                            <VerticalLine />
                          </Td>
                          
                          {/* Data Columns */}
                          <Td style={tableDataStyle}>
                            {!isValidVehicle ? "-" : (isLoading ? <Spinner size="xs" color="blue.500" /> : (tripInfo?.distance || "-"))}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle}>
                            {!isValidVehicle ? "-" : (isLoading ? <Spinner size="xs" color="blue.500" /> : (tripInfo?.startTime || "-"))}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle}>
                            {!isValidVehicle ? "-" : (isLoading ? <Spinner size="xs" color="blue.500" /> : (tripInfo?.endTime || "-"))}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle} title={tripInfo?.startAddress}>
                             {!isValidVehicle ? "-" : (isLoading ? "..." : (tripInfo?.startAddress || "-"))}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle} title={tripInfo?.endAddress}>
                             {!isValidVehicle ? "-" : (isLoading ? "..." : (tripInfo?.endAddress || "-"))}
                          </Td>
                        </Tr>
                      );
                    })
                  ) : (
                    <Tr>
                      <Td colSpan="9" textAlign="center" style={tableDataStyle} p={5}>
                        No Records found.
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </div>

            {/* Pagination */}
            {totalItemsAfterFilters > 0 && (
              <Flex justifyContent="right" mt={4} alignItems="right">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  isDisabled={currentPage === 1}
                  mr={2}
                  size="sm"
                  variant="ghost"
                  bg={buttonGradientColor}
                >
                  Previous
                </Button>
                 <Text alignSelf="center" mx={2} fontSize="sm">
                     Page {currentPage} of {Math.ceil(totalItemsAfterFilters / itemsPerPage)}
                 </Text>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  isDisabled={currentPage * itemsPerPage >= totalItemsAfterFilters}
                  ml={2}
                  size="sm"
                  variant="ghost"
                  bg={buttonGradientColor}
                >
                  Next
                </Button>
              </Flex>
            )}
          </>
        )}
      </ChakraBox>
    </div>
  );
};

export default TripReport;
