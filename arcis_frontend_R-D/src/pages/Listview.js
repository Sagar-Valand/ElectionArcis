import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Box as ChakraBox, // Renamed to avoid conflict with standard Box
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
  Box, // Standard Box from Chakra UI
  Link as ChakraLink,
  Image,
  useColorMode, // Import useColorMode to access current mode
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  border,
  Collapse,
  SimpleGrid,
  Center,
} from "@chakra-ui/react";
import * as XLSX from "xlsx";
import { FaDownload, FaEye, FaChevronDown, FaChevronUp,FaFilePdf  } from "react-icons/fa";
import Player from "../components/Player";
import SimpleFLVPlayer from "../components/SimpleFLVPlayer";
import { Link as RouterLink, useLocation } from "react-router-dom"; // Import useLocation
import { MdGridView } from "react-icons/md";
import { TfiLayoutListThumb } from "react-icons/tfi";
import Frame from "../assets/Frame.png";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { IoSearchOutline, IoSettingsOutline } from "react-icons/io5";
import CameraSettingsModal from "../components/Modals/CameraSettingsModal";
import CameraPTZ from "../components/CameraPTZ";
// Add these to your existing imports
import { BsVolumeMute, BsVolumeUp } from "react-icons/bs";

// --- API Fetching Function (Unchanged) ---
const getYourCamerasAPI = async (userEmail) => {
  const API_URL = `${process.env.REACT_APP_URL}/api/camera/getcurrentUserCameras`;

  // ... inside getYourCamerasAPI const ...

  const generateStreamUrl = (camera) => {
    // 1. ADD THIS CHECK FOR SSAN CAMERAS
    if (camera.deviceId && camera.deviceId.startsWith("SSAN")) {
      return `wss://ptz.vmukti.com/live-record/${camera.deviceId}.flv`;
    }

    // 2. Existing logic follows...
    if (camera.plan === "LIVE" && camera.p2purl && camera.token) {
      return `https://${camera.deviceId}.${camera.p2purl}/flv/live_ch0_0.flv?verify=${camera.token}`;
    }
    if (camera.mediaUrl) {
      return `wss://${camera.mediaUrl}/jessica/DVR/${camera.deviceId}.flv`;
    }
    return "";
  };

  try {
    const response = await axios.post(API_URL, { email: userEmail });
    if (response.data && Array.isArray(response.data)) {
      return response.data.map((camera) => {
        let locationString = "N/A";
        if (
          camera.locations &&
          Array.isArray(camera.locations) &&
          camera.locations.length > 0
        ) {
          const firstLocation = camera.locations[0];
          locationString =
            typeof firstLocation === "string"
              ? firstLocation
              : firstLocation?.loc_name || "N/A";
        }
        return {
          DeviceId: camera.deviceId,
          district: camera.dist_name,
          assembly: camera.accName,
          ps_id: camera.ps_id,
          location: locationString,
          Status: camera.status,
          last_checked:
            camera.last_checked ||
            camera.lastSeen ||
            camera.updatedAt ||
            new Date().toISOString(),
          user_email: userEmail,
          name: camera.name,
          operatorName: camera.operatorName,
          operatorMobile: camera.operatorMobile,
          streamUrl: generateStreamUrl(camera),
          ...camera,
          location_Type: camera.location_Type || "N/A",
        };
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error(
      "Error fetching cameras:",
      error.response ? error.response.data : error.message
    );
    return [];
  }
};
// --- End API Fetching Function ---

// --- Helper Styles (Unchanged) ---
const headingStyle = {
  textAlign: "left",
  fontSize: "25px",
  fontWeight: "650",
  marginBottom: "20px",
};
const filterLabelStyle = {
  marginRight: "10px",
  fontWeight: "bold",
  fontSize: "16px",
  whiteSpace: "nowrap",
};
const tableHeaderRowStyle = {
  position: "sticky",
  top: 0, // Ensure it sticks to the top
  zIndex: 1,
  borderRadius: "5px"
};

const tableHeaderStyle = {
  padding: "4px 10px", // Match padding with Td for consistency
  verticalAlign: "middle", // Align header text vertically
  textAlign: "center", // Center header text horizontally
  position: "relative", // Crucial: Allows absolute positioning of VerticalLine inside Th
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",

  // Added for consistent border in the header if you decide to add it back
  // borderBottom: "1px solid #ddd", 
};

const tableDataStyle = {
  padding: "2px 10px", // Adjust padding as needed
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
const filterContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};
const selectStyle = {
  color: "Black",
  backgroundColor: "#CDDEEB",
  width: "180px",
  minWidth: "150px",
};
const inputStyle = {
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  fontSize: "14px",
  color: "Black",
  backgroundColor: "#9CBAD2",
  width: "180px",
};
// --- End Helper Styles ---
const VerticalLine = () => (
  <span
    style={{
      position: "absolute",
      right: "0", // Position to the right edge of the parent Td
      top: "50%", // Vertically center the line
      transform: "translateY(-50%)", // Adjust for true centering
      height: "70%", // Make the line almost as tall as the cell
      width: "2px",
      backgroundColor: "#3F77A5", // Use background-color for a simpler line
    }}
  ></span>
);
const Boxes = () => {
  const [allFetchedCameras, setAllFetchedCameras] = useState([]);
  const [displayedCameras, setDisplayedCameras] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [searchDeviceId, setSearchDeviceId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);
  const [camerasTab, setCamerasTab] = useState("My Cameras");
  const [districtsList, setDistrictsList] = useState([]);
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [assembliesList, setAssembliesList] = useState([]);
  const [selectedAssemblyValue, setSelectedAssemblyValue] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const textColor = useColorModeValue("black", "white");
  const placeholderColor = useColorModeValue("gray.600", "gray.400");
  const [searchInput, setSearchInput] = useState("");
  const {
    isOpen: isStreamModalOpen,
    onOpen: onStreamModalOpen,
    onClose: onStreamModalClose,
  } = useDisclosure();
  const playerRef = useRef(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedLocationType, setSelectedLocationType] = useState("all");
  const [psOption, setPsOption] = useState("camera");
  const [reportFormat, setReportFormat] = useState("csv");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardTextColor = useColorModeValue("gray.800", "white");
  const overlayBg = useColorModeValue("rgba(255,255,255,0.8)", "rgba(0,0,0,0.6)");

  // State for Mobile Dropdown (More Info)
  const [expandedRows, setExpandedRows] = useState({});

  // State for CameraSettingsModal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const location = useLocation(); // To determine current view (grid/list)

  // Use Chakra's useColorMode hook to get current mode for dynamic icon src
  const { colorMode } = useColorMode();
  const [isMuted, setIsMuted] = useState(true); // Default to muted

  // Update handleCloseModal to reset mute status
  const handleCloseModal = () => {
    onStreamModalClose();
    setSelectedCamera(null);
    setIsMuted(true); // Reset for next time
  };

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) setUserEmail(email);
  }, []);

  const fetchAllUserCameras = useCallback(async (isInitial = false) => {
  if (!userEmail) return;

  if (isInitial) setLoading(true);

  try {
    const response = await getYourCamerasAPI(userEmail);
    if (Array.isArray(response)) {
      if (isInitial) {
        // Initial load: Set the full data
        setAllFetchedCameras(response);
      } else {
        // Refresh: ONLY update the status field for each camera
        setAllFetchedCameras(prevCameras => 
          prevCameras.map(oldCam => {
            const updatedCam = response.find(newCam => newCam.DeviceId === oldCam.DeviceId);
            // We return the old camera object but with the NEW status
            return updatedCam 
              ? { ...oldCam, status: updatedCam.status } 
              : oldCam;
          })
        );
      }
    }
  } catch (err) {
    console.error("Status refresh failed:", err);
  } finally {
    if (isInitial) setLoading(false);
  }
}, [userEmail]);

  useEffect(() => {
  // 1. Initial load (with spinner)
  fetchAllUserCameras(true);

  // 2. Refresh status every 60 seconds (no spinner)
  const intervalId = setInterval(() => {
    fetchAllUserCameras(false);
  }, 60000);

  // 3. Cleanup on leave
  return () => clearInterval(intervalId);
}, [fetchAllUserCameras]);

  useEffect(() => {
    const districts = [
      ...new Set(allFetchedCameras.map((c) => c.district).filter(Boolean)),
    ];
    setDistrictsList(districts.sort());
    setSelectedDistrictName("");
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

  // MODIFIED: useEffect for filtering
  useEffect(() => {
    let data = [...allFetchedCameras];
    if (camerasTab === "Live Cameras") {
      data = data.filter((c) => c.status === true);
    }
    if (selectedDistrictName) {
      data = data.filter((c) => c.district === selectedDistrictName);
    }
    if (selectedAssemblyValue) {
      data = data.filter((c) => c.assembly === selectedAssemblyValue);
    }
    // ADDED: Status filter logic
    if (selectedStatus) {
      const isOnline = selectedStatus === "online";
      data = data.filter((c) => c.status === isOnline);
    }
    if (psOption === "ps" && searchDeviceId) {
      data = data.filter((c) =>
        c.ps_id?.toLowerCase().includes(searchDeviceId.toLowerCase())
      );
    } else if (psOption === "camera" && searchDeviceId) {
      data = data.filter((c) =>
        c.DeviceId?.toLowerCase().includes(searchDeviceId.toLowerCase())
      );
    }

    if (selectedLocationType !== "all") {
      data = data.filter((c) => c.location_Type === selectedLocationType);
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
    selectedStatus, // ADDED: Dependency
    camerasTab,
    selectedLocationType,
    psOption,
  ]);

  const createPageResetHandler = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleViewStream = (camera) => {
    setSelectedCamera(camera);
    onStreamModalOpen();
  };



  const handleSearchDeviceIdChange = (event) => {
    setSearchDeviceId(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleDistrictChange = (event) => {
    setSelectedDistrictName(event.target.value);
    setSelectedAssemblyValue(""); // Reset assembly when district changes
    setCurrentPage(1);
  };

  const handleAssemblyChange = (event) => {
    setSelectedAssemblyValue(event.target.value);
    setCurrentPage(1);
  };

  const handleLocationTypeChange = createPageResetHandler(
    setSelectedLocationType
  );

  const handleClearFilters = () => {
    setSelectedDistrictName("");
    setSelectedAssemblyValue("");
    setSelectedLocationType("all");
    setSelectedStatus("");
    setSearchDeviceId("");
    setPsOption("camera"); // Reset to default radio option
    setCurrentPage(1);
  };

  const getFilteredDataForExportAndCount = useCallback(() => {
    let data = [...allFetchedCameras];

    // 1. Tab Filter (Live Cameras vs My Cameras)
    if (camerasTab === "Live Cameras") {
      data = data.filter((c) => c.status === true);
    }

    // 2. District Filter
    if (selectedDistrictName) {
      data = data.filter((c) => c.district === selectedDistrictName);
    }

    // 3. Assembly Filter
    if (selectedAssemblyValue) {
      data = data.filter((c) => c.assembly === selectedAssemblyValue);
    }

    // 4. Status Filter (Online/Offline dropdown) - THIS IS THE FIX
    if (selectedStatus) {
      const isOnline = selectedStatus === "online";
      data = data.filter((c) => c.status === isOnline);
    }

    // 5. Search ID / PS ID Filter
    if (searchDeviceId) {
      const term = searchDeviceId.toLowerCase();
      if (psOption === "ps") {
        data = data.filter((c) => c.ps_id?.toLowerCase().includes(term));
      } else {
        data = data.filter((c) => c.DeviceId?.toLowerCase().includes(term));
      }
    }

    // 6. Location Type Filter
    if (selectedLocationType !== "all") {
      data = data.filter((c) => c.location_Type === selectedLocationType);
    }

    return data;
  }, [
    allFetchedCameras,
    camerasTab,
    selectedDistrictName,
    selectedAssemblyValue,
    selectedStatus,
    searchDeviceId,
    psOption,
    selectedLocationType,
  ]);

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setCurrentPage(1);
  };

  const toggleMoreInfo = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    let data = [...allFetchedCameras];

    if (camerasTab === "Live Cameras") {
      data = data.filter((c) => c.status === true);
    }

    if (selectedDistrictName) {
      data = data.filter((c) => c.district === selectedDistrictName);
    }

    if (selectedAssemblyValue) {
      data = data.filter((c) => c.assembly === selectedAssemblyValue);
    }

    if (selectedStatus) {
      const isOnline = selectedStatus === "online";
      data = data.filter((c) => c.status === isOnline);
    }

    if (searchDeviceId) {
      const term = searchDeviceId.toLowerCase();

      if (psOption === "ps") {
        data = data.filter((c) =>
          String(c.location || "")
            .toLowerCase()
            .includes(term)
        );
      } else {
        data = data.filter((c) =>
          String(c.DeviceId || "")
            .toLowerCase()
            .includes(term)
        );
      }
    }

    if (selectedLocationType !== "all") {
      data = data.filter((c) => c.location_Type === selectedLocationType);
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
    selectedStatus,
    camerasTab,
    selectedLocationType,
    psOption,
  ]);



  // MODIFIED: Pagination count logic
  const totalItemsAfterFilters = allFetchedCameras
    .filter((c) => (camerasTab === "Live Cameras" ? c.status === true : true))
    .filter(
      (c) => !selectedDistrictName || c.district === selectedDistrictName
    )
    .filter(
      (c) => !selectedAssemblyValue || c.assembly === selectedAssemblyValue
    )
    .filter((c) => {
      if (!selectedStatus) return true;
      const isOnline = selectedStatus === "online";
      return c.status === isOnline;
    })
    .filter((c) => {
      if (!searchDeviceId) return true;
      if (psOption === "ps") {
        return c.ps_id?.toLowerCase().includes(searchDeviceId.toLowerCase());
      }
      return c.DeviceId?.toLowerCase().includes(searchDeviceId.toLowerCase());
    })
    .filter((c) => {
      if (selectedLocationType === "all") return true;
      return c.location_Type === selectedLocationType;
    }).length;


  // --- New Theme Variables ---
  const buttonGradientColor = useColorModeValue(
    "linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)"
    , // light mode
    "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)" // dark mode
  );

  const radioButtonColor = useColorModeValue("#9CBAD2", "#CDDEEB"); // Adjusted for better dark mode visibility
  const iconColor = useColorModeValue("black", "white"); // Icon color based on mode
  const gradientBorderColor = useColorModeValue(
    "linear-gradient(149.18deg, #D6D6D6 0%, #797b7eff 101.62%)", // Light mode border
    "linear-gradient(149.18deg, #D6D6D6 0%, #040811 101.62%)" // Dark mode border
  );

  // Dynamic icon sources for dark/light mode
  const grid_view_icon_src = useColorModeValue(
    "/images/grid_view_icon_light.png", // Ensure this path is correct for light mode
    "/images/grid_view_icon.png" // Ensure this path is correct for dark mode
  );
  const list_view_icon_src = useColorModeValue(
    "/images/list_view_icon_light.png", // Ensure this path is correct for light mode
    "/images/list_view_icon.png" // Ensure this path is correct for dark mode
  );
  // Placeholder for the horizontal line image
  const right_of_text_image = useColorModeValue(
    "/images/right_of_text_light.png", // Light mode line image
    "/images/right_of_text.png" // Dark mode line image
  );

  const handlePDFExport = useCallback(() => {
    const filteredData = getFilteredDataForExportAndCount();

    if (filteredData.length === 0) {
      alert("No data found for the current filters.");
      return;
    }

    const dataToExport = filteredData.map((camera, index) => ({
      "Sr No.": index + 1,
      "Device Id": camera.DeviceId,
      "District": camera.district || "N/A",
      "Assembly": camera.assembly || "N/A",
      "Location": camera.location || "N/A",
      "Operator Name": camera.operatorName || "N/A",
      "Operator Contact": camera.operatorMobile || "N/A",
      "Status": camera.status ? "Online" : "Offline",
    }));

    const doc = new jsPDF();

    // Add title to PDF
    doc.setFontSize(18);
    doc.text("Camera Status Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    // Create the table
    const tableColumn = Object.keys(dataToExport[0]);
    const tableRows = dataToExport.map(item => Object.values(item));

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillGray: [40, 40, 40], textColor: [255, 255, 255] },
    });

    doc.save(`Camera_Report_${new Date().getTime()}.pdf`);
  }, [getFilteredDataForExportAndCount]);

  const handleCSVExport = useCallback(() => {
    const filteredData = getFilteredDataForExportAndCount();

    if (filteredData.length === 0) {
      alert("No data found for the current filters.");
      return;
    }

    const dataToExport = filteredData.map((camera, index) => ({
      "Sr No.": index + 1,
      "Device Id": camera.DeviceId,
      "District": camera.district || "N/A",
      "Assembly": camera.assembly || "N/A",
      "Location": camera.location || "N/A",
      "Operator Name": camera.operatorName || "N/A",
      "Operator Mobile": camera.operatorMobile || "N/A",
      "Status": camera.status ? "Online" : "Offline",
    }));

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cameras");

    // Trigger download (The extension .csv works with XLSX.writeFile)
    XLSX.writeFile(workbook, `Camera_Report_${new Date().getTime()}.xlsx`);
  }, [getFilteredDataForExportAndCount]);

  const handleDownloadReport = useCallback(() => {
    if (reportFormat === "csv") {
      handleCSVExport();
    } else if (reportFormat === "pdf") {
      handlePDFExport();
    } else {
      alert("Please select a report format.");
    }
  }, [reportFormat, handleCSVExport, handlePDFExport]);

  const text = useColorModeValue('gray.500', 'gray.400');

  // --- Start Added Helper UI Components for Mobile ---
  const MobileMetricCell = ({ label, value, colorDot }) => (
    <HStack spacing={2} borderLeft="2px solid" borderColor="blue.100" pl={3} align="center">
      <Box w="8px" h="8px" borderRadius="full" bg={colorDot} />
      <VStack align="start" spacing={0}>
        <Text fontSize="10px" color="gray.500">{label}</Text>
        <Text fontWeight="600" fontSize="xs" isTruncated maxW="100px">
          {value || "N/A"}
        </Text>
      </VStack>
    </HStack>
  );
  // --- End Added Helper UI Components ---

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <ChakraBox
        borderRadius="lg"
        h={"fit-content"}
        flexDirection="column"
        gap={4}
        display="flex"
      >
        {/* Header Row */}
        <Flex justifyContent="space-between" align="center">
          <Text fontWeight={400} fontSize="26px" mb={2} color={text}>
            List View
          </Text>


          {/* View Toggle */}
          <Flex gap={3}>
            {/* Grid View Button */}
            <Box
              borderRadius="12px"
              p="1px"
              bg={
                location.pathname === "/cameras"
                  ? gradientBorderColor
                  : "transparent"
              }
            >
              <Box
                as={RouterLink}
                to="/cameras"
                bg={
                  location.pathname === "/cameras"
                    ? buttonGradientColor
                    : "transparent"
                }
                p="8px"
                borderRadius="12px"
                onClick={() => console.log("Switched to grid view")}
                aria-label="Grid View"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {/* Use an Image for grid view icon if you have a PNG/SVG, otherwise Icon */}
                {colorMode === 'light' ?
                  <Image src="/images/grid_view_icon_light.png" alt="Grid View" boxSize="20px" /> :
                  <Image src="/images/grid_view_icon.png" alt="Grid View" boxSize="20px" />}
                {/* Fallback/Alternative: <Icon as={MdGridView} boxSize="20px" color={iconColor} /> */}
              </Box>
            </Box>

            {/* List View Button */}
            <Box
              borderRadius="12px"
              p="1px"
              bg={
                location.pathname === "/listview"
                  ? gradientBorderColor
                  : "transparent"
              }
            >
              <Box
                as={RouterLink}
                to="/listview"
                bg={
                  location.pathname === "/listview"
                    ? buttonGradientColor
                    : "transparent"
                }
                p="8px"
                borderRadius="12px"
                onClick={() => console.log("Switched to list view")}
                aria-label="List View"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                {/* Use an Image for list view icon if you have a PNG/SVG, otherwise Icon */}
                {colorMode === 'light' ?
                  <Image src="/images/list_view_icon_light.png" alt="List View" boxSize="20px" /> :
                  <Image src="/images/list_view_icon.png" alt="List View" boxSize="20px" />}
                {/* Fallback/Alternative: <Icon as={TfiLayoutListThumb} boxSize="20px" color={iconColor} /> */}
              </Box>
            </Box>
          </Flex>
        </Flex>

        {/* Filter Row */}

        <Flex
          gap={4} flexWrap="wrap" mb={{ base: 2, md: 0 }}
          alignItems="center"
        >

          {/* 1. District Select */}
          <Select
            placeholder="Select District"
            bg={buttonGradientColor}
            borderRadius={"12px"}//background_img_light.png
            value={selectedDistrictName}
            onChange={handleDistrictChange}
            sx={{
              "> option": {
                bg: useColorModeValue("white", "gray.700"),
                color: useColorModeValue("black", "white"),
              },
            }}
            height={"34px"}
            fontSize={"12px"}
            w="auto"
          >
            {districtsList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>


          {/* 2. Assembly Select */}

          <Select
            placeholder="Select Assembly"
            bg={buttonGradientColor}
            borderRadius={"12px"}
            value={selectedAssemblyValue}
            onChange={handleAssemblyChange}
            sx={{
              "> option": {
                bg: useColorModeValue("white", "gray.700"),
                color: useColorModeValue("black", "white"),
              },
            }}

            height={"34px"}
            fontSize={"12px"}
            w="auto"
          >
            {assembliesList.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>


          {/* 3. Status Select */}

          <Select
            placeholder="Select Status"
            bg={buttonGradientColor}
            borderRadius={"12px"}
            value={selectedStatus}
            onChange={handleStatusChange}
            sx={{
              "> option": {
                bg: useColorModeValue("white", "gray.700"),
                color: useColorModeValue("black", "white"),
              },
            }}
            height={"34px"}
            fontSize={"12px"}
            w="auto"
          >
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </Select>



          {/* 5. Search Bar */}
          <RadioGroup onChange={setPsOption} value={psOption}>
            <HStack>
              <Radio
                value="ps"
                size="md"
                colorScheme="blue"
                borderColor="gray.400"
              >
                <Text fontSize="13px" fontWeight={psOption === "ps" ? "bold" : "normal"}>Location</Text>
              </Radio>
              <Text color="gray.400" fontSize="12px">|</Text>
              <Radio
                value="camera"
                size="md"
                colorScheme="blue"
                borderColor="gray.400"
              >
                <Text fontSize="13px" fontWeight={psOption === "camera" ? "bold" : "normal"}>Camera ID</Text>
              </Radio>
            </HStack>
          </RadioGroup>

          {/* <InputGroup w="200px" > */}
            {/* <InputLeftElement pointerEvents="none" height="100%">
              <IconButton
                icon={<IoSearchOutline size="16px" />}
                variant="ghost"
                aria-label="Search"
                size="sm"
                _hover={{ bg: "transparent" }}
                color="gray.400"
              />
            </InputLeftElement> */}
            <Input
              placeholder={psOption === "ps" ? "Search Location" : "Search Camera ID"}
              border="1px solid #CBD5E0"
              value={searchDeviceId}
              onChange={handleSearchDeviceIdChange}
              size="lg"
              width={"135px"}
              height={"34px"}
              fontSize={"12px"}
              bg={buttonGradientColor}
              borderRadius={"12px"}
              color={textColor}
              _placeholder={{ color: placeholderColor }}
            // _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299e1" }}
            />
          {/* </InputGroup> */}


          {/* 6. CSV / PDF Radio Group */}
             <HStack spacing={2} flexShrink={0}>
            {/* CSV/Excel Button */}
            <Button
              leftIcon={<FaDownload size="12px" />}
              bg={buttonGradientColor}
              color={useColorModeValue("black", "white")}
              _hover={{
                bg: useColorModeValue(
                  "linear-gradient(93.5deg, #8EABC5 , #C4D7E7 94.58%)",
                  "linear-gradient(93.5deg, #1F1F1F 0.56%, #010307 50.58%)"
                ),
              }}
              borderRadius={"12px"}
              size="sm"
              height={"34px"}
              fontSize={"12px"}
              onClick={handleCSVExport}
            >
              XLSX
            </Button>

            {/* PDF Button */}
            <Button
              leftIcon={<FaFilePdf size="12px" />} // Ensure FaFilePdf is imported from react-icons/fa
              bg={buttonGradientColor}
              color={useColorModeValue("black", "white")}
              _hover={{
                bg: useColorModeValue(
                  "linear-gradient(93.5deg, #8EABC5 , #C4D7E7 94.58%)",
                  "linear-gradient(93.5deg, #1F1F1F 0.56%, #010307 50.58%)"
                ),
              }}
              borderRadius={"12px"}
              size="sm"
              height={"34px"}
              fontSize={"12px"}
              onClick={handlePDFExport}
            >
              PDF
            </Button>
          </HStack>

          {/* 7. Download Button */}
          {/* <Button
            leftIcon={<FaDownload size="10px" />}
            bg={buttonGradientColor}
            color={useColorModeValue("black", "white")}
            _hover={{
              bg: useColorModeValue(
                "linear-gradient(93.5deg, #8EABC5 , #C4D7E7 94.58%)",
                "linear-gradient(93.5deg, #1F1F1F 0.56%, #010307 50.58%)"
              ),
            }}
            borderRadius={"12px"}
            size="sm"
            onClick={handleDownloadReport}
            w="auto"
            height={"34px"}
            fontSize={"12px"}
            flexShrink={0} // Prevents button from getting squashed
          >
            Download
          </Button> */}
        </Flex>

        <Flex
          fontSize="12px"
          fontWeight="bold"
          flexDirection={{ base: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ base: "flex-start", md: "center" }}
          gap={{ base: 3, md: 0 }}
          mb={2}
        >

          <Flex gap={3} flexWrap="wrap">
            <Text color="blue.400" whiteSpace="nowrap">● Total ({allFetchedCameras.length})</Text>
            <Text color="green.400" whiteSpace="nowrap">● Online ({allFetchedCameras.filter((c) => c.status).length})</Text>
            <Text color="red.400" whiteSpace="nowrap">● Offline ({allFetchedCameras.filter((c) => !c.status).length})</Text>
          </Flex>


          {!loading && displayedCameras.length > 0 && (
            <Flex >
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                isDisabled={currentPage === 1}
                mr={1}
                size="xs"
                variant="ghost"
                _hover={{ bg: "#9CBAD2" }}
                bg={buttonGradientColor}
                fontSize="12px"
              >
                Previous
              </Button>

              {(() => {
                const totalPages = Math.ceil(totalItemsAfterFilters / itemsPerPage);
                const pageNumbers = [];
                const delta = 1; // Number of pages to show around the current page

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
                    <Text key={`ellipsis-${idx}`} mx={2} alignSelf="center">
                      ...
                    </Text>
                  ) : (
                    <Button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      size="xs"
                      variant="ghost"
                      mx={0.5}
                      minW="24px"
                      fontSize="12px"
                      fontWeight={currentPage === page ? "bold" : "normal"}
                      textDecoration={currentPage === page ? "underline" : "none"}
                      _hover={{ bg: "#9CBAD2" }}
                      bg={currentPage === page ? "blue.200" : buttonGradientColor}
                    >
                      {page}
                    </Button>
                  )
                );
              })()}

              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                isDisabled={currentPage * itemsPerPage >= totalItemsAfterFilters}
                ml={1}
                size="xs"
                variant="ghost"
                _hover={{ bg: "#9CBAD2" }}
                bg={buttonGradientColor}
                fontSize="12px"
              >
                Next
              </Button>
            </Flex>
          )}
        </Flex>


        {loading ? (
          <Flex justifyContent="center" alignItems="center" height="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : (
          <>
            {/* --- Mobile Card View (iPhone SE Mode) --- */}
            <VStack
              display={{ base: "flex", md: "none" }}
              spacing={4}
              align="stretch"
              pb="100px" // <--- Add this line here
            >
              {displayedCameras.map((camera, index) => {
                const rowId = `${camera.DeviceId}-${index}`;
                return (
                  <Box key={rowId} borderRadius="lg" border="1px solid" borderColor="#b3b8d6ff" overflow="hidden" boxShadow="sm" bg={cardBg}>
                    <Box p={4}>
                      <Flex justify="space-between" align="center" mb={4}>
                        <Text fontWeight="bold" color="blue.600" fontSize="sm">{camera.district || "N/A"}</Text>
                        <IconButton
                          icon={<Image src={Frame} alt="frame" boxSize="1.2rem" />}
                          size="sm" variant="ghost" onClick={() => handleViewStream(camera)}
                          isDisabled={!camera.streamUrl}
                        />
                      </Flex>

                      <SimpleGrid columns={2} spacing={3} mb={4}>
                        <MobileMetricCell label="Assembly" value={camera.assembly} colorDot="blue.500" />
                        <MobileMetricCell label="Location" value={camera.location} colorDot="green.400" />
                        <MobileMetricCell label="Camera ID" value={camera.DeviceId} colorDot="purple.500" />
                        <MobileMetricCell label="Status" value={camera.status ? "Online" : "Offline"} colorDot={camera.status ? "green.400" : "red.400"} />
                      </SimpleGrid>

                      <Collapse in={expandedRows[rowId]}>
                        <Box p={4} borderTop="1px dashed" borderColor="#b3b8d6ff">
                          <VStack align="stretch" spacing={2}>
                            <HStack justify="space-between">
                              <Text fontSize="xs"
                                color={cardTextColor}
                              >Operator Name:
                              </Text>
                              <Text fontSize="xs" color={cardTextColor}>{camera.operatorName || "N/A"}</Text>
                            </HStack>
                            <HStack justify="space-between">
                              <Text fontSize="xs" color={cardTextColor}>Contact:</Text>
                              <Text fontSize="xs" color={cardTextColor}>{camera.operatorMobile || "N/A"}</Text>
                            </HStack>
                          </VStack>
                        </Box>
                      </Collapse>
                      <Button
                        w="full" size="xs" variant="outline" colorScheme="blue" borderRadius="lg"
                        onClick={() => toggleMoreInfo(rowId)}
                        rightIcon={expandedRows[rowId] ? <FaChevronUp /> : <FaChevronDown />}
                      // color={overlayBg}
                      >
                        More Info
                      </Button>
                    </Box>

                  </Box>
                );
              })}
              {displayedCameras.length === 0 && <Center p={10}>No Records found.</Center>}
            </VStack>

            {/* --- Existing Desktop Table View (Untouched) --- */}
            <div style={tableContainerStyle} className="desktop-table">
              <Box display={{ base: "none", md: "block" }}>
                <Table variant="simple" size="sm" borderRadius="15">
                  <Thead>
                    <Tr style={tableHeaderRowStyle} bg={buttonGradientColor}>
                      <Th style={tableHeaderStyle}>Sr No.<VerticalLine /></Th>
                      <Th style={tableHeaderStyle}>District<VerticalLine /></Th>
                      <Th style={tableHeaderStyle}>Assembly<VerticalLine /></Th>
                      <Th style={tableHeaderStyle}>Location<VerticalLine /></Th>
                      <Th style={tableHeaderStyle}>Operator Name<VerticalLine /></Th>
                      <Th style={tableHeaderStyle}>Operator Mobile No.<VerticalLine /></Th>
                      <Th style={tableHeaderStyle}>Device Id<VerticalLine /></Th>
                      <Th style={tableHeaderStyle}>Status<VerticalLine /></Th>
                      <Th style={tableHeaderStyle}>Preview</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {displayedCameras.length > 0 ? (
                      displayedCameras.map((camera, index) => (
                        <Tr key={`${camera.DeviceId}-${index}`}>
                          <Td style={tableDataStyle}>{(currentPage - 1) * itemsPerPage + index + 1}<VerticalLine /></Td>
                          <Td style={tableDataStyle}>{camera.district || "N/A"}<VerticalLine /></Td>
                          <Td style={tableDataStyle}>{camera.assembly || "N/A"}<VerticalLine /></Td>
                          <Td style={tableDataStyle} title={camera.location || "N/A"}>{camera.location || "N/A"}<VerticalLine /></Td>
                          <Td style={tableDataStyle}>{camera.operatorName || "N/A"}<VerticalLine /></Td>
                          <Td style={tableDataStyle}>{camera.operatorMobile || "N/A"}<VerticalLine /></Td>
                          <Td style={tableDataStyle}>{camera.DeviceId || "N/A"}<VerticalLine /></Td>
                          <Td style={tableDataStyle} color={camera.status ? "green.400" : "red.400"}>{camera.status ? "⬤" : "⬤"}<VerticalLine /></Td>
                          <Td style={tableDataStyle}>
                            <IconButton icon={<Image src={Frame} alt="frame" boxSize="1.5rem" />} size="sm" aria-label="View Live Stream" colorScheme="teal" variant="ghost" onClick={() => handleViewStream(camera)} isDisabled={!camera.streamUrl} />
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr><Td colSpan="9" textAlign="center" style={tableDataStyle} p={5}>No Records found.</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
            </div>
          </>
        )}
      </ChakraBox>

      {/* Modal JSX remains unchanged */}
      <Modal
        isOpen={isStreamModalOpen}
        onClose={handleCloseModal}
        size="4xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent bg="white" color="Black" borderRadius="lg"> {/* Themed Modal */}
          <ModalHeader>
            <Flex justifyContent="space-between" alignItems="center">
              <Text>Live Stream: {selectedCamera?.DeviceId}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
        <ModalBody>
  {isStreamModalOpen && selectedCamera && (
    <Flex direction={{ base: "column", lg: "row" }} gap={4} alignItems="flex-start">
      
      {/* Video Container with Overlay */}
      <Box flex="1" width="100%" position="relative" borderRadius="8px" overflow="hidden">
        
        {/* Player Section */}
        {selectedCamera.DeviceId && selectedCamera.DeviceId.startsWith("SSAN") ? (
          <SimpleFLVPlayer
            url={selectedCamera.streamUrl}
            muted={isMuted}
            style={{ width: "100%", height: "450px", borderRadius: "8px" }}
          />
        ) : (
          <Player
            ref={playerRef}
            device={selectedCamera}
            initialPlayUrl={selectedCamera.streamUrl}
            muted={isMuted}
            style={{ width: "100%", height: "450px", borderRadius: "8px" }}
            showControls={false}
          />
        )}

        {/* Mute Toggle Overlay (Multiscreen Style) */}
        <IconButton
          position="absolute"
          bottom="20px"
          right="20px"
          zIndex="20"
          variant="solid"
          size="md"
          bg="rgba(0,0,0,0.6)"
          _hover={{ bg: "black" }}
          color="white"
          borderRadius="full"
          icon={isMuted ? <BsVolumeMute fontSize="22px" /> : <BsVolumeUp fontSize="22px" />}
          onClick={() => setIsMuted(!isMuted)}
          aria-label="Toggle Mute"
        />
        
        {/* Info Overlay (Multiscreen Style) */}
        <Box 
          position="absolute" 
          bottom="0" 
          left="0" 
          right="0" 
          bg="rgba(0, 0, 0, 0.5)" 
          p={2} 
          zIndex="10"
        >
          <Text color="white" fontSize="13px" fontWeight="500">
            {selectedCamera.district} / {selectedCamera.assembly} / {selectedCamera.DeviceId}
          </Text>
        </Box>
      </Box>

      {/* PTZ Controls Side Panel */}
      <Box 
        minW="200px" 
        p={4} 
        borderRadius="md" 
        bg={("gray.50")} 
        display="flex" 
        flexDirection="column" 
        alignItems="center"
      >
        <Text fontWeight="bold" mb={4}>PTZ Controls</Text>
        <CameraPTZ
          deviceId={selectedCamera.DeviceId}
          onZoomIn={() => playerRef.current?.zoomIn()}
          onZoomOut={() => playerRef.current?.zoomOut()}
          onFullscreen={() => playerRef.current?.handleFullscreen()}
          position="static"
          transform="none"
          marginTop="20px"
        />
      </Box>
    </Flex>
  )}
</ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseModal}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Camera Settings Modal */}
      {selectedCamera && (
        <CameraSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          deviceId={selectedCamera.DeviceId}
          cameraName={selectedCamera.name}
          productType={selectedCamera.productType}
        />
      )}
    </div>
  );
};

export default Boxes;
