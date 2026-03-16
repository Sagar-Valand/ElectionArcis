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
  HStack,
  useToast,
  Box
} from "@chakra-ui/react";
import { IoSearchOutline } from "react-icons/io5";
import { FaDownload, FaFilePdf } from "react-icons/fa";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import moment from "moment";
import { Link as RouterLink, useLocation } from "react-router-dom";

// --- Styles ---
const tableHeaderRowStyle = { position: "sticky", top: 0, zIndex: 1, borderRadius: "5px" };

const tableHeaderStyle = { 
  padding: "8px 10px", 
  verticalAlign: "middle", 
  textAlign: "center", 
  whiteSpace: "nowrap", 
  fontSize: "12px", 
  fontWeight: "bold",
  position: "relative" // Required for VerticalLine
};

const tableDataStyle = { 
  padding: "8px 10px", 
  verticalAlign: "middle", 
  textAlign: "center", 
  whiteSpace: "nowrap", 
  borderBottom: "1px solid #6c8aa5ff", 
  fontSize: "12px",
  position: "relative" // Required for VerticalLine
};

const tableContainerStyle = { 
  maxHeight: "calc(100vh - 250px)", 
  overflowY: "auto", 
  overflowX: "auto", 
  border: "1px solid #b3b8d6ff", 
  borderRadius: "5px" 
};

// --- Vertical Line Component ---
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

const EventReport = () => {
  // --- Theme ---
  const buttonGradientColor = useColorModeValue("linear-gradient(93.5deg,#CDDEEB , #9CBAD2 94.58%)", "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)");
  const textColor = useColorModeValue("gray.500", "white");
  const bgCard = useColorModeValue("white", "gray.800");

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

  // Data
  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
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


  // --- 3. Generate Report ---
  const handleGenerateReport = async () => {
    if (!selectedVehicle) {
      toast({ title: "Please select a vehicle", status: "warning" });
      return;
    }
    setLoading(true);
    setEventData([]);
    setCurrentPage(1);

    try {
      const response = await axios.post(`${process.env.REACT_APP_URL}/api/gps/getAllGpsData`, { 
        name: selectedVehicle, 
        date: selectedDate 
      });

      const history = response.data;
      if (!history || history.length === 0) {
        toast({ title: "No data found for this date", status: "info" });
        setLoading(false);
        return;
      }

      history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const processedData = history.map(row => {
          const isIgnitionOn = row.ignition === "true" || row.ignition === true;
          const eventStatus = isIgnitionOn ? "Ignition ON" : "Ignition OFF";
          
          const lat = parseFloat(row.latitude || row.lat).toFixed(5);
          const lng = parseFloat(row.longitude || row.long).toFixed(5);

          return {
            district: selectedDistrict,
            assembly: selectedAssembly,
            deviceName: selectedVehicle,
            event: eventStatus,
            isIgnitionOn: isIgnitionOn,
            gpsTime: row.deviceFixTime ? moment(row.deviceFixTime).format('HH:mm:ss') : "-",
            serverTime: row.createdAt ? moment(row.createdAt).format('HH:mm:ss') : "-",
            coords: `${lat}, ${lng}`,
            address: `Lat: ${parseFloat(lat).toFixed(4)}, Lng: ${parseFloat(lng).toFixed(4)}`
          };
      });

      setEventData(processedData);

    } catch (error) {
      console.error("Event Report Error", error);
      toast({ title: "Error fetching events", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Export Logic ---
  const handleExport = (type) => {
    if (eventData.length === 0) return;

    if (type === 'excel') {
      const dataToExport = eventData.map((r, i) => ({
        "Sr.": i + 1,
        "District": r.district,
        "Assembly": r.assembly,
        "Device Name": r.deviceName,
        "Event": r.event,
        "GPS Time": r.gpsTime,
        "Server Time": r.serverTime,
        "Coords": r.coords,
        "Address": r.address
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Event Report");
      XLSX.writeFile(wb, `EventReport_${selectedVehicle}_${selectedDate}.xlsx`);
    } else {
      const doc = new jsPDF("l");
      doc.text(`Event Report: ${selectedVehicle} - ${selectedDate}`, 14, 15);
      const headers = [["Sr.", "District", "Assembly", "Device Name", "Event", "GPS Time", "Server Time", "Coords", "Address"]];
      const rows = eventData.map((r, i) => [
        i+1, r.district, r.assembly, r.deviceName, r.event, r.gpsTime, r.serverTime, r.coords, r.address
      ]);
      
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [63, 119, 165] }
      });
      doc.save(`EventReport_${selectedVehicle}.pdf`);
    }
  };

  // Pagination
  const currentData = eventData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ padding: "20px 25px", fontFamily: "Arial, sans-serif" }}>
      <ChakraBox borderRadius="lg" p={4} h={"fit-content"} flexDirection="column" gap={4} display="flex">
         <Flex justify="space-between" align="center" mb={4}>
               <Text fontWeight={400} fontSize="26px" color={textColor}>
                  Event Report
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
          
          <Button leftIcon={<IoSearchOutline />} onClick={handleGenerateReport} isLoading={loading} loadingText="Fetching" bg={buttonGradientColor} borderRadius="12px" height="34px" fontSize="12px">
            Search
          </Button>

           {/* Exports */}
           <HStack spacing={2}>
            <Button bg={buttonGradientColor} borderRadius="12px" height="34px" fontSize="12px" size="sm" leftIcon={<FaDownload />} onClick={() => handleExport('excel')} isDisabled={eventData.length===0}>XLSX</Button>
            <Button bg={buttonGradientColor} borderRadius="12px" height="34px" fontSize="12px" size="sm" leftIcon={<FaFilePdf />} onClick={() => handleExport('pdf')} isDisabled={eventData.length===0}>PDF</Button>
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
                <Th style={tableHeaderStyle}>Device Name<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Event<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>GPS Time<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Server Time<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Coords<VerticalLine /></Th>
                <Th style={tableHeaderStyle}>Address</Th>
              </Tr>
            </Thead>
            <Tbody>
              {currentData.length > 0 ? (
                currentData.map((row, index) => (
                  <Tr key={index}>
                    <Td style={tableDataStyle}>
                        {(currentPage - 1) * itemsPerPage + index + 1}
                        <VerticalLine />
                    </Td>
                    <Td style={tableDataStyle}>
                        {row.district}
                        <VerticalLine />
                    </Td>
                    <Td style={tableDataStyle}>
                        {row.assembly}
                        <VerticalLine />
                    </Td>
                    <Td style={tableDataStyle} fontWeight="bold">
                        {row.deviceName}
                        <VerticalLine />
                    </Td>
                    
                    {/* Event Column */}
                    <Td style={tableDataStyle}>
                        <Badge 
                           colorScheme={row.isIgnitionOn ? "green" : "red"} 
                           variant="solid" 
                           borderRadius="full" 
                           px={2}
                        >
                            {row.event}
                        </Badge>
                        <VerticalLine />
                    </Td>
                    
                    <Td style={tableDataStyle}>
                        {row.gpsTime}
                        <VerticalLine />
                    </Td>
                    <Td style={tableDataStyle}>
                        {row.serverTime}
                        <VerticalLine />
                    </Td>
                    <Td style={tableDataStyle} fontSize="10px">
                        {row.coords}
                        <VerticalLine />
                    </Td>
                    <Td style={tableDataStyle} fontSize="10px" maxW="150px" overflow="hidden" textOverflow="ellipsis" title={row.address}>
                        {row.address}
                        {/* No vertical line on the last column */}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr><Td colSpan={9} textAlign="center" p={5}>No Records Found</Td></Tr>
              )}
            </Tbody>
          </Table>
        </div>
        
        {/* Pagination */}
        {eventData.length > 0 && (
            <Flex justifyContent="right" mt={4}>
                <Button onClick={() => setCurrentPage(p => Math.max(1, p-1))} isDisabled={currentPage===1} size="sm" mr={2}>Prev</Button>
                <Text alignSelf="center" fontSize="sm">Page {currentPage} of {Math.ceil(eventData.length/itemsPerPage)}</Text>
                <Button onClick={() => setCurrentPage(p => Math.min(Math.ceil(eventData.length/itemsPerPage), p+1))} isDisabled={currentPage * itemsPerPage >= eventData.length} size="sm" ml={2}>Next</Button>
            </Flex>
        )}
        </>
        )}
      </ChakraBox>
    </div>
  );
};

export default EventReport;
