import React, { useEffect, useState } from "react";
import {
 Box,
 Select,
 Text,
 IconButton,
 Popover,
 PopoverTrigger,
 PopoverContent,
 PopoverArrow,
 PopoverBody,
 Grid,
 Table,
 Thead,
 Tbody,
 Tr,
 Th,
 Td,
 useColorModeValue,
 Flex,
 Spinner,
 Image, // Keep this import from Chakra UI
 Modal,
 ModalOverlay,
 ModalContent,
 ModalCloseButton,
 ModalBody,
 useDisclosure,
} from "@chakra-ui/react";
import {
 CalendarIcon,
 ChevronLeftIcon,
 ChevronRightIcon,
} from "@chakra-ui/icons";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import CustomCard from "../components/CustomCard";
import { getAllCameras } from "../actions/cameraActions";
import { getReports, getTabluarReport } from "../actions/alertActions";
import { IoDownloadOutline } from "react-icons/io5";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import MobileHeader from "../components/MobileHeader";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Reports = () => {
 const today = new Date();
 const [selectedDevice, setSelectedDevice] = useState("");
 const [cameras, setCameras] = useState([]);
 const [reports, setReports] = useState({});
 const [tabluarReport, setTabluarReport] = useState([]);
 const [selectedDate, setSelectedDate] = useState();
 const [loading, setLoading] = useState(false);
 const [currentPage, setCurrentPage] = useState(1);
 const [totalPages, setTotalPages] = useState(0);
 const [selectedEventType, setSelectedEventType] = useState("");
 const { isOpen, onOpen, onClose } = useDisclosure();
 const [modalImageUrl, setModalImageUrl] = useState("");
 const textColor = useColorModeValue("#1A1A1A", "#FFFFFF");
 const bgColor = useColorModeValue("#C8D6E5", "#54637A");

 // --- NEW: Helper function to safely construct the image URL ---
 const getFullImageUrl = (partialUrl) => {
 if (!partialUrl) {
 return ""; // Return empty string if the URL is null or undefined
 }
 // If the URL is already a full path, return it as is
 if (partialUrl.startsWith("http://") || partialUrl.startsWith("https://")) {
 return partialUrl;
 }
 // Otherwise, construct the full URL
 return `https://alert.arcisai.io${partialUrl}`;
 };

 const fetchAllCameras = async () => {
 try {
 const response = await getAllCameras();
 setCameras(response.cameras || []);
 } catch (error) {
 console.error("Error fetching cameras:", error);
 }
 };

 const fetchAllReports = async (deviceId, date) => {
 try {
 setLoading(true);
 const response = await getReports(deviceId, date);
 setReports(response || {});
 } catch (error) {
 console.error("Error fetching reports:", error);
 } finally {
 setLoading(false);
 }
 };

 const fetchTabularReport = async (deviceId, date, page, eventType) => {
 try {
 setLoading(true);
 const response = await getTabluarReport(deviceId, date, page, eventType);
 setTabluarReport(response.data || []);
 setTotalPages(response.totalPages || 0);
 } catch (error) {
 console.error("Error fetching tabular reports:", error);
 } finally {
 setLoading(false);
 }
 };

 const handleDeviceChange = (event) => {
 const newDeviceId = event.target.value;
 setSelectedDevice(newDeviceId);
 fetchAllReports(newDeviceId, selectedDate);
 fetchTabularReport(
 newDeviceId,
 selectedDate,
 currentPage,
 selectedEventType
 );
 };

 const formatDate = (date) => {
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, "0");
 const day = String(date.getDate()).padStart(2, "0");
 return `${year}-${month}-${day}`;
 };

 const handleDateChange = (date) => {
 const formattedDate = formatDate(date);
 setSelectedDate(formattedDate);
 fetchAllReports(selectedDevice, formattedDate);
 fetchTabularReport(
 selectedDevice,
 formattedDate,
 currentPage,
 selectedEventType
 );
 };

 const handlePageChange = (direction) => {
 const newPage = direction === "next" ? currentPage + 1 : currentPage - 1;
 setCurrentPage(newPage);
 fetchTabularReport(
 selectedDevice,
 selectedDate,
 newPage,
 selectedEventType
 );
 };

 const handleDownloadPDF = async () => {
 const doc = new jsPDF();
 doc.setFontSize(16);
 doc.text("Tabular Report", 14, 22);

 const tableColumns = [
 "SR No",
 "Image",
 "Device",
 "Event Type",
 "Timestamp",
 ];
 const tableRows = [];

 const imagePromises = tabluarReport.map((report) => {
 const fullUrl = getFullImageUrl(report.imageUrl);
 if (!fullUrl) return Promise.resolve(null);

 return new Promise((resolve) => {
 const img = new window.Image();
 img.crossOrigin = "Anonymous";
 img.onload = () => {
 const canvas = document.createElement("canvas");
 canvas.width = img.width;
 canvas.height = img.height;
 const ctx = canvas.getContext("2d");
 ctx.drawImage(img, 0, 0);
 resolve(canvas.toDataURL("image/jpeg"));
 };
 img.onerror = () => resolve(null);
 img.src = fullUrl;
 });
 });

 const images = await Promise.all(imagePromises);

 tabluarReport.forEach((report, index) => {
 tableRows.push([
 (currentPage - 1) * 10 + index + 1,
 "", // Image placeholder
 report.deviceSN,
 report.eventType,
 report.timeStamp,
 ]);
 });

 doc.autoTable({
 head: [tableColumns],
 body: tableRows,
 startY: 30,
 didDrawCell: (data) => {
 if (data.column.index === 1 && data.cell.section === "body") {
 const image = images[data.row.index];
 if (image) {
 doc.addImage(image, "JPEG", data.cell.x + 2, data.cell.y + 2, 15, 15);
 }
 }
 },
 styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
 headStyles: { fillColor: [200, 214, 229], textColor: [26, 26, 26] },
 columnStyles: { 0: { cellWidth: 15 }, 1: { cellWidth: 20 } },
 bodyStyles: { minCellHeight: 20 },
 });

 doc.save("Analytics_Report.pdf");
 };

 const handleEventTypeChange = (event) => {
 const selectedType = event.target.value;
 setSelectedEventType(selectedType);
 setCurrentPage(1);
 if (selectedType === "TOTAL") {
 fetchTabularReport(selectedDevice, selectedDate, currentPage);
 } else {
 fetchTabularReport(selectedDevice, selectedDate, 1, selectedType);
 }
 };

 const handleOpenModal = (url) => {
 setModalImageUrl(url);
 onOpen();
 };

 useEffect(() => {
 fetchAllCameras();
 fetchTabularReport();
 fetchAllReports();
 }, []);

 // --- RENDER LOGIC ---
 return (
 <Box p={3} maxW="1440px" mx="auto" mb={{ base: "20", md: "5" }}>
 <style>
 {`
 .react-datepicker__day--selected {
 background-color: ${bgColor} !important;
 color: ${textColor} !important;
 border-radius: 20%;
 }
 `}
 </style>
 <MobileHeader title="Reports" />

 <Box
 display="flex"
 justifyContent="space-between"
 alignItems="center"
 flexDirection={{ base: "column", md: "row" }}
 gap={{ base: 4, md: 6 }}
 mt={{ base: "12", md: "0" }}
 >
 <Text
 display={{ base: "none", md: "block" }}
 fontSize={{ base: "lg", md: "2xl" }}
 fontWeight="bold"
 textAlign={{ base: "center", md: "left" }}
 >
 Reports
 </Text>

 <Flex justifyContent={"space-between"} gap={4}>
 <Select
 value={selectedEventType}
 onChange={handleEventTypeChange}
 placeholder="Select Event Type"
 >
 {reports.eventTypeCounts &&
 Object.keys(reports.eventTypeCounts).map((eventType) => (
 <option key={eventType} value={eventType}>
 {eventType}
 </option>
 ))}
 </Select>

 <Select
 placeholder="Select Device"
 value={selectedDevice}
 onChange={handleDeviceChange}
 >
 {cameras.map((camera) => (
 <option key={camera.deviceId} value={camera.deviceId}>
 {camera.deviceId}
 </option>
 ))}
 </Select>

 <Popover placement="bottom-start">
 <PopoverTrigger>
 <IconButton aria-label="Select Date" icon={<CalendarIcon />} variant="outline" />
 </PopoverTrigger>
 <PopoverContent w="fit-content" maxW="320px">
 <PopoverArrow />
 <PopoverBody>
 <DatePicker
 selected={selectedDate}
 onChange={handleDateChange}
 inline
 maxDate={today}
 />
 </PopoverBody>
 </PopoverContent>
 </Popover>
 </Flex>
 </Box>

 <Grid
 templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }}
 gap={4}
 mt={6}
 >
 <CustomCard
 key="totalCount"
 value={reports.totalCount}
 title="Total"
 color={textColor}
 bcolor="white"
 />
 {reports.eventTypeCounts &&
 Object.entries(reports.eventTypeCounts).map(([key, value]) => (
 <CustomCard
 key={key}
 value={value}
 title={key}
 color={textColor}
 bcolor="white"
 />
 ))}
 </Grid>

 <Box mt={10}>
 <Flex
 justifyContent={"space-between"}
 alignItems={"center"}
 flexWrap="wrap"
 gap={4}
 >
 <Text fontSize="lg" fontWeight="bold">
 Tabular Report
 </Text>

 <IconButton
 aria-label="Download PDF Report"
 icon={<IoDownloadOutline size="20px" />}
 onClick={handleDownloadPDF}
 colorScheme="blue"
 variant="outline"
 isDisabled={tabluarReport.length === 0}
 />
 </Flex>

 {loading ? (
 <Flex justifyContent="center" alignItems="center">
 <Spinner size="lg" />
 </Flex>
 ) : (
 <>
 <Table
 display={{ base: "none", md: "table" }}
 showColumnBorder={true}
 mt={4}
 variant={"striped"}
 >
 <Thead bg={bgColor} textColor={textColor}>
 <Tr>
 <Th>SR No</Th>
 <Th>Image</Th>
 <Th>Device</Th>
 <Th>Event Type</Th>
 <Th>Timestamp</Th>
 </Tr>
 </Thead>
 <Tbody>
 {tabluarReport.length > 0 ? (
 tabluarReport.map((report, index) => {
 const fullImageUrl = getFullImageUrl(report.imageUrl);
 return (
 <Tr key={index}>
 <Td>{(currentPage - 1) * 10 + index + 1}</Td>
 <Td>
 {fullImageUrl ? (
 <Image
 src={fullImageUrl}
 fallbackSrc="https://via.placeholder.com/90?text=No+Preview"
 width={"90px"}
 cursor="pointer"
 crossOrigin="anonymous"
 onClick={() => handleOpenModal(fullImageUrl)}
 alt={report.eventType || "Event image"}
 />
 ) : (
 <Text fontSize="sm" color="gray.500">No Image</Text>
 )}
 </Td>
 <Td>{report.deviceSN}</Td>
 <Td>{report.eventType}</Td>
 <Td>{report.timeStamp}</Td>
 </Tr>
 );
 })
 ) : (
 <Tr>
 <Td colSpan="5" textAlign="center">
 No Data Available
 </Td>
 </Tr>
 )}
 </Tbody>
 </Table>

 <Box display={{ base: "block", md: "none" }} mt={4}>
 {tabluarReport.length > 0 ? (
 tabluarReport.map((report, index) => {
 const fullImageUrl = getFullImageUrl(report.imageUrl);
 return (
 <Box
 key={index}
 borderWidth="1px"
 borderRadius="md"
 overflow="hidden"
 p={4}
 mb={4}
 boxShadow="md"
 >
 <Flex justifyContent="space-between" mb={2}>
 <Text fontWeight="bold">SR No:</Text>
 <Text>{(currentPage - 1) * 10 + index + 1}</Text>
 </Flex>
 <Flex justifyContent="space-between" mb={2}>
 <Text fontWeight="bold">Image:</Text>
 {fullImageUrl ? (
 <Image
 src={fullImageUrl}
 fallbackSrc="https://via.placeholder.com/90?text=No+Preview"
 width={"90px"}
 cursor="pointer"
 crossOrigin="anonymous"
 onClick={() => handleOpenModal(fullImageUrl)}
 alt={report.eventType || "Event image"}
 />
 ) : (
 <Text fontSize="sm" color="gray.500">No Image</Text>
 )}
 </Flex>
 <Flex justifyContent="space-between" mb={2}>
 <Text fontWeight="bold">Device:</Text>
 <Text>{report.deviceSN}</Text>
 </Flex>
 <Flex justifyContent="space-between" mb={2}>
 <Text fontWeight="bold">Event Type:</Text>
 <Text>{report.eventType}</Text>
 </Flex>
 <Flex justifyContent="space-between">
 <Text fontWeight="bold">Timestamp:</Text>
 <Text>{report.timeStamp}</Text>
 </Flex>
 </Box>
 );
 })
 ) : (
 <Text textAlign="center">No Data Available</Text>
 )}
 </Box>
 </>
 )}

 <Box display="flex" justifyContent="center" mt={4} alignItems="center">
 <Flex>
 <IconButton
 aria-label="Previous Page"
 icon={<ChevronLeftIcon />}
 onClick={() => handlePageChange("prev")}
 isDisabled={currentPage === 1}
 mr={2}
 />
 <Text alignSelf="center">
 Page {currentPage} of {totalPages}
 </Text>
 <IconButton
 aria-label="Next Page"
 icon={<ChevronRightIcon />}
 onClick={() => handlePageChange("next")}
 isDisabled={currentPage === totalPages}
 ml={2}
 />
 </Flex>
 </Box>
 </Box>

 <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
 <ModalOverlay />
 <ModalContent>
 <ModalCloseButton />
 <ModalBody>
 <Image
 src={modalImageUrl}
 alt="Event Image"
 width="100%"
 objectFit="contain"
 />
 </ModalBody>
 </ModalContent>
 </Modal>
 </Box>
 );
};

export default Reports;
