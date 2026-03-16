import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
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
  
  // border, // This was likely a typo, removed
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import * as XLSX from "xlsx";
import { FaDownload, FaFilePdf } from "react-icons/fa";
import Player from "../components/Player";
import { Link as RouterLink, useLocation } from "react-router-dom"; // Import useLocation
import { MdGridView } from "react-icons/md";
import { TfiLayoutListThumb } from "react-icons/tfi";
import Frame from "../assets/Frame.png";

// --- API Fetching Function (Unchanged) ---
const getYourCamerasAPI = async (userEmail) => {
  const API_URL = `${process.env.REACT_APP_URL}/api/camera/getcurrentUserCameras`;

  const generateStreamUrl = (camera) => {
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
          Status: camera.status, // Boolean status, true for online
          last_checked:
            camera.last_checked ||
            camera.lastSeen ||
            camera.updatedAt ||
            new Date().toISOString(),
          user_email: userEmail,
          name: camera.name,
          streamUrl: generateStreamUrl(camera),
          ...camera,
          location_Type: camera.location_Type || "N/A",
          // Assuming 'is_live' comes directly from the API or can be derived from 'Status'
          is_live: camera.is_live, // Use camera.status for is_live
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

// --- Helper Styles (These will be largely replaced by Chakra props) ---
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
  borderRadius: "5px",
};

const tableHeaderStyle = {
  padding: "8px 10px", // Match padding with Td for consistency
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
      height: "60%", // Make the line almost as tall as the cell
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
  const [selectedStatus, setSelectedStatus] = useState("all"); // Default to 'all' for clarity
  const {
    isOpen: isStreamModalOpen,
    onOpen: onStreamModalOpen,
    onClose: onStreamModalClose,
  } = useDisclosure();
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [selectedLocationType, setSelectedLocationType] = useState("all");
  const [psOption, setPsOption] = useState("camera");
  const [reportFormat, setReportFormat] = useState("csv"); // Currently only CSV is implemented
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setCurrentPage(1);
  };
  const handleStartTimeChange = (event) => {
    setStartTime(event.target.value);
    setCurrentPage(1);
  };
  const handleEndTimeChange = (event) => {
    setEndTime(event.target.value);
    setCurrentPage(1);
  };

  const location = useLocation(); // To determine current view (grid/list)

  // Use Chakra's useColorMode hook to get current mode for dynamic icon src
  const { colorMode } = useColorMode();

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) setUserEmail(email);
  }, []);

  const fetchAllUserCameras = useCallback(async () => {
    if (!userEmail) {
      setAllFetchedCameras([]);
      return;
    }
    setLoading(true);
    try {
      const response = await getYourCamerasAPI(userEmail);
      setAllFetchedCameras(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error(
        "Error fetching cameras:",
        err.response ? err.response.data : err.message
      );
      setAllFetchedCameras([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    fetchAllUserCameras();
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
      data = data.filter((c) => c.is_live === true);
    }
    if (selectedDistrictName) {
      data = data.filter((c) => c.district === selectedDistrictName);
    }
    if (selectedAssemblyValue) {
      data = data.filter((c) => c.assembly === selectedAssemblyValue);
    }

    // --- NEW / MODIFIED STATUS FILTER LOGIC ---
    if (selectedStatus !== "all") {
      // Parse selected date and time for comparison
      const filterMomentStart = selectedDate
        ? moment(`${selectedDate}T${startTime}`)
        : null;
      const filterMomentEnd = selectedDate
        ? moment(`${selectedDate}T${endTime}`)
        : null;

      data = data.filter((c) => {
        const lastCheckedMoment = moment(c.last_checked);
        const isValidDate = lastCheckedMoment.isValid();
        const isDefaultDate = lastCheckedMoment.isSame(
          "1900-01-01T00:00:00.000Z"
        ); // Check for the placeholder date

        if (!isValidDate || isDefaultDate) {
          // Cameras with invalid or default 'last_checked' are treated as disconnected for date-wise checks
          return selectedStatus === "disconnected";
        }

        switch (selectedStatus) {
          case "allconnected":
            // Filter for all connected cameras (status === true)
            return c.is_live === true;
          case "Date Wise Connected":
            // Filter for connected cameras within the selected date/time range
            if (filterMomentStart && filterMomentEnd) {
              return (
                c.is_live === true &&
                lastCheckedMoment.isBetween(
                  filterMomentStart,
                  filterMomentEnd,
                  null,
                  "[]"
                )
              ); // [] means inclusive
            }
            return false; // If no date is selected for "Date Wise Connected", return false
          case "disconnected":
            // Filter for disconnected cameras
            return c.is_live === false;
          default:
            return true; // Should not reach here if selectedStatus is "all" or specific values are handled
        }
      });
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
    selectedDate, // ADDED: Dependency
    startTime, // ADDED: Dependency
    endTime, // ADDED: Dependency
  ]);

  const createPageResetHandler = (setter) => (e) => {
    setter(e.target.value);
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
    setSelectedStatus("all"); // Reset status to "all"
    setSearchDeviceId("");
    setPsOption("camera"); // Reset to default radio option
    setSelectedDate(""); // Clear date
    setStartTime("00:00"); // Reset time
    setEndTime("23:59"); // Reset time
    setCurrentPage(1);
  };

  const getFilteredDataForExportAndCount = () => {
    let data = [...allFetchedCameras];
    if (selectedDistrictName)
      data = data.filter((c) => c.district === selectedDistrictName);
    if (selectedAssemblyValue)
      data = data.filter((c) => c.assembly === selectedAssemblyValue);

    // --- NEW / MODIFIED STATUS FILTER LOGIC FOR EXPORT ---
    if (selectedStatus !== "all") {
      const filterMomentStart = selectedDate
        ? moment(`${selectedDate}T${startTime}`)
        : null;
      const filterMomentEnd = selectedDate
        ? moment(`${selectedDate}T${endTime}`)
        : null;

      data = data.filter((c) => {
        const lastCheckedMoment = moment(c.last_checked);
        const isValidDate = lastCheckedMoment.isValid();
        const isDefaultDate = lastCheckedMoment.isSame(
          "1900-01-01T00:00:00.000Z"
        );

        if (!isValidDate || isDefaultDate) {
          return selectedStatus === "disconnected";
        }

        switch (selectedStatus) {
          case "allconnected":
            return c.is_live === true;
          case "Date Wise Connected":
            if (filterMomentStart && filterMomentEnd) {
              return (
                c.is_live === true &&
                lastCheckedMoment.isBetween(
                  filterMomentStart,
                  filterMomentEnd,
                  null,
                  "[]"
                )
              );
            }
            return false;
          case "disconnected":
            return c.is_live === false;
          default:
            return true;
        }
      });
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
      if (["indoor", "outdoor", "auxiliary"].includes(selectedLocationType))
        data = data.filter((c) => c.location_Type === selectedLocationType);
    }
    return data;
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setCurrentPage(1);
  };

  // MODIFIED: Pagination count logic
  const totalItemsAfterFilters = (() => {
    let data = [...allFetchedCameras];

    if (camerasTab === "Live Cameras") {
      data = data.filter((c) => c.is_live === true);
    }
    if (selectedDistrictName) {
      data = data.filter((c) => c.district === selectedDistrictName);
    }
    if (selectedAssemblyValue) {
      data = data.filter((c) => c.assembly === selectedAssemblyValue);
    }

    // --- NEW / MODIFIED STATUS FILTER LOGIC FOR TOTAL COUNT ---
    if (selectedStatus !== "all") {
      const filterMomentStart = selectedDate
        ? moment(`${selectedDate}T${startTime}`)
        : null;
      const filterMomentEnd = selectedDate
        ? moment(`${selectedDate}T${endTime}`)
        : null;

      data = data.filter((c) => {
        const lastCheckedMoment = moment(c.last_checked);
        const isValidDate = lastCheckedMoment.isValid();
        const isDefaultDate = lastCheckedMoment.isSame(
          "1900-01-01T00:00:00.000Z"
        );

        if (!isValidDate || isDefaultDate) {
          return selectedStatus === "disconnected";
        }

        switch (selectedStatus) {
          case "allconnected":
            return c.is_live === true;
          case "Date Wise Connected":
            if (filterMomentStart && filterMomentEnd) {
              return (
                c.is_live === true &&
                lastCheckedMoment.isBetween(
                  filterMomentStart,
                  filterMomentEnd,
                  null,
                  "[]"
                )
              );
            }
            return false;
          case "disconnected":
            return c.is_live === false;
          default:
            return true;
        }
      });
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

    if (selectedLocationType === "all") {
      // no filter
    } else {
      data = data.filter((c) => c.location_Type === selectedLocationType);
    }

    return data.length;
  })();

  // --- New Theme Variables ---
  const buttonGradientColor = useColorModeValue(
    "linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)", // light mode
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

const handleCSVExport = useCallback(() => {
  const dataToExport = getFilteredDataForExportAndCount().map((camera) => ({
    "Device Id": camera.DeviceId,
    District: camera.district,
    Assembly: camera.assembly,
    "Location": camera.location,
    Status: camera.Status ? "online" : "offline",
    "Last Checked": moment(camera.last_checked).isValid()
      ? moment(camera.last_checked).local().format("YYYY-MM-DD HH:mm:ss")
      : "N/A",
  }));

  if (dataToExport.length === 0) {
    alert("No data to export.");
    return;
  }

  // --- DYNAMIC FILENAME LOGIC ---
  let fileName = "Connected_Once_Report";
  if (selectedDistrictName) {
    fileName += `_${selectedDistrictName}`;
  }
  if (selectedAssemblyValue) {
    fileName += `_${selectedAssemblyValue}`;
  }
  fileName += ".xlsx";
  // ------------------------------

  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Camera Data");
  XLSX.writeFile(wb, fileName); 
}, [getFilteredDataForExportAndCount, selectedDistrictName, selectedAssemblyValue]); // Added dependencies

 const handlePDFExport = useCallback(() => {
  const data = getFilteredDataForExportAndCount();

  if (!data || data.length === 0) {
    alert("No data to export.");
    return;
  }

  // --- DYNAMIC FILENAME LOGIC ---
  let fileName = "Connected_Once_Report";
  if (selectedDistrictName) {
    fileName += `_${selectedDistrictName}`;
  }
  if (selectedAssemblyValue) {
    fileName += `_${selectedAssemblyValue}`;
  }
  fileName += ".pdf";
  // ------------------------------

  const pdf = new jsPDF("l", "mm", "a4");
  pdf.setFontSize(14);
  pdf.text("Connected Once Report", 14, 15);

  const tableBody = data.map((camera) => [
    camera.DeviceId,
    camera.district,
    camera.assembly,
    camera.location,
    camera.Status ? "online" : "offline",
    moment(camera.last_checked).isValid()
      ? moment(camera.last_checked).local().format("YYYY-MM-DD HH:mm:ss")
      : "N/A",
  ]);

  autoTable(pdf, {
    startY: 22,
    head: [["Device Id", "District", "Assembly", "Location", "Status", "Last Checked"]],
    body: tableBody,
    // ... rest of your styles
  });

  pdf.save(fileName);
}, [getFilteredDataForExportAndCount, selectedDistrictName, selectedAssemblyValue]); // Added dependencies

 const textColor = useColorModeValue('gray.500', 'gray.400');

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
       
          <Text fontWeight={400} fontSize="26px" color={textColor}>
           Connected Once Report
          </Text>
          

         
        {/* Filter Row */}
      <Grid
  templateColumns={{
    base: "1fr",
    md: "repeat(3, 1fr)",
    lg: "repeat(7, 1fr)",
  }}
  gap={4}
  alignItems="center"

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
    value={selectedAssemblyValue}
    onChange={handleAssemblyChange}
    isDisabled={!selectedDistrictName || assembliesList.length === 0}
    color={useColorModeValue("black", "white")}
    sx={{ "> option": { bg: useColorModeValue("white", "gray.700"), color: useColorModeValue("black", "white") } }}
  >
    {assembliesList.map(a => <option key={a} value={a}>{a}</option>)}
  </Select>

 



  {/* PS / Camera Radio (UI kept, normalized) */}
  

  {/* Search */}
  <Input
    placeholder={psOption === "ps" ? "Search PS Number" : "Search Camera ID"}
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

  {/* Status */}
  <Select
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    value={selectedStatus}
    onChange={handleStatusChange}
    color={useColorModeValue("black", "white")}
  >
    <option value="all">All</option>
    <option value="allconnected">All Connected</option>
    <option value="Date Wise Connected">Date Wise Connected</option>
    <option value="disconnected">Disconnected</option>
  </Select>
  {/* Clear Filter */}
  <ChakraLink
    fontSize="12px"
    textDecoration="underline"
    onClick={handleClearFilters}
    color={useColorModeValue("black", "white")}
  >
    CLEAR FILTER
  </ChakraLink>

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
  {/* Date */}
  <Input
    type="date"
    value={selectedDate}
    onChange={handleDateChange}
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    color={useColorModeValue("black", "white")}
  />

  {/* From Time */}
  <Input
    type="time"
    value={startTime}
    onChange={handleStartTimeChange}
    isDisabled={!selectedDate}
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    color={useColorModeValue("black", "white")}
  />

  {/* To Time */}
  <Input
    type="time"
    value={endTime}
    onChange={handleEndTimeChange}
    isDisabled={!selectedDate}
    bg={buttonGradientColor}
    borderRadius="12px"
    height="34px"
    fontSize="12px"
    color={useColorModeValue("black", "white")}
  />

  {/* Download */}
 {/* <HStack
   spacing={2}
   gridColumn={{ base: "span 1", md: "span 3", lg: "span 1" }}
 >

 </HStack> */}
</Grid>


        {loading ? (
          <Flex justifyContent="center" alignItems="center" height="200px">
            <Spinner size="xl" color="blue.500" />
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
                    <Th style={tableHeaderStyle}>
                      Sr No.<VerticalLine />
                    </Th>
                    <Th style={tableHeaderStyle}>
                      District<VerticalLine />
                    </Th>
                    <Th style={tableHeaderStyle}>
                      Assembly<VerticalLine />
                    </Th>
                    <Th style={tableHeaderStyle}>
                      Device Id<VerticalLine />
                    </Th>
                    {/* <Th style={tableHeaderStyle}>
      PS ID<VerticalLine />
    </Th> */}
                    <Th style={tableHeaderStyle}>
                     Location<VerticalLine />
                    </Th>
                    {/* <Th style={tableHeaderStyle}>
      Location Type<VerticalLine />
    </Th> */}
                    <Th style={tableHeaderStyle}>
                      Status<VerticalLine />
                    </Th>
                    <Th style={tableHeaderStyle}>
                      last connected
                      {/* No vertical line after the last header column */}
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {displayedCameras.length > 0 ? (
                    displayedCameras.map((camera, index) => (
                      <Tr key={`${camera.DeviceId}-${index}`}>
                        <Td style={tableDataStyle}>
                          {(currentPage - 1) * itemsPerPage + index + 1}
                          <VerticalLine /> {/* Keep VerticalLine inside Td */}
                        </Td>
                        <Td style={tableDataStyle}>
                          {camera.district || "N/A"}
                          <VerticalLine />
                        </Td>
                        <Td style={tableDataStyle}>
                          {camera.assembly || "N/A"}
                          <VerticalLine />
                        </Td>
                        <Td style={tableDataStyle}>
                          {camera.DeviceId || "N/A"}
                          <VerticalLine />
                        </Td>
                        {/* <Td style={tableDataStyle}>
          {camera.ps_id || "N/A"}
          <VerticalLine />
        </Td> */}
                        <Td style={tableDataStyle} title={camera.location || "N/A"}>
                          {camera.location || "N/A"}
                          <VerticalLine />
                        </Td>
                        {/* <Td style={tableDataStyle}>
          {camera.location_Type}
          <VerticalLine />
        </Td> */}
                        <Td style={tableDataStyle} color={camera.is_live ? 'green.600' : 'red.600'}>
                          {camera.is_live ? 'Connected' : 'Not Connected'}
                          <VerticalLine />
                        </Td>
                        <Td style={tableDataStyle}>
                          {camera.last_checked && moment(camera.last_checked).isValid() && !moment(camera.last_checked).isSame('1900-01-01T00:00:00.000Z')
                            ? moment(camera.last_checked).local().format('YYYY-MM-DD HH:mm:ss')
                            : 'N/A'}
                        </Td>

                      </Tr>
                    ))
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
        
          {totalItemsAfterFilters > 0 && (
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
                 
                     {/* Dynamic Page Numbers */}
                     {(() => {
                       const totalPages = Math.ceil(totalItemsAfterFilters / itemsPerPage);
                       const pageNumbers = [];
                       const delta = 1; // How many numbers to show around current page
                 
                       for (let i = 1; i <= totalPages; i++) {
                         if (
                           i === 1 || // Always show first
                           i === totalPages || // Always show last
                           (i >= currentPage - delta && i <= currentPage + delta) // Range around current
                         ) {
                           pageNumbers.push(i);
                         } else if (
                           (i === currentPage - delta - 1 && i > 1) ||
                           (i === currentPage + delta + 1 && i < totalPages)
                         ) {
                           // Add Ellipsis only once for gaps
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
                       isDisabled={currentPage * itemsPerPage >= totalItemsAfterFilters}
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

      {/* Modal JSX is now much simpler */}
      <Modal
        isOpen={isStreamModalOpen}
        onClose={handleCloseModal}
        size="4xl"
        isCentered
      >
        <ModalOverlay />
        <ModalContent bg="white" color="Black" borderRadius="lg"> {/* Themed Modal */}
          <ModalHeader>Live Stream: {selectedCamera?.DeviceId}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* The Player component is only rendered when the modal is open and a camera is selected */}
            {isStreamModalOpen && selectedCamera && (
              <Player
                device={selectedCamera}
                initialPlayUrl={selectedCamera.streamUrl}
                style={{ width: "100%", height: "450px" }}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseModal}> {/* Themed Button */}
              Close
            </Button>
          </ModalFooter>
          
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Boxes;
