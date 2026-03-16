import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import moment from 'moment';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Box as ChakraBox,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    Select,
    Input,
    Flex,
    Text,
    Spinner,
    Grid,
    Link as ChakraLink,
    Image,
    useColorModeValue,
    Icon,
    HStack,
    Box,
    Heading
} from '@chakra-ui/react';
import * as XLSX from 'xlsx';
import { FaDownload, FaFilePdf } from 'react-icons/fa';
import { Link as RouterLink, useLocation } from "react-router-dom";

// --- API Fetching Function ---
// --- API Fetching Function ---
const getDowntimeReportAPI = async (date) => {
    const baseUrl = process.env.REACT_APP_URL || "http://localhost:8081"; 
    // Pass the date as a query parameter
    const API_URL = `${baseUrl}/api/downtime/report?date=${date}`;
    try {
        const response = await axios.get(API_URL);
        if (response.data && response.data.success) {
            return response.data;
        }
        return { data: [] };
    } catch (error) {
        console.error("Error fetching downtime report:", error);
        throw error;
    }
};

// --- Helper Styles (Matches Camera Report) ---
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

// --- Safe Render ---
const safeRender = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'object') {
        return value.loc_name || value.dist_name || value.accName || JSON.stringify(value);
    }
    return 'N/A';
};

// --- Time Calculations (Functionality Unchanged) ---
const calculateTimeDifference = (endTimeStr, startTimeStr) => {
    if (!endTimeStr || !startTimeStr || endTimeStr === 'N/A' || startTimeStr === 'N/A' || endTimeStr === 'null') return "00:00";
    
    let endTime = moment(endTimeStr, ['DD-MM-YYYY HH:mm:ss', 'YYYY-MM-DD HH:mm:ss']);
    let startTime = moment(startTimeStr, ['DD-MM-YYYY HH:mm:ss', 'YYYY-MM-DD HH:mm:ss']);

    if (!endTime.isValid() || !startTime.isValid()) return "00:00";
    if (endTime.isBefore(startTime)) return "00:00";

    // .diff(..., 'minutes') returns the floor of the difference (ignores remaining seconds)
    const diffInMinutes = Math.abs(endTime.diff(startTime, 'minutes'));
    
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const processRecords = (records, timeSnapshot, fromTime, toTime) => {
    if (!records || !Array.isArray(records)) return [];
    const nowStr = timeSnapshot.format('DD-MM-YYYY HH:mm:ss');

    return records.map(record => {
        const formatApiDate = (dateStr) => {
            if (!dateStr || dateStr === 'null' || dateStr === 'N/A') return null;
            const m = moment(dateStr); 
            return m.isValid() ? m.format('DD-MM-YYYY HH:mm:ss') : dateStr;
        };

        const originalStart = formatApiDate(record.start_time);
        let originalClose = formatApiDate(record.close_time);

        if (!originalClose) originalClose = nowStr;

        let processedStart = originalStart;
        if (!processedStart) {
             const endMoment = moment(originalClose, 'DD-MM-YYYY HH:mm:ss');
             if (endMoment.isValid()) {
                if (endMoment.isSame(timeSnapshot, 'day')) {
                    processedStart = timeSnapshot.startOf('day').format('DD-MM-YYYY HH:mm:ss');
                } else {
                    processedStart = endMoment.format('DD-MM-YYYY') + ' 00:00:00';
                }
             } else {
                 processedStart = 'N/A';
             }
        }

        let processedRecord = { 
            ...record,
            start_time: processedStart,
            close_time: originalClose,
            difference: calculateTimeDifference(originalClose, processedStart)
        };

        if ((fromTime || toTime) && processedStart !== 'N/A') {
            const recordDate = moment(processedStart, 'DD-MM-YYYY HH:mm:ss').format('DD-MM-YYYY');
            let currentStartMoment = moment(processedStart, 'DD-MM-YYYY HH:mm:ss');
            let currentCloseMoment = moment(originalClose, 'DD-MM-YYYY HH:mm:ss');

            if (fromTime) {
                const filterFromMoment = moment(`${recordDate} ${fromTime}:00`, 'DD-MM-YYYY HH:mm:ss');
                if (filterFromMoment.isValid() && currentStartMoment.isBefore(filterFromMoment)) {
                    currentStartMoment = filterFromMoment;
                }
            }

            if (toTime) {
                const filterToMoment = moment(`${recordDate} ${toTime}:00`, 'DD-MM-YYYY HH:mm:ss');
                if (filterToMoment.isValid() && currentCloseMoment.isAfter(filterToMoment)) {
                    currentCloseMoment = filterToMoment;
                }
            }

            const newStartStr = currentStartMoment.format('DD-MM-YYYY HH:mm:ss');
            const newCloseStr = currentCloseMoment.format('DD-MM-YYYY HH:mm:ss');

            processedRecord = {
                ...processedRecord,
                start_time: newStartStr,
                close_time: newCloseStr,
                difference: calculateTimeDifference(newCloseStr, newStartStr)
            };
        }
        return processedRecord;
    });
};

const calculateTotalDowntime = (records) => {
    if (!records || records.length === 0) return "00:00";
    
    const totalMinutesSum = records.reduce((sum, record) => {
        const diff = record.difference; // This is now "HH:mm"
        if (!diff || typeof diff !== 'string' || !diff.includes(':')) return sum;
        
        const [hrs, mins] = diff.split(':').map(Number);
        if (!isNaN(hrs) && !isNaN(mins)) {
            return sum + (hrs * 60) + mins;
        }
        return sum;
    }, 0);

    if (totalMinutesSum <= 0) return "00:00";
    
    const hours = Math.floor(totalMinutesSum / 60);
    const minutes = totalMinutesSum % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const DowntimeReport = () => {
    const [allDowntimeRecords, setAllDowntimeRecords] = useState([]);
    
    // --- CHANGE 1: Default Date to Today ---
    const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
    
    const [fromTime, setFromTime] = useState('');
    const [toTime, setToTime] = useState('');
    const [searchDeviceId, setSearchDeviceId] = useState('');
    const [districtsList, setDistrictsList] = useState([]);
    const [selectedDistrictName, setSelectedDistrictName] = useState("");
    const [assembliesList, setAssembliesList] = useState([]);
    const [selectedAssemblyValue, setSelectedAssemblyValue] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [loading, setLoading] = useState(true);
    const text = useColorModeValue('gray.500', 'gray.400');


    // Theme variables to match Camera Report
    const buttonGradientColor = useColorModeValue(
        "linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)",
        "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)"
    );
 const location = useLocation();
    const fetchDowntimeReport = useCallback(async () => {
    setLoading(true);
    try {
        // Pass the state selectedDate to the API
        const response = await getDowntimeReportAPI(selectedDate);
        setAllDowntimeRecords(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
        setAllDowntimeRecords([]);
    } finally {
        setLoading(false);
    }
}, [selectedDate]); // Add selectedDate as a dependency

    useEffect(() => { fetchDowntimeReport(); }, [fetchDowntimeReport]);

    useEffect(() => {
        if (allDowntimeRecords.length) {
            const uniqueDistricts = [...new Set(allDowntimeRecords.map(r => safeRender(r.district)).filter(Boolean))];
            setDistrictsList(uniqueDistricts.sort());
        }
    }, [allDowntimeRecords]);
    
    useEffect(() => {
        if (selectedDistrictName) {
            const uniqueAssemblies = [...new Set(allDowntimeRecords.filter(r => safeRender(r.district) === selectedDistrictName).map(r => safeRender(r.assembly)).filter(Boolean))];
            setAssembliesList(uniqueAssemblies.sort());
        } else {
            setAssembliesList([]);
        }
        setSelectedAssemblyValue("");
    }, [selectedDistrictName, allDowntimeRecords]);

    const filteredData = useMemo(() => {
        const timeSnapshot = moment();
        const processed = processRecords(allDowntimeRecords, timeSnapshot, fromTime, toTime);
        return processed.filter(r => {
            const dist = safeRender(r.district);
            const assem = safeRender(r.assembly);

            const dateMatch = !selectedDate || (r.start_time && moment(r.start_time, 'DD-MM-YYYY HH:mm:ss').isSame(selectedDate, 'day'));
            let validTimeRange = true;
            if (fromTime || toTime) {
                const s = moment(r.start_time, 'DD-MM-YYYY HH:mm:ss');
                const e = moment(r.close_time, 'DD-MM-YYYY HH:mm:ss');
                if (s.isValid() && e.isValid() && s.isAfter(e)) validTimeRange = false;
                if (s.isSame(e)) validTimeRange = false; 
            }

            return (!selectedDistrictName || dist === selectedDistrictName) &&
                   (!selectedAssemblyValue || assem === selectedAssemblyValue) &&
                   dateMatch &&
                   validTimeRange && 
                   (!searchDeviceId.trim() || (r.camera_id && r.camera_id.toLowerCase().includes(searchDeviceId.toLowerCase())));
        });
    }, [allDowntimeRecords, selectedDate, fromTime, toTime, searchDeviceId, selectedDistrictName, selectedAssemblyValue]);

    const totalDowntime = useMemo(() => calculateTotalDowntime(filteredData), [filteredData]);
    
    const paginatedAndGroupedData = useMemo(() => {
        const grouped = {};
        filteredData.forEach(record => {
            const key = `${safeRender(record.district)}_${safeRender(record.assembly)}_${record.camera_id}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(record);
        });

        const flatList = [];
        Object.values(grouped).forEach(group => {
            group.forEach(record => flatList.push(record));
            if (group.length > 1) {
                const groupTotal = calculateTotalDowntime(group);
                flatList.push({ ...group[0], isGroupTotal: true, difference: groupTotal });
            }
        });

        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        
        // Return full flatlist to handle pagination logic inside JSX for consistency or here
        // The original logic sliced here. We keep it here to maintain functionality.
        const pageData = flatList.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);

        const processedPageData = [];
        const renderedGroupKeys = new Set();
        
        for (let i = 0; i < pageData.length; i++) {
            const record = pageData[i];
            if (record.isGroupTotal) {
                processedPageData.push(record);
                continue;
            }
            const key = `${safeRender(record.district)}_${safeRender(record.assembly)}_${record.camera_id}`;
            let displayRowSpan = 0;
            const isFirstOnPage = !renderedGroupKeys.has(key);

            if (isFirstOnPage) {
                renderedGroupKeys.add(key);
                for (let j = i; j < pageData.length; j++) {
                    const futureRecord = pageData[j];
                    if (futureRecord.isGroupTotal) continue;
                    const futureKey = `${safeRender(futureRecord.district)}_${safeRender(futureRecord.assembly)}_${futureRecord.camera_id}`;
                    if (key === futureKey) displayRowSpan++;
                    else break; 
                }
            }
            processedPageData.push({ ...record, isDisplayFirst: isFirstOnPage, displayRowSpan: displayRowSpan });
        }
        return { processedPageData, totalFlatItems: flatList.length };
    }, [filteredData, currentPage, itemsPerPage]);

    // Unpack useMemo result
    const { processedPageData, totalFlatItems } = paginatedAndGroupedData;

 const handleDownloadExcel = () => {
    if (filteredData.length === 0) { 
        alert("No data to export."); 
        return; 
    }

    const grouped = {};
    filteredData.forEach(record => {
        const key = `${safeRender(record.assembly)}_${record.camera_id}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(record);
    });

    const formattedData = [];
    let srNo = 1;
    Object.values(grouped).forEach(group => {
        group.forEach((record, index) => {
            formattedData.push({
                'Sr No.': srNo++,
                'District': index === 0 ? safeRender(record.district) : '',
                'Assembly': index === 0 ? safeRender(record.assembly) : '',
                // 'PS ID': index === 0 ? safeRender(record.ps) : '',
                'Location': index === 0 ? safeRender(record.location) : '',
                'Camera ID': index === 0 ? record.camera_id : '',
                'End Time': record.close_time || 'N/A',
                'Start Time': record.start_time || 'N/A',
                'Difference': record.difference || 'N/A',
            });
        });
        if (group.length > 1) {
            formattedData.push({
                'Sr No.': '', 'District': '', 'Assembly': '', 
                'Location': '', 'Camera ID': '', 'End Time': 'Total:',
                'Start Time': '', 'Difference': calculateTotalDowntime(group),
            });
        }
    });

    // --- DYNAMIC FILENAME LOGIC ---
    let fileName = "Downtime_Report";
    if (selectedDistrictName) fileName += `_${selectedDistrictName}`;
    if (selectedAssemblyValue) fileName += `_${selectedAssemblyValue}`;
    if (selectedDate) fileName += `_${selectedDate}`;
    fileName += ".xlsx";
    // ------------------------------

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    XLSX.utils.sheet_add_aoa(worksheet, [['', '', '', '', '', '', '', '', 'Total Downtime:', totalDowntime]], { origin: -1 });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DowntimeReport');
    XLSX.writeFile(workbook, fileName);
};

 const handleDownloadPDF = () => {
    if (!filteredData || filteredData.length === 0) {
        alert("No data to export.");
        return;
    }

    // --- DYNAMIC FILENAME LOGIC ---
    let fileName = "Downtime_Report";
    if (selectedDistrictName) fileName += `_${selectedDistrictName}`;
    if (selectedAssemblyValue) fileName += `_${selectedAssemblyValue}`;
    if (selectedDate) fileName += `_${selectedDate}`;
    fileName += ".pdf";
    // ------------------------------

    const doc = new jsPDF("l", "mm", "a4"); // landscape
    doc.setFontSize(14);
    doc.text("Downtime Report", 14, 15);

    // Add filter details to the PDF header
    doc.setFontSize(10);
    doc.text(
        `Date: ${selectedDate || "All"} | District: ${selectedDistrictName || "All"} | Assembly: ${selectedAssemblyValue || "All"}`,
        14,
        22
    );

    const tableData = filteredData.map((row, index) => ([
        index + 1,
        safeRender(row.district),
        safeRender(row.assembly),
        safeRender(row.ps),
        safeRender(row.location),
        row.camera_id,
        row.start_time,
        row.close_time,
        row.difference,
    ]));

    autoTable(doc, {
        startY: 28,
        head: [[
            "Sr", "District", "Assembly", "Location", "Camera ID", "Start Time", "End Time", "Downtime"
        ]],
        body: tableData,
        styles: { fontSize: 8, halign: "center" },
        headStyles: { fillColor: [200, 214, 229], textColor: 0 },
    });

    doc.save(fileName);
};

    const handleClearFilters = () => {
        setSelectedDistrictName("");
        setSelectedAssemblyValue("");
        setSearchDeviceId("");
        setSelectedDate(moment().format("YYYY-MM-DD"));
        setFromTime("");
        setToTime("");
        setCurrentPage(1);
    };

    const createFilterHandler = (setter) => (e) => { setter(e.target.value); setCurrentPage(1); };
    const handlePageChange = (p) => setCurrentPage(p);

    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState(moment().format("HH:mm"));
    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <ChakraBox borderRadius="lg"  h={"fit-content"} flexDirection="column" gap={4} display="flex">
                
                {/* Header Row */}
                 <Flex justify="space-between" align="center" >
                          <Text fontWeight={400} fontSize="26px" color={text}>
                                     Downtime Report
                                   </Text>

                           <HStack
                           // bg="gray.100"
                            
                            border="2px solid"  
                             borderColor="blue.400"
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
              

                {/* --- CHANGE 2: Responsive Grid UI for Filters (Matching Camera Report) --- */}
               <Grid
  templateColumns={{
  base: "1fr",
  md: "repeat(3, 1fr)",
  lg: "repeat(7, 1fr)"
}}
 // columnGap={4}
 // rowGap={2}
 gap={4}

  alignItems="center"
 // p={4}
>
  {/* District */}
  <Select
    placeholder="Select District"
    bg={buttonGradientColor}
    borderRadius="12px"
    value={selectedDistrictName}
    onChange={createFilterHandler(setSelectedDistrictName)}
    color={useColorModeValue("black", "white")}
   // width={{ base: "100%", md: "120px" }}
    height="34px"
    fontSize="12px"
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
    value={selectedAssemblyValue}
    onChange={createFilterHandler(setSelectedAssemblyValue)}
    isDisabled={!selectedDistrictName || assembliesList.length === 0}
    color={useColorModeValue("black", "white")}
  //  width={{ base: "100%", md: "120px" }}
    height="34px"
    fontSize="12px"
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

  {/* Search */}
  <Input
    placeholder="Search Camera ID"
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    value={searchDeviceId}
    onChange={createFilterHandler(setSearchDeviceId)}
    color={useColorModeValue("black", "white")}
    _placeholder={{ color: useColorModeValue("gray.600", "gray.400") }}
    borderColor="transparent"
  />

  {/* Clear Filter */}
  {/* <ChakraLink
    fontSize="12px"
    textDecoration="underline"
    onClick={handleClearFilters}
    color={useColorModeValue("black", "white")}
    justifySelf="start"
  >
    CLEAR FILTER
  </ChakraLink> */}

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
    placeholder="From HH:MM"
    value={startTime}
    onChange={(e) => { setFromTime(e.target.value); setCurrentPage(1); }}
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    color={useColorModeValue("black", "white")}
    borderColor="transparent"
    maxLength={5}
  />

  {/* To Time */}
  <Input
    type="time"
    placeholder="To HH:MM"
    value={endTime}
    onChange={(e) => { setToTime(e.target.value); setCurrentPage(1); }}
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    color={useColorModeValue("black", "white")}
    borderColor="transparent"
    maxLength={5}
  />

  {/* Export Buttons */}
  <HStack
    spacing={2}
    gridColumn={{ base: "span 1", md: "span 3", lg: "span 1" }}
  >
    <Button
      bg={buttonGradientColor}
      borderRadius="12px"
      size="sm"
      height="34px"
      fontSize="12px"
      onClick={handleDownloadExcel}
      leftIcon={<FaDownload />}
    >
      XLSX
    </Button>

    <Button
      bg={buttonGradientColor}
     
     // color="white"
      borderRadius="12px"
      size="sm"
      height="34px"
      fontSize="12px"
      onClick={handleDownloadPDF}
      leftIcon={<FaFilePdf />}
    >
      PDF
    </Button>
  </HStack>
</Grid>


                {loading ? <Flex justify="center" h="200px" align="center" direction="column" gap={2}><Spinner size="xl" color="blue.500" /><Text>Loading Report...</Text></Flex> : (
                    <>
                        <div style={tableContainerStyle}>
                            <Table variant="simple" size="sm" borderRadius="15">
                                <Thead>
                                    <Tr style={tableHeaderRowStyle} bg={buttonGradientColor}>
                                        <Th style={tableHeaderStyle}>Sr No.<VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>District<VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Assembly<VerticalLine /></Th>
                                      
                                        <Th style={tableHeaderStyle}>Location<VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Camera ID<VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Start Time<VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>End Time<VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Difference</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {processedPageData.length > 0 ? processedPageData.map((r, i) => (
                                        r.isGroupTotal ? (
                                            <Tr key={`t-${i}`} bg="#f0f8ff" fontWeight="bold">
                                                <Td style={tableDataStyle}><VerticalLine /></Td>
                                                <Td colSpan={4} style={tableDataStyle}><VerticalLine /></Td>
                                                <Td style={tableDataStyle}>Total:<VerticalLine /></Td>
                                                <Td style={tableDataStyle}><VerticalLine /></Td>
                                                <Td style={tableDataStyle} color="#d32f2f">{r.difference}</Td>
                                            </Tr>
                                        ) : (
                                            <Tr key={`r-${i}`}>
                                                <Td style={tableDataStyle}>{(currentPage - 1) * itemsPerPage + i + 1}<VerticalLine /></Td>
                                                {r.isDisplayFirst && <>
                                                    <Td rowSpan={r.displayRowSpan} style={tableDataStyle}>{safeRender(r.district)}<VerticalLine /></Td>
                                                    <Td rowSpan={r.displayRowSpan} style={tableDataStyle}>{safeRender(r.assembly)}<VerticalLine /></Td>
                                                   
                                                    <Td rowSpan={r.displayRowSpan} style={tableDataStyle}>{safeRender(r.location)}<VerticalLine /></Td>
                                                    <Td rowSpan={r.displayRowSpan} style={tableDataStyle}>{safeRender(r.camera_id)}<VerticalLine /></Td>
                                                </>}
                                                <Td style={tableDataStyle}>{r.start_time}<VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{r.close_time}<VerticalLine /></Td>
                                                <Td style={{ ...tableDataStyle, fontWeight: 'bold' }}>{r.difference}</Td>
                                            </Tr>
                                        )
                                    )) : <Tr><Td colSpan={9} textAlign="center" style={tableDataStyle} p={5}>No Records found.</Td></Tr>}
                                </Tbody>
                            </Table>
                        </div>

                        {/* Total Label */}
                        <Text fontWeight="bold" fontSize="small" color="red.600" textAlign="right">Total Downtime: {totalDowntime}</Text>

                        {/* --- CHANGE 3: Numbered Pagination (Matching Camera Report) --- */}
                        {processedPageData.length > 0 && (
                            <Flex justifyContent="right" mt={4} alignItems="right">
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

                                {(() => {
                                    const totalPages = Math.ceil(totalFlatItems / itemsPerPage);
                                    const pageNumbers = [];
                                    const delta = 1;

                                    for (let i = 1; i <= totalPages; i++) {
                                        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                                            pageNumbers.push(i);
                                        } else if ((i === currentPage - delta - 1 && i > 1) || (i === currentPage + delta + 1 && i < totalPages)) {
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

                                <Button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    isDisabled={currentPage * itemsPerPage >= totalFlatItems}
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
        </div>
    );
};

export default DowntimeReport;
