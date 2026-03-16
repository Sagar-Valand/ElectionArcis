import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import moment from "moment";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FaDownload, FaFilePdf } from "react-icons/fa";
import {
  Box as ChakraBox,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Button,
  Select,
  Input,
  Flex,
  Text,
  Spinner,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Tooltip,
  Tab,
  Icon,
  Grid,
  RadioGroup,
  Radio,
  Box,
  Link as ChakraLink,
  Image,
  useColorMode,
  useColorModeValue,
   Heading
} from "@chakra-ui/react";
import * as XLSX from "xlsx";
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
};

const tableDataStyle = {
  padding: "8px 10px", // Adjust padding as needed
  verticalAlign: "middle", // Crucial for vertical alignment
  textAlign: "center", // Center text horizontally within the cell
  whiteSpace: "nowrap", // Prevent text from wrapping, good for fixed-width columns
  overflow: "hidden",   // Hide overflowing content
  textOverflow: "ellipsis", // Add ellipsis for overflowing text
  position: "relative",
  //  fontSize: "14px", // Keep font size consistent with header if desired
  // Added for consistent border in the body if you decide to add it back
  borderBottom: "1px solid #6c8aa5ff",
};
const downloadButtonStyle = {
  backgroundColor: "#c8d6e5",
  color: "black",
  border: "none",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "5px",
  borderRadius: "5px",
};

const tableContainerStyle = {
  maxHeight: "calc(180vh - 500px)",
  overflowY: "auto",
  overflowX: "auto",
  border: "1px solid #b3b8d6ff",
  borderRadius: "5px",

};

// --- End Helper Styles ---
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

const Boxes = () => {
  // Main Data State
  const [allFetchedCameras, setAllFetchedCameras] = useState([]);
  const [displayedCameras, setDisplayedCameras] = useState([]);
  
  // Filter States
  const [searchDeviceId, setSearchDeviceId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const [districtsList, setDistrictsList] = useState([]);
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [assembliesList, setAssembliesList] = useState([]);
  const [selectedAssemblyValue, setSelectedAssemblyValue] = useState("");
  const [psOption, setPsOption] = useState("camera"); // 'ps' or 'camera'
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  
  // Date and Time Filter States
  // 1. Set Default to TODAY
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState(moment().format("HH:mm"));
  const text = useColorModeValue('gray.500', 'gray.400');

  // Stream Modal
  const {
    isOpen: isStreamModalOpen,
    onOpen: onStreamModalOpen,
    onClose: onStreamModalClose,
  } = useDisclosure();
  const [selectedCamera, setSelectedCamera] = useState(null);

  const { colorMode } = useColorMode();
   const location = useLocation();

  // --- 1. Fetch Data from Downtime API ---
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    const API_URL = `${process.env.REACT_APP_URL}/api/downtime/report`;
    
    try {
      const response = await axios.get(API_URL, {
        params: {
          date: selectedDate,
          start_time: startTime,
          end_time: endTime
        }
      });

      // API Structure: { success: true, data: [ ... ] }
      const apiResponse = response.data;
      const dataList = apiResponse.data || [];

      if (Array.isArray(dataList)) {
        // --- AGGREGATION LOGIC ---
        // We group by DeviceId AND Date to sum up the difference
        const deviceDateMap = {};

        dataList.forEach(item => {
            // Extract the date string (YYYY-MM-DD) from start_time
            const dateKey = item.start_time ? item.start_time.split('T')[0] : "Unknown";
            const deviceId = item.camera_id;
            
            // Unique Key combines ID and Date. 
            // This ensures entries for Dec 24 are summed together, separate from Dec 25.
            const uniqueKey = `${deviceId}_${dateKey}`;

            // Parse "difference" (HH:mm or HH:mm:ss) into milliseconds
            let currentEntryOfflineMs = 0;
            if (item.difference) {
                const parts = item.difference.split(':');
                if (parts.length >= 2) {
                    const hours = parseInt(parts[0], 10) || 0;
                    const minutes = parseInt(parts[1], 10) || 0;
                    const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
                    currentEntryOfflineMs = ((hours * 60 + minutes) * 60 + seconds) * 1000;
                }
            }

            // Aggregate
            if (deviceDateMap[uniqueKey]) {
                // If this camera+date combo exists, ADD to the total offline time
                deviceDateMap[uniqueKey].offlineMs += currentEntryOfflineMs;
            } else {
                // If new, initialize
                let loc = "N/A";
                if (item.location && typeof item.location === 'string') {
                    loc = item.location;
                }

                deviceDateMap[uniqueKey] = {
                    DeviceId: deviceId,
                    rowDate: dateKey, // Store the date for filtering later
                    district: item.district,
                    assembly: item.assembly,
                    ps_id: item.ps ? String(item.ps) : "N/A", 
                    location: loc,
                    offlineMs: currentEntryOfflineMs, // Start with this entry's duration
                };
            }
        });

        const aggregatedData = Object.values(deviceDateMap);
        setAllFetchedCameras(aggregatedData);
      } else {
        setAllFetchedCameras([]);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      setAllFetchedCameras([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, startTime, endTime]);

  // Fetch on mount and when date/time changes
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // --- 2. Extract Districts/Assemblies for Filters ---
  useEffect(() => {
    const districts = [
      ...new Set(allFetchedCameras.map((c) => c.district).filter(Boolean)),
    ];
    setDistrictsList(districts.sort());
    if (!districts.includes(selectedDistrictName)) {
        setSelectedDistrictName("");
    }
  }, [allFetchedCameras]);

  useEffect(() => {
    if (selectedDistrictName) {
      const cams = allFetchedCameras.filter(
        (c) => c.district === selectedDistrictName
      );
      const assemblies = [
        ...new Set(cams.map((c) => c.assembly).filter(Boolean)),
      ];
      setAssembliesList(assemblies.sort());
    } else {
      setAssembliesList([]);
    }
    setSelectedAssemblyValue("");
  }, [selectedDistrictName, allFetchedCameras]);

  // --- 3. Filtering Logic ---
  useEffect(() => {
    let data = [...allFetchedCameras];
    
    // 1. FILTER BY DATE (Strict Mode)
    // Only show rows that match the selected date from the filter input
    if (selectedDate) {
        data = data.filter((c) => c.rowDate === selectedDate);
    }

    if (selectedDistrictName) {
      data = data.filter((c) => c.district === selectedDistrictName);
    }
    if (selectedAssemblyValue) {
      data = data.filter((c) => c.assembly === selectedAssemblyValue);
    }
    
    // Search Logic
    if (searchDeviceId) {
      const searchLower = searchDeviceId.toLowerCase();
      if (psOption === "ps") {
        data = data.filter((c) => c.ps_id?.toLowerCase().includes(searchLower));
      } else {
        data = data.filter((c) => c.DeviceId?.toLowerCase().includes(searchLower));
      }
    }

    const end = currentPage * itemsPerPage;
    const start = end - itemsPerPage;
    setDisplayedCameras(data.slice(start, end));
  }, [
    allFetchedCameras,
    searchDeviceId,
    currentPage,
    itemsPerPage,
    selectedDistrictName,
    selectedAssemblyValue,
    psOption,
    selectedDate // Dependency ensures re-render when date changes
  ]);

  // --- 4. Handlers ---
  const handleDateChange = (event) => { setSelectedDate(event.target.value); setCurrentPage(1); };
  const handleStartTimeChange = (event) => { setStartTime(event.target.value); setCurrentPage(1); };
  const handleEndTimeChange = (event) => { setEndTime(event.target.value); setCurrentPage(1); };

  const handleSearchDeviceIdChange = (event) => {
    setSearchDeviceId(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleDistrictChange = (event) => {
    setSelectedDistrictName(event.target.value);
    setSelectedAssemblyValue("");
    setCurrentPage(1);
  };

  const handleAssemblyChange = (event) => {
    setSelectedAssemblyValue(event.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedDistrictName("");
    setSelectedAssemblyValue("");
    setSearchDeviceId("");
    setPsOption("camera");
    setSelectedDate(moment().format("YYYY-MM-DD"));
    setStartTime("00:00");
    setEndTime(moment().format("HH:mm"));
    setCurrentPage(1);
  };

  const handleViewStream = (camera) => {
    setSelectedCamera(camera);
    onStreamModalOpen();
  };

  const handleCloseModal = () => {
    onStreamModalClose();
    setSelectedCamera(null);
  };

  // --- 5. Calculation Logic ---
  const calculateDurationStats = (offlineMsIn) => {
    const dateStr = selectedDate || moment().format("YYYY-MM-DD");
    const windowStart = moment(`${dateStr} ${startTime}`, "YYYY-MM-DD HH:mm");
    let windowEnd = moment(`${dateStr} ${endTime}`, "YYYY-MM-DD HH:mm");

    if (windowEnd.isBefore(windowStart)) windowEnd.add(1, 'day');

    let totalDurationMs = windowEnd.diff(windowStart);
    if (totalDurationMs < 0) totalDurationMs = 0;

    // Offline Time is the SUM calculated in fetchReportData
    let offlineMs = offlineMsIn || 0;
    
    // Safety: Offline shouldn't exceed Total Window
    if(offlineMs > totalDurationMs) offlineMs = totalDurationMs;

    // Online Time = Total - Offline
    let onlineMs = totalDurationMs - offlineMs;
    if (onlineMs < 0) onlineMs = 0;

    // Helper to format HH:mm:ss
    const formatMs = (ms) => {
        const d = moment.duration(ms);
        const h = Math.floor(d.asHours()); 
        const m = d.minutes();
        const s = d.seconds();
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return {
      total: formatMs(totalDurationMs),
      online: formatMs(onlineMs),
      offline: formatMs(offlineMs) 
    };
  };

 const handleCSVExport = useCallback(() => {
  // Filter data based on current selection
  let data = [...allFetchedCameras];
  
  if (selectedDate) data = data.filter((c) => c.rowDate === selectedDate);
  if (selectedDistrictName) data = data.filter((c) => c.district === selectedDistrictName);
  if (selectedAssemblyValue) data = data.filter((c) => c.assembly === selectedAssemblyValue);

  const dataToExport = data.map((camera) => {
    const stats = calculateDurationStats(camera.offlineMs);
    
    return {
      "Device Id": camera.DeviceId,
      District: camera.district,
      Assembly: camera.assembly,
      
       "Location": camera.location,
      "Date": camera.rowDate,
      "Total Time": stats.total,
      "Online Time": stats.online,
      "Offline Time": stats.offline,
    };
  });

  if (dataToExport.length === 0) {
    alert("No data to export.");
    return;
  }

  // --- DYNAMIC FILENAME LOGIC ---
  let fileName = "Consolidation_Report";
  if (selectedDistrictName) fileName += `_${selectedDistrictName}`;
  if (selectedAssemblyValue) fileName += `_${selectedAssemblyValue}`;
  if (selectedDate) fileName += `_${selectedDate}`;
  fileName += ".xlsx";
  // ------------------------------

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Camera Data");
  XLSX.writeFile(wb, fileName);
}, [allFetchedCameras, selectedDistrictName, selectedAssemblyValue, selectedDate, startTime, endTime]);

 const handlePDFExport = useCallback(() => {
  let data = [...allFetchedCameras];

  if (selectedDate) data = data.filter((c) => c.rowDate === selectedDate);
  if (selectedDistrictName) data = data.filter((c) => c.district === selectedDistrictName);
  if (selectedAssemblyValue) data = data.filter((c) => c.assembly === selectedAssemblyValue);

  if (data.length === 0) {
    alert("No data to export.");
    return;
  }

  // --- DYNAMIC FILENAME LOGIC ---
  let fileName = "Consolidation_Report";
  if (selectedDistrictName) fileName += `_${selectedDistrictName}`;
  if (selectedAssemblyValue) fileName += `_${selectedAssemblyValue}`;
  if (selectedDate) fileName += `_${selectedDate}`;
  fileName += ".pdf";
  // ------------------------------

  const pdf = new jsPDF("l", "mm", "a4");
  pdf.setFontSize(14);
  pdf.text("Online Offline Report", 14, 15);

  pdf.setFontSize(10);
  pdf.text(
    `Date: ${selectedDate || "All"} | District: ${selectedDistrictName || "All"} | Assembly: ${selectedAssemblyValue || "All"}`,
    14,
    22
  );
  

  const tableBody = data.map((camera) => {
    const stats = calculateDurationStats(camera.offlineMs);
    return [
      camera.DeviceId,
      camera.district,
      camera.assembly,
      // camera.ps_id,
      camera.location,
      camera.rowDate,
      stats.total,
      stats.online,
      stats.offline,
    ];
  });

  autoTable(pdf, {
    startY: 28,
    head: [[
      "Device Id", "District", "Assembly", "Location", "Date", "Total Time", "Online Time", "Offline Time",
    ]],
    body: tableBody,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  pdf.save(fileName);
}, [allFetchedCameras, selectedDistrictName, selectedAssemblyValue, selectedDate, startTime, endTime]);
  
  // --- Theme Variables ---
  const buttonGradientColor = useColorModeValue(
    "linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)",
    "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)"
  );
  const radioButtonColor = useColorModeValue("#9CBAD2", "#CDDEEB");
  const createFilterHandler = (setter) => (e) => { setter(e.target.value); setCurrentPage(1); };

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <ChakraBox
        borderRadius="lg"
       // p={4}
        h={"fit-content"}
        flexDirection="column"
        gap={4}
        display="flex"
      >
        {/* Header Row */}
         <Flex justify="space-between" align="center" >
         <Text fontWeight={400} fontSize="26px" color={text}>
                                            Consolidation Camera Report
                                           </Text>

           <HStack
           // bg="gray.100"
            
            border="2px solid"  
             borderColor="blue.400"
           // p="4px"
            borderRadius="full"
            spacing={0}
          >
            {/* Route View */}
            <Box
              as={RouterLink}
              to="/DowntimeReport"
              px={4}
              py={1.5}
               borderColor="blue.400"
              borderRadius="full"
              fontSize="sm"
              fontWeight="medium"
              bg={location.pathname === "/DowntimeReport" ? "gray.300" : "transparent"}
              boxShadow={location.pathname === "/DowntimeReport" ? "sm" : "none"}
              color={location.pathname === "/DowntimeReport" ? "blue.600" : "gray.600"}
              _hover={{ textDecoration: "none" }}
            >
              Downtime Report
            </Box>
        
            {/* List View */}
            <Box
              as={RouterLink}
              to="/CameraReport"
              px={4}
              py={1.5}
              borderRadius="full"
              fontSize="sm"
              fontWeight="medium"
              bg={location.pathname === "/CameraReport" ? "gray.300" : "transparent"}
              boxShadow={location.pathname === "/CameraReport" ? "sm" : "none"}
              color={location.pathname === "/CameraReport" ? "blue.600" : "gray.600"}
              _hover={{ textDecoration: "none" }}
            >
              Consolidation Camera Report
            </Box>
          </HStack>
          </Flex>
      

        {/* Filter Row */}
       <Grid
  templateColumns={{
    base: "1fr",
    md: "repeat(3, 1fr)",
    lg: "repeat(7, 1fr)",
  }}
  gap={4}
  alignItems="center"
//  p={4}
>
  {/* District */}
  <Select
    placeholder="Select District"
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    value={selectedDistrictName}
    onChange={handleDistrictChange}
    color={useColorModeValue("black", "white")}
    sx={{
      "> option": {
        bg: useColorModeValue("white", "gray.700"),
        color: useColorModeValue("black", "white"),
      },
    }}
  >
    {districtsList.map((d) => (
      <option key={d} value={d}>{d}</option>
    ))}
  </Select>

  {/* Assembly */}
  <Select
    placeholder="Select Assembly"
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    value={selectedAssemblyValue}
    onChange={handleAssemblyChange}
    isDisabled={!selectedDistrictName || assembliesList.length === 0}
    color={useColorModeValue("black", "white")}
    sx={{
      "> option": {
        bg: useColorModeValue("white", "gray.700"),
        color: useColorModeValue("black", "white"),
      },
    }}
  >
    {assembliesList.map((a) => (
      <option key={a} value={a}>{a}</option>
    ))}
  </Select>

  {/* Camera ID Search (PS removed) */}
  <Input
    placeholder="Search Camera ID"
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    value={searchDeviceId}
    onChange={handleSearchDeviceIdChange}
    color={useColorModeValue("black", "white")}
    _placeholder={{ color: useColorModeValue("gray.600", "gray.400") }}
    borderColor="transparent"
  />

  {/* Date */}
  <Input
    type="date"
    value={selectedDate}
    onChange={createFilterHandler(setSelectedDate)}
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    color={useColorModeValue("black", "white")}
    borderColor="transparent"
  />

  {/* From Time */}
  <Input
    type="time"
    value={startTime}
    onChange={(e) => { setFromTime(e.target.value); setCurrentPage(1); }}
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    color={useColorModeValue("black", "white")}
    borderColor="transparent"
  />

  {/* To Time */}
  <Input
    type="time"
    value={endTime}
    onChange={(e) => { setToTime(e.target.value); setCurrentPage(1); }}
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    color={useColorModeValue("black", "white")}
    borderColor="transparent"
  />

  {/* Download */}
<HStack
  spacing={2}
  gridColumn={{ base: "span 1", md: "span 3", lg: "span 1" }}
>
  {/* XLSX Button */}
  <Button
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    color={useColorModeValue("black", "white")}
    size="sm"
    leftIcon={<FaDownload size={12} />}
    _hover={{
      bg: useColorModeValue(
        "linear-gradient(93.5deg, #8EABC5 , #C4D7E7 94.58%)",
        "linear-gradient(93.5deg, #1F1F1F 0.56%, #010307 50.58%)"
      ),
    }}
    onClick={handleCSVExport}
    isLoading={loading === "excel"}
    loadingText="Downloading..."
  >
    XLSX
  </Button>

  {/* PDF Button */}
  <Button
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    color={useColorModeValue("black", "white")}
    size="sm"
    leftIcon={<FaFilePdf size={12} />}
    _hover={{
      bg: useColorModeValue(
        "linear-gradient(93.5deg, #8EABC5 , #C4D7E7 94.58%)",
        "linear-gradient(93.5deg, #1F1F1F 0.56%, #010307 50.58%)"
      ),
    }}
    onClick={handlePDFExport}
    isLoading={loading === "pdf"}
    loadingText="Downloading..."
  >
    PDF
  </Button>
</HStack>
</Grid>

        {loading ? (
          <Flex justifyContent="center" alignItems="center" height="200px" flexDirection="column" gap={2}>
            <Spinner size="xl" color="blue.500" />
            <Text>Fetching Report Data...</Text>
          </Flex>
        ) : (
          <>
            <div style={tableContainerStyle}>
              <Table
                variant="simple"
                size="sm"
                borderRadius="15"
              >
                <Thead>
                  <Tr style={tableHeaderRowStyle} bg={buttonGradientColor}>
                    <Th style={tableHeaderStyle}>Sr No.<VerticalLine /></Th>
                    
                    <Th style={tableHeaderStyle}>District<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>Assembly<VerticalLine /></Th>
                   
                    <Th style={tableHeaderStyle}>Location<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>Device Id<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>Total Time<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>Online Time<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>Offline Time</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {displayedCameras.length > 0 ? (
                    displayedCameras.map((camera, index) => {
                      // Calculate stats based on the Offline Ms aggregated in fetch
                      const stats = calculateDurationStats(camera.offlineMs);

                      return (
                        <Tr key={`${camera.DeviceId}-${index}`}>
                          <Td style={tableDataStyle}>
                            {(currentPage - 1) * itemsPerPage + index + 1}
                            <VerticalLine />
                          </Td>
                          
                          <Td style={tableDataStyle}>
                            {camera.district || "N/A"}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle}>
                            {camera.assembly || "N/A"}
                            <VerticalLine />
                          </Td>
                          
                          <Td style={tableDataStyle} title={camera.location || "N/A"}>
                            {camera.location || "N/A"}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle}>
                            {camera.DeviceId || "N/A"}
                            <VerticalLine />
                          </Td>
                          {/* Calculated Columns */}
                          <Td style={tableDataStyle}>
                            {stats.total}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle} color="green.500">
                            {stats.online}
                            <VerticalLine />
                          </Td>
                          <Td style={tableDataStyle} color="red.500">
                            {stats.offline}
                          </Td>
                        </Tr>
                      );
                    })
                  ) : (
                    <Tr>
                      <Td colSpan="9" textAlign="center" style={tableDataStyle} p={5}>
                        No Records found for selected date.
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </div>

            {allFetchedCameras.length > 0 && (
              <Flex justifyContent="right" mt={4} alignItems="right">
                {/* Previous Button */}
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  isDisabled={currentPage === 1}
                  mr={2}
                  size="sm"
                  variant="ghost"
                  _hover="#9CBAD2"
                  bg={buttonGradientColor}
                >
                  Previous
                </Button>

                {/* Pagination Logic */}
                {(() => {
                  // Calculate total based on *filtered* length
                  const totalFiltered = allFetchedCameras
                    .filter(c => selectedDate ? c.rowDate === selectedDate : true)
                    .filter(c => selectedDistrictName ? c.district === selectedDistrictName : true)
                    .filter(c => selectedAssemblyValue ? c.assembly === selectedAssemblyValue : true)
                    .filter(c => {
                       if (!searchDeviceId) return true;
                       const lower = searchDeviceId.toLowerCase();
                       return psOption === "ps" 
                         ? c.ps_id?.toLowerCase().includes(lower) 
                         : c.DeviceId?.toLowerCase().includes(lower);
                    }).length;

                  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
                  const pageNumbers = [];
                  const delta = 1;

                  for (let i = 1; i <= totalPages; i++) {
                    if (
                      i === 1 ||
                      i === totalPages ||
                      (i >= currentPage - delta && i <= currentPage + delta)
                    ) {
                      pageNumbers.push(i);
                    } else if (
                      (i === currentPage - delta - 1 && i > 1) ||
                      (i === currentPage + delta + 1 && i < totalPages)
                    ) {
                      if (pageNumbers[pageNumbers.length - 1] !== "...") {
                        pageNumbers.push("...");
                      }
                    }
                  }

                  return pageNumbers.map((page, idx) =>
                    page === "..." ? (
                      <Text key={`ellipsis-${idx}`} mx={2} alignSelf="center">...</Text>
                    ) : (
                      <Button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        size="sm"
                        variant="ghost"
                        mx={1}
                        fontWeight={currentPage === page ? "bold" : "normal"}
                        textDecoration={currentPage === page ? "underline" : "none"}
                        _hover="#9CBAD2"
                        bg={currentPage === page ? "rgba(0,0,0,0.1)" : buttonGradientColor}
                      >
                        {page}
                      </Button>
                    )
                  );
                })()}

                {/* Next Button */}
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  isDisabled={displayedCameras.length < itemsPerPage}
                  ml={2}
                  size="sm"
                  variant="ghost"
                  _hover="#9CBAD2"
                  bg={buttonGradientColor}
                >
                  Next
                </Button>
              </Flex>
            )}
          </>
        )}
      </ChakraBox>

      {/* Modal JSX */}
      <Modal
        isOpen={isStreamModalOpen}
        onClose={handleCloseModal}
        size="4xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent bg="white" color="Black" borderRadius="lg">
          <ModalHeader>Camera: {selectedCamera?.DeviceId}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
             <Text>Stream not available in Report View.</Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseModal}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};  

export default Boxes;
