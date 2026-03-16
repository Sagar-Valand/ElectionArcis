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
  useColorModeValue,
  Link as ChakraLink,
  useToast,
  HStack,
  Badge,
  Box
} from "@chakra-ui/react";
import { IoRefreshOutline, IoSearchOutline } from "react-icons/io5";
import { FaDownload, FaFilePdf } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Link as RouterLink, useLocation } from "react-router-dom";

// --- Styles (Same as TripReport) ---
const tableHeaderRowStyle = { position: "sticky", top: 0, zIndex: 1, borderRadius: "5px" };
const tableHeaderStyle = { padding: "8px 10px", verticalAlign: "middle", textAlign: "center", whiteSpace: "nowrap", fontSize: "12px", fontWeight: "bold" };
const tableDataStyle = { padding: "8px 10px", verticalAlign: "middle", textAlign: "center", whiteSpace: "nowrap", borderBottom: "1px solid #6c8aa5ff", fontSize: "12px" };
const tableContainerStyle = { maxHeight: "calc(100vh - 250px)", overflowY: "auto", overflowX: "auto", border: "1px solid #b3b8d6ff", borderRadius: "5px" };
const VerticalLine = () => (<span style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", height: "60%", width: "2px", backgroundColor: "#3F77A5" }}></span>);

// --- Helpers ---
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if(!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371e3; // metres
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // returns meters
};

const formatDuration = (ms) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));
  return `${hours}h ${minutes}m ${seconds}s`;
};

const HaltReport = () => {
  // --- Theme ---
  const buttonGradientColor = useColorModeValue("linear-gradient(93.5deg,#CDDEEB , #9CBAD2 94.58%)", "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)");
  const textColor = useColorModeValue("gray.500", "white");

  // --- State ---
  const [allCameras, setAllCameras] = useState([]);
  
  // Dropdowns
  const [districtsList, setDistrictsList] = useState([]);
  const [assembliesList, setAssembliesList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);

  // Selections
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedAssembly, setSelectedAssembly] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Report Data
  const [haltData, setHaltData] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const location = useLocation(); 

  // --- 1. Fetch Metadata ---
  useEffect(() => {
    const fetchMetadata = async () => {
      const userEmail = localStorage.getItem("email");
      try {
        const response = await axios.post(`${process.env.REACT_APP_URL}/api/camera/getcurrentUserCameras`, { email: userEmail });
        const data = Array.isArray(response.data) ? response.data : [];
        
        const normalized = data.map(item => ({
            ...item,
            district: item.dist_name || "Unknown",
            assembly: item.accName || "Unknown",
            vehicleNo: (Array.isArray(item.locations) && item.locations.length > 0) ? item.locations[0] : "N/A"
        }));

        setAllCameras(normalized);
        const districts = [...new Set(normalized.map(c => c.district).filter(d => d !== "Unknown"))];
        setDistrictsList(districts.sort());
      } catch (error) {
        console.error("Error fetching metadata", error);
      }
    };
    fetchMetadata();
  }, []);

  // --- 2. Filter Logic ---
  useEffect(() => {
    if (selectedDistrict) {
      const filtered = allCameras.filter(c => c.district === selectedDistrict);
      setAssembliesList([...new Set(filtered.map(c => c.assembly))].sort());
    } else setAssembliesList([]);
  }, [selectedDistrict, allCameras]);

  useEffect(() => {
    if (selectedAssembly) {
      const filtered = allCameras.filter(c => c.assembly === selectedAssembly);
      setVehiclesList([...new Set(filtered.map(c => c.vehicleNo).filter(v => v !== "N/A"))].sort());
    } else setVehiclesList([]);
  }, [selectedAssembly, allCameras]);


  // --- 3. Process Logic: Generate Halts ---
  const handleGenerateReport = async () => {
    if (!selectedVehicle) {
      toast({ title: "Please select a vehicle", status: "warning" });
      return;
    }
    setLoading(true);
    setHaltData([]);

    try {
      // Fetch Raw Data
      const response = await axios.post(`${process.env.REACT_APP_URL}/api/gps/getAllGpsData`, { 
        name: selectedVehicle, 
        date: selectedDate 
      });

      const history = response.data;
      if (!history || history.length === 0) {
        toast({ title: "No GPS data found", status: "info" });
        setLoading(false);
        return;
      }

      // Sort chronological
      history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const halts = [];
      let stopStartPoint = history[0];
      let stopStartTime = new Date(stopStartPoint.createdAt);
      
      // Thresholds
      const MIN_STOP_TIME_MS = 2 * 60 * 1000; // 2 Minutes
      const MOVEMENT_THRESHOLD_METERS = 30; // 30 Meters variance allowed (GPS drift)

      for (let i = 1; i < history.length; i++) {
        const currentPoint = history[i];
        
        // Distance from the start of the potential stop
        const dist = calculateDistance(
            parseFloat(stopStartPoint.latitude || stopStartPoint.lat), 
            parseFloat(stopStartPoint.longitude || stopStartPoint.long),
            parseFloat(currentPoint.latitude || currentPoint.lat), 
            parseFloat(currentPoint.longitude || currentPoint.long)
        );

        // If moved significantly
        if (dist > MOVEMENT_THRESHOLD_METERS) {
           const currentTime = new Date(currentPoint.createdAt);
           const duration = currentTime - stopStartTime;

           // Was it a valid stop?
           if (duration >= MIN_STOP_TIME_MS) {
              halts.push({
                 district: selectedDistrict,
                 assembly: selectedAssembly,
                 vehicleNo: selectedVehicle,
                 type: "Stop", // Or "Idle" if ignition is on (needs ignition data)
                 duration: formatDuration(duration),
                 coords: `${parseFloat(stopStartPoint.latitude||stopStartPoint.lat).toFixed(5)}, ${parseFloat(stopStartPoint.longitude||stopStartPoint.long).toFixed(5)}`,
                 address: `Lat: ${parseFloat(stopStartPoint.latitude||stopStartPoint.lat).toFixed(4)}, Lng: ${parseFloat(stopStartPoint.longitude||stopStartPoint.long).toFixed(4)}`, // Would need Geocoding API for real address
                 startTime: stopStartTime.toLocaleTimeString(),
                 endTime: currentTime.toLocaleTimeString()
              });
           }

           // Reset stop tracker to current moving point
           stopStartPoint = currentPoint;
           stopStartTime = currentTime;
        }
      }

      // Check last segment
      const lastPoint = history[history.length - 1];
      const lastTime = new Date(lastPoint.createdAt);
      const lastDuration = lastTime - stopStartTime;
      if(lastDuration >= MIN_STOP_TIME_MS) {
          halts.push({
            district: selectedDistrict,
            assembly: selectedAssembly,
            vehicleNo: selectedVehicle,
            type: "Stop",
            duration: formatDuration(lastDuration),
            coords: `${parseFloat(stopStartPoint.latitude||stopStartPoint.lat).toFixed(5)}, ${parseFloat(stopStartPoint.longitude||stopStartPoint.long).toFixed(5)}`,
            address: `Lat: ${parseFloat(stopStartPoint.latitude||stopStartPoint.lat).toFixed(4)}, Lng: ${parseFloat(stopStartPoint.longitude||stopStartPoint.long).toFixed(4)}`,
            startTime: stopStartTime.toLocaleTimeString(),
            endTime: lastTime.toLocaleTimeString()
         });
      }

      setHaltData(halts);

    } catch (error) {
      console.error("Halt Report Error", error);
      toast({ title: "Error fetching data", status: "error" });
    } finally {
      setLoading(false);
    }
  };


  // --- 4. Exports ---
  const handleExport = (type) => {
    if (haltData.length === 0) return;
    
    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(haltData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Halt Report");
      XLSX.writeFile(wb, `HaltReport_${selectedVehicle}_${selectedDate}.xlsx`);
    } else {
      const doc = new jsPDF("l");
      doc.text(`Halt Report: ${selectedVehicle} (${selectedDate})`, 14, 15);
      const headers = [["Sr", "District", "Assembly", "Vehicle", "Type", "Duration", "Coords", "Start", "End"]];
      const rows = haltData.map((h, i) => [i+1, h.district, h.assembly, h.vehicleNo, h.type, h.duration, h.coords, h.startTime, h.endTime]);
      
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [63, 119, 165] }
      });
      doc.save(`HaltReport_${selectedVehicle}.pdf`);
    }
  };

  // Pagination
  const currentData = haltData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ padding: "20px 25px", fontFamily: "Arial, sans-serif" }}>
      <ChakraBox borderRadius="lg" p={4} h={"fit-content"} flexDirection="column" gap={4} display="flex">
         <Flex justify="space-between" align="center" mb={4}>
                <Text fontWeight={400} fontSize="26px" color={textColor}>
                   Stop Report
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

        {/* Filters */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(5, 1fr) auto auto" }} gap={4} alignItems="center" p={4}>
          <Select placeholder="Select District" bg={buttonGradientColor} borderRadius="12px" height="34px" fontSize="12px" value={selectedDistrict} onChange={e => {setSelectedDistrict(e.target.value); setSelectedAssembly(""); setSelectedVehicle("")}}>
             {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>

          <Select placeholder="Select Assembly" bg={buttonGradientColor} borderRadius="12px" height="34px" fontSize="12px" value={selectedAssembly} onChange={e => {setSelectedAssembly(e.target.value); setSelectedVehicle("")}} isDisabled={!selectedDistrict}>
             {assembliesList.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>

          <Select placeholder="Select Vehicle" bg={buttonGradientColor} borderRadius="12px" height="34px" fontSize="12px" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} isDisabled={!selectedAssembly}>
             {vehiclesList.map(v => <option key={v} value={v}>{v}</option>)}
          </Select>

          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} bg={buttonGradientColor} borderRadius="12px" height="34px" fontSize="12px" />
          
          <Button leftIcon={<IoSearchOutline />} onClick={handleGenerateReport} isLoading={loading} loadingText="Processing" bg={buttonGradientColor} borderRadius="12px" height="34px" fontSize="12px">
            Search
          </Button>

           {/* Exports */}
           <HStack spacing={2}>
            <Button bg={buttonGradientColor} borderRadius="12px" height="34px" fontSize="12px" size="sm" leftIcon={<FaDownload />} onClick={() => handleExport('excel')} isDisabled={haltData.length===0}>XLSX</Button>
            <Button bg={buttonGradientColor} borderRadius="12px" height="34px" fontSize="12px" size="sm" leftIcon={<FaFilePdf />} onClick={() => handleExport('pdf')} isDisabled={haltData.length===0}>PDF</Button>
          </HStack>
        </Grid>

        {/* Table */}
        {loading ? (
             <Flex justifyContent="center" height="200px" align="center"><Spinner size="xl" color="blue.500" /></Flex>
        ) : (
        <>
        <div style={tableContainerStyle}>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr style={tableHeaderRowStyle} bg={buttonGradientColor}>
                <Th style={tableHeaderStyle}>Sr.<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>District<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Assembly<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Vehicle No<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Type<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Duration<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Coords<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Address<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Start Time<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>End Time</Th>
              </Tr>
            </Thead>
            <Tbody>
              {currentData.length > 0 ? (
                currentData.map((row, index) => (
                  <Tr key={index}>
                    <Td style={tableDataStyle}>{(currentPage - 1) * itemsPerPage + index + 1}<VerticalLine /></Td>
                    <Td style={tableDataStyle}>{row.district}<VerticalLine /></Td>
                    <Td style={tableDataStyle}>{row.assembly}<VerticalLine /></Td>
                    <Td style={tableDataStyle} fontWeight="bold">{row.vehicleNo}<VerticalLine /></Td>
                    <Td style={tableDataStyle}><Badge colorScheme="red">{row.type}</Badge><VerticalLine /></Td>
                    <Td style={tableDataStyle} fontWeight="bold">{row.duration}<VerticalLine /></Td>
                    <Td style={tableDataStyle} fontSize="10px">{row.coords}<VerticalLine /></Td>
                    <Td style={tableDataStyle} fontSize="10px" title={row.address}>{row.address}<VerticalLine /></Td>
                    <Td style={tableDataStyle}>{row.startTime}<VerticalLine /></Td>
                    <Td style={tableDataStyle}>{row.endTime}</Td>
                  </Tr>
                ))
              ) : (
                <Tr><Td colSpan={10} textAlign="center" p={5}>No Halts Found or No Vehicle Selected</Td></Tr>
              )}
            </Tbody>
          </Table>
        </div>
        
        {/* Pagination */}
        {haltData.length > 0 && (
            <Flex justifyContent="right" mt={4}>
                <Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} isDisabled={currentPage===1} size="sm" mr={2}>Prev</Button>
                <Text alignSelf="center" fontSize="sm">Page {currentPage} of {Math.ceil(haltData.length/itemsPerPage)}</Text>
                <Button onClick={() => setCurrentPage(p => Math.min(Math.ceil(haltData.length/itemsPerPage), p+1))} isDisabled={currentPage * itemsPerPage >= haltData.length} size="sm" ml={2}>Next</Button>
            </Flex>
        )}
        </>
        )}
      </ChakraBox>
    </div>
  );
};

export default HaltReport;
