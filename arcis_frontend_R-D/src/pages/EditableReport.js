import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  useToast,
  Grid,
  RadioGroup,
  Radio,
  Box,
  Link as ChakraLink,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";

// --- API Functions (Unchanged) ---
const getYourCamerasAPI = async (userEmail) => {
  const API_URL = `${process.env.REACT_APP_URL}/api/camera/getCurrentUserCameras1?email=${userEmail}`;
  try {
    const response = await axios.post(API_URL, { email: userEmail });
    if (response.data && response.data.userCameras) {
      const mappedCameras = response.data.userCameras.map((camera) => {
        let locationString = "N/A";
        if (camera.locations && camera.locations.length > 0) {
          const firstLocation = camera.locations[0];
          if (typeof firstLocation === "string") {
            locationString = firstLocation;
          } else if (
            firstLocation &&
            typeof firstLocation === "object" &&
            firstLocation.loc_name
          ) {
            locationString = firstLocation.loc_name;
          }
        }
        return {
          DeviceId: camera.deviceId,
          district: camera.dist_name,
          assembly: camera.accName,
          //ps_id: camera.ps_id,
          location: locationString,
          is_live: camera.is_live,
          last_checked:
            camera.last_checked ||
            camera.lastSeen ||
            camera.updatedAt ||
            new Date().toISOString(),
          user_email: userEmail,
          name: camera.name,
          location_Type: camera.location_Type || "indoor",
           operatorName: camera.operatorName,
          operatorMobile: camera.operatorMobile,
        };
      });
      return {
        userCameras: mappedCameras,
        allDeviceIds: response.data.allDeviceIds || [],
      };
    }
    return { userCameras: [], allDeviceIds: [] };
  } catch (error) {
    console.error(
      "Error fetching cameras from backend API:",
      error.response ? error.response.data : error.message
    );
    if (error.response && error.response.status === 404) {
      return { userCameras: [], allDeviceIds: [] };
    }
    throw error;
  }
};

const getAllRegionsAPI = async () => {
  const API_URL = `${process.env.REACT_APP_URL}/api/camera/getAllRegions`;
  try {
    const response = await axios.get(API_URL);
    return response.data && Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching all region data:", error.message);
    return [];
  }
};

// --- Styles ---
const tableHeaderRowStyle = {
  position: "sticky",
  top: 0,
  zIndex: 1,
  borderRadius: "5px",
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
  padding: "8px 10px",
  verticalAlign: "middle",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  position: "relative",
  borderBottom: "1px solid #6c8aa5ff",
};

const tableContainerStyle = {
  border: "1px solid #b3b8d6ff",
  borderRadius: "5px",
  maxHeight: "calc(180vh - 500px)",
  overflowY: "auto",
  overflowX: "auto"
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

const Boxes = () => {
  const [allFetchedCameras, setAllFetchedCameras] = useState([]);
  const [displayedCameras, setDisplayedCameras] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [loading, setLoading] = useState(true);
  const [allRegionData, setAllRegionData] = useState([]);
  const [allValidDeviceIds, setAllValidDeviceIds] = useState([]);
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedAssemblyValue, setSelectedAssemblyValue] = useState("");
  const [selectedLocationType, setSelectedLocationType] = useState("all");
  const { isOpen: isModalOpen, onOpen, onClose } = useDisclosure();
  const [editingCamera, setEditingCamera] = useState(null);
  const [modalMode, setModalMode] = useState("edit");
  const [isSaving, setIsSaving] = useState(false);
  const [psOption, setPsOption] = useState("ps"); // Default to PS Number to match image
  const [searchOption, setSearchOption] = useState("vehicle"); // replaced psOption
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDeviceId, setSearchDeviceId] = useState("");
  const [deviceIdSuggestions, setDeviceIdSuggestions] = useState([]);
const [showSuggestions, setShowSuggestions] = useState(false);
  const toast = useToast();

  const districtsList = useMemo(
    () => allRegionData.map((region) => region.district),
    [allRegionData]
  );
  const assembliesList = useMemo(() => {
    if (!selectedDistrictName) return [];
    const region = allRegionData.find(
      (r) => r.district === selectedDistrictName
    );
    return region ? region.assemblies : [];
  }, [allRegionData, selectedDistrictName]);
  const modalAssembliesList = useMemo(() => {
    if (!editingCamera?.district) return [];
    const region = allRegionData.find(
      (r) => r.district === editingCamera.district
    );
    return region ? region.assemblies : [];
  }, [allRegionData, editingCamera?.district]);

  const fetchAllData = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const [regions, cameraData] = await Promise.all([
        getAllRegionsAPI(),
        getYourCamerasAPI(userEmail),
      ]);
      setAllRegionData(regions);
      setAllFetchedCameras(cameraData.userCameras || []);
      setAllValidDeviceIds(cameraData.allDeviceIds || []);
    } catch (err) {
      toast({
        title: "Data Fetch Error",
        description: "Could not load data from the server.",
        status: "error",
      });
      setAllRegionData([]);
      setAllFetchedCameras([]);
      setAllValidDeviceIds([]);
    } finally {
      setLoading(false);
    }
  }, [userEmail, toast]);

  useEffect(() => {
    const emailFromStorage = localStorage.getItem("email");
    if (emailFromStorage) {
      setUserEmail(emailFromStorage);
    } else {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    let filteredData = [...allFetchedCameras];

    // District Filter
    if (selectedDistrictName)
      filteredData = filteredData.filter(
        (c) => c.district === selectedDistrictName
      );

    // Assembly Filter
    if (selectedAssemblyValue)
      filteredData = filteredData.filter(
        (c) => c.assembly === selectedAssemblyValue
      );

    // Location Type Filter
    if (selectedLocationType !== "all")
      filteredData = filteredData.filter(
        (c) => c.location_Type === selectedLocationType
      );

    // --- SEARCH LOGIC ---
 // Change state name for clarity


// Inside the filtering useEffect:
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    filteredData = filteredData.filter((c) => {
      if (searchOption === "vehicle") {
        // Search by Vehicle No (location field)
        return c.location && String(c.location).toLowerCase().includes(lowerQuery);
      } else {
        // Search by Device ID
        return c.DeviceId && c.DeviceId.toLowerCase().includes(lowerQuery);
      }
    });
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  setDisplayedCameras(filteredData.slice(indexOfFirstItem, indexOfLastItem));
}, [allFetchedCameras, searchQuery, searchOption, currentPage, itemsPerPage, selectedDistrictName, selectedAssemblyValue]);
  const handleDelete = async (deviceId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_URL}/api/camera/delete/${deviceId}`
        );

        Swal.fire(
          'Deleted!',
          `Camera ${deviceId} has been deleted.`,
          'success'
        );

        fetchAllData();
      } catch (error) {
        Swal.fire(
          'Error!',
          error.response?.data?.message || "Could not delete camera.",
          'error'
        );
      }
    }
  };

const handleSave = async () => {
  if (!editingCamera) return;

  // 1. Validations (Unchanged)
  if (
    !editingCamera.DeviceId ||
    !editingCamera.district ||
    !editingCamera.assembly ||
    !editingCamera.location
  ) {
    toast({
      title: "Validation Error",
      description: "Required fields (District, Assembly, Vehicle No, Device ID) are missing.",
      status: "warning",
    });
    return;
  }

  if (modalMode === "add") {
    if (!allValidDeviceIds.includes(editingCamera.DeviceId)) {
      toast({
        title: "Invalid Device ID",
        description: "This Device ID does not exist in the stream table.",
        status: "error",
      });
      return;
    }
    if (allFetchedCameras.some((c) => c.DeviceId.toLowerCase() === editingCamera.DeviceId.toLowerCase())) {
      toast({
        title: "Duplicate Assignment",
        description: "This Device ID is already assigned.",
        status: "error",
      });
      return;
    }
  }

  // --- LOGIC CHANGE STARTS HERE ---

  // Find the record that we are CURRENTLY editing (using the ID it had when we clicked 'Edit')
  // Note: Ensure you set editingCamera.originalDeviceId when opening the modal
  const originalRecord = allFetchedCameras.find((c) => c.DeviceId === (editingCamera.originalDeviceId || editingCamera.DeviceId));

  // CONFLICT: Look for a duplicate DeviceId ONLY. Ignore location (Vehicle No).
  // This triggers ONLY if the DeviceId you typed belongs to someone else.
  const conflictingCamera = allFetchedCameras.find(
    (c) =>
      c.DeviceId.toLowerCase() === editingCamera.DeviceId.toLowerCase() &&
      c.DeviceId.toLowerCase() !== editingCamera.originalDeviceId?.toLowerCase()
  );

  // 2. Conflict Handling (Hardware Swap)
  if (conflictingCamera) {
    const userAgreesToSwap = await Swal.fire({
      title: 'Device Already Assigned!',
      text: `camera_id ${editingCamera.DeviceId} is already assigned to district- ${originalRecord.district},assembly-${originalRecord.assembly}, Vehicle No.-${originalRecord.location}. Do you want to SWAP them?,`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, swap IDs!'
    });

    if (userAgreesToSwap.isConfirmed) {
      setIsSaving(true);
      try {
        // PAYLOAD 1: The current Vehicle (A) takes the new Device (B)
        const updatePayload1 = {
          deviceId: editingCamera.DeviceId,
          district: editingCamera.district,
          assembly: editingCamera.assembly,
          location: editingCamera.location || "N/A",
          location_Type: editingCamera.location_Type,
          operatorName: editingCamera.operatorName || "N/A",
          operatorMobile: editingCamera.operatorMobile || "N/A"
        };

        // PAYLOAD 2: The other Vehicle (B) takes the OLD Device (A)
        const updatePayload2 = {
          deviceId: originalRecord.DeviceId, // The ID we just "kicked out"
          district: conflictingCamera.district,
          assembly: conflictingCamera.assembly,
          location: conflictingCamera.location, // Vehicle B keeps its own name
          location_Type: conflictingCamera.location_Type,
          operatorName: conflictingCamera.operatorName || "N/A",
          operatorMobile: conflictingCamera.operatorMobile || "N/A"
        };

        await Promise.all([
          axios.put(`${process.env.REACT_APP_URL}/api/camera/update/${updatePayload1.deviceId}`, updatePayload1),
          axios.put(`${process.env.REACT_APP_URL}/api/camera/update/${updatePayload2.deviceId}`, updatePayload2),
        ]);

        onClose();
        Swal.fire('Swapped!', 'Device IDs have been swapped .', 'success');
        fetchAllData();
      } catch (error) {
        toast({ title: "Swap Failed", description: error.message, status: "error" });
      } finally {
        setIsSaving(false);
      }
    }
    return;
  }

  // 3. Standard Save (Runs if Device ID is unique, even if Vehicle No changed)
  const saveResult = await Swal.fire({
    title: 'Are you sure?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, save it!'
  });

  if (saveResult.isConfirmed) {
    setIsSaving(true);
    try {
      await axios.put(
        `${process.env.REACT_APP_URL}/api/camera/update/${editingCamera.DeviceId}`,
        {
          deviceId: editingCamera.DeviceId,
          district: editingCamera.district,
          assembly: editingCamera.assembly,
          location: editingCamera.location || "N/A",
          location_Type: editingCamera.location_Type,
          operatorName: editingCamera.operatorName || "N/A",
          operatorMobile: editingCamera.operatorMobile || "N/A"
        }
      );

      onClose();
      Swal.fire('Saved!', 'Details saved successfully.', 'success');
      fetchAllData();
    } catch (error) {
      toast({
        title: "API Error",
        description: `Could not save: ${error.response?.data?.message || error.message}`,
        status: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }
};

 const handleOpenEditModal = (camera) => {
  setModalMode("edit");
  setEditingCamera({
    ...camera,
    originalDeviceId: camera.DeviceId // Add this line to bookmark the ID
  });
  onOpen();
};
 const handleOpenAddModal = () => {
  setModalMode("add");
  setEditingCamera({
    DeviceId: "",
    district: "",
    assembly: "",
    location: "",
    location_Type: "indoor",
    operatorName: "",   // Initialized
    operatorMobile: "", // Initialized
  });
  onOpen();
};
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingCamera((prev) => ({ ...prev, [name]: value }));
  };
  const handleDeviceIdChange = (e) => {
  const value = e.target.value;
  
  // Update the editingCamera state
  setEditingCamera(prev => ({ ...prev, DeviceId: value }));

  if (value.length > 0) {
    // 1. Filter IDs that start with or include the typed text
    // 2. Optional: Filter out IDs already assigned (if in "Add" mode)
    const filtered = allValidDeviceIds.filter(id => 
      id.toLowerCase().includes(value.toLowerCase()) &&
      (modalMode === "edit" || !allFetchedCameras.some(cam => cam.DeviceId === id))
    ).slice(0, 10); // Limit to 10 suggestions for performance

    setDeviceIdSuggestions(filtered);
    setShowSuggestions(true);
  } else {
    setDeviceIdSuggestions([]);
    setShowSuggestions(false);
  }
};

const handleSelectSuggestion = (id) => {
  setEditingCamera(prev => ({ ...prev, DeviceId: id }));
  setDeviceIdSuggestions([]);
  setShowSuggestions(false);
};
  const handleModalDistrictChange = (e) => {
    const newDistrict = e.target.value;
    setEditingCamera((prev) => ({
      ...prev,
      district: newDistrict,
      assembly: "",
    }));
  };
  const handleDistrictChange = (e) => {
    setSelectedDistrictName(e.target.value);
    setSelectedAssemblyValue("");
    setCurrentPage(1);
  };
  const handleAssemblyChange = (e) => {
    setSelectedAssemblyValue(e.target.value);
    setCurrentPage(1);
  };
  const handleLocationTypeChange = (e) => {
    setSelectedLocationType(e.target.value);
    setCurrentPage(1);
  };
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const handleClearFilters = () => {
    setSelectedDistrictName("");
    setSelectedAssemblyValue("");
    setSelectedLocationType("all");
    setSearchDeviceId("");
    setPsOption("ps");
    setCurrentPage(1);
  };
  const handleSearchDeviceIdChange = (event) => {
    setSearchDeviceId(event.target.value);
    setCurrentPage(1);
  };
const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
};
  // --- Theme Variables ---
  const buttonGradientColor = useColorModeValue(
    "linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)",
    "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)"
  );
  // Match the light blue in screenshot for dropdowns/buttons
  const filterBgColor = useColorModeValue("#bfd8ea", "#2D3748");
  const textColor = useColorModeValue("black", "white");
  const radioButtonColor = useColorModeValue("blue.600", "blue.200");
 const bg=useColorModeValue("white", "gray.800")

  const totalItemsAfterFilters = useMemo(
    () =>
      allFetchedCameras.filter(
        (c) =>
          (!selectedDistrictName || c.district === selectedDistrictName) &&
          (!selectedAssemblyValue || c.assembly === selectedAssemblyValue) &&
          (selectedLocationType === "all" ||
            c.location_Type === selectedLocationType) &&
          (!searchDeviceId ||
            (psOption === "ps"
              ? c.ps_id &&
              String(c.ps_id)
                .toLowerCase()
                .includes(searchDeviceId.toLowerCase())
              : c.DeviceId &&
              c.DeviceId.toLowerCase().includes(
                searchDeviceId.toLowerCase()
              )))
      ).length,
    [
      allFetchedCameras,
      selectedDistrictName,
      selectedAssemblyValue,
      selectedLocationType,
      searchDeviceId,
      psOption,
    ]
  );

  const text = useColorModeValue('gray.500', 'gray.400');

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      <style>
        {`
          .swal2-container {
            z-index: 10000 !important;
          }
        `}
      </style>
      <ChakraBox
        borderRadius="lg"
        h={"fit-content"}
        flexDirection="column"
        gap={2}
        display="flex"
      >
        <Text fontWeight={400} fontSize="26px" color={text}>
          CheckPost Master
        </Text>

        {/* --- Top Filter Row --- */}
        <Flex
          direction="column"
          gap={2}
          w="100%"
          mb={0}
        >
          {/* Row 1: Dropdowns, Clear Filter, Radio + Search */}
          <Flex
            justify="space-between"
            align="center"
            wrap="wrap"
            gap={4}
          >
            {/* Left Side: Filters */}
            <HStack spacing={3} wrap="wrap">
              <Select
                placeholder="Select District"
                // borderRadius="md" // Matching screenshot rounded corners
                borderRadius={"12px"}
                border="none"
                value={selectedDistrictName}
                onChange={handleDistrictChange}
                size="lg"
                color={textColor}
                bg={buttonGradientColor}
                height={"34px"}
                fontSize={"12px"}
                w="auto"
                sx={{
                  "> option": {
                    bg: useColorModeValue("white", "gray.700"),
                    color: useColorModeValue("black", "white"),
                  },
                }}
              >
                {districtsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <Select
                placeholder="Select Assembly"
                bg={buttonGradientColor}
                borderRadius={"12px"}
                border="none"
                value={selectedAssemblyValue}
                onChange={handleAssemblyChange}
                isDisabled={!selectedDistrictName || assembliesList.length === 0}
                size="lg"
                color={textColor}
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
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
              {/* <Select
                placeholder="Select Location type"
                bg={filterBgColor}
                borderRadius="md"
                border="none"
                value={selectedLocationType}
                onChange={handleLocationTypeChange}
                size="lg"
                color={textColor}
                sx={{
                  "> option": {
                    bg: useColorModeValue("white", "gray.700"),
                    color: useColorModeValue("black", "white"),
                  },
                }}
                width={"125px"}
                height={"34px"}
                fontSize={"12px"}
              >
               
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="auxiliary">Auxiliary</option>
              </Select> */}
              <ChakraLink
                textDecoration="underline"
                onClick={handleClearFilters}
                color={textColor}
                width={"125px"}
                height={"34px"}
                fontSize={"12px"}
                fontWeight="500"
                ml={2}
                _hover={{ color: "black" }}
              >
                CLEAR FILTER
              </ChakraLink>

         <RadioGroup onChange={setSearchOption} value={searchOption}>
  <HStack spacing={2}>
    <Radio
      value="vehicle"
      size="md"
      colorScheme="blue"
      borderColor="gray.400"
    >
      <Text fontSize="12px" fontWeight={searchOption === "vehicle" ? "bold" : "normal"}>
        Location
      </Text>
    </Radio>
    <Text color="gray.400" fontSize="12px">|</Text>
    <Radio
      value="camera"
      size="md"
      colorScheme="blue"
      borderColor="gray.400"
    >
      <Text fontSize="12px" fontWeight={searchOption === "camera" ? "bold" : "normal"}>
        Camera ID
      </Text>
    </Radio>
  </HStack>
</RadioGroup>

<Input
  placeholder={searchOption === "vehicle" ? "Location" : "Search Camera ID"}
  border="1px solid #CBD5E0"
  value={searchQuery} // Use the new state name
  onChange={handleSearchChange} // Use the new handler name
  size="lg"
  width={"155px"}
  height={"34px"}
  fontSize={"12px"}
  bg={buttonGradientColor}
  borderRadius={"12px"}
  color={textColor}
  _placeholder={{ color: useColorModeValue("gray.600", "gray.400") }}
/>
              <Button
                onClick={handleOpenAddModal}
                h="40px"
                px={6}
                width={"125px"}
                height={"34px"}
                fontSize={"12px"}
                fontWeight="normal"
                bg={buttonGradientColor}
                borderRadius={"12px"}
                // _hover={{ bg: "#a0cbe6" }}
                boxShadow="sm"
                color={textColor}
              >
                Add New CheckPost
              </Button>
            </HStack>

            {/* Right Side: Radio & Search */}
            <HStack spacing={3}>

            </HStack>
          </Flex>

          {/* Row 2: Status & Add Device Button */}
          <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
            {/* Visual Status Dropdown (Placeholder to match image layout) */}
            {/* <Select
              placeholder="Select Status"
              bg={filterBgColor}
              borderRadius="md"
              border="none"
              size="lg"
              h="40px"
              fontSize="15px"
              width="180px"
              color={textColor}
            // No functionality added yet as per code logic provided
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </Select> */}

            {/* Statistics Placeholder (Optional, based on image) */}


            {/* Add New Device Button (Styled like Download Report button in image) */}
          </Flex>
        </Flex>

        {/* --- Table --- */}
        {loading ? (
          <Flex justifyContent="center" alignItems="center" height="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : (
          <>
            <div style={tableContainerStyle}>
              <Table variant="simple" size="sm">
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
                      Location<VerticalLine />
                    </Th>
                    <Th style={tableHeaderStyle}>Operator Name<VerticalLine /></Th>
                                          <Th style={tableHeaderStyle}>Operator Mobile No.<VerticalLine /></Th>
                    <Th style={tableHeaderStyle}>
                      Device Id<VerticalLine />
                    </Th>
                    {/* <Th style={tableHeaderStyle}>
                      PS ID<VerticalLine />
                    </Th> */}
                    {/* <Th style={tableHeaderStyle}>
                      Location Type<VerticalLine />
                    </Th> */}
                    <Th style={tableHeaderStyle}>
                      Status
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {displayedCameras.length > 0 ? (
                    displayedCameras.map((camera, index) => (
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
                         <Td style={tableDataStyle}>{camera.operatorName || "N/A"}<VerticalLine /></Td>
                                                  <Td style={tableDataStyle}>{camera.operatorMobile || "N/A"}<VerticalLine /></Td>
                        <Td style={tableDataStyle}>
                          {camera.DeviceId || "N/A"}
                          <VerticalLine />
                        </Td>
                        {/* <Td style={tableDataStyle}>
                          {camera.ps_id || "N/A"}
                          <VerticalLine />
                        </Td> */}
                        {/* <Td style={tableDataStyle}>
                          {camera.location_Type}
                          <VerticalLine />
                        </Td> */}
                        <Td style={tableDataStyle}>
                          <Button
                            size="sm"
                            mr={2}
                            onClick={() => handleOpenEditModal(camera)}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            _hover={{ bg: "red.500", color: "white" }}
                            onClick={() => handleDelete(camera.DeviceId)}
                            title="Delete Camera"
                          >
                            <FaTrash />
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td
                        colSpan="8"
                        textAlign="center"
                        style={tableDataStyle}
                        p={5}
                      >
                        No Records found.
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </div>
            {totalItemsAfterFilters > itemsPerPage && (
              <Flex justifyContent="center" mt={4} alignItems="center">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  isDisabled={currentPage === 1}
                  mr={2}
                  size="sm"
                >
                  Previous
                </Button>
                <Text fontSize="sm">
                  Page {currentPage} of{" "}
                  {Math.ceil(totalItemsAfterFilters / itemsPerPage) || 1}
                </Text>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  isDisabled={
                    currentPage * itemsPerPage >= totalItemsAfterFilters
                  }
                  ml={2}
                  size="sm"
                >
                  Next
                </Button>
              </Flex>
            )}
          </>
        )}
      </ChakraBox>
      {/* Modal */}
      {editingCamera && (
        <Modal
          isOpen={isModalOpen}
          onClose={onClose}
          isCentered
          size="xl"
          scrollBehavior="inside" /* <--- ADD THIS PROP HERE */
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {modalMode === "edit" ? "Edit Camera Details" : "Add New FSV"}
            </ModalHeader>
            <ModalCloseButton />

            {/* The scrollbar will appear here automatically when content overflows */}
            <ModalBody pb={6}>
  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
    
    {/* Column 1: District */}
    <FormControl isRequired>
      <FormLabel fontSize="sm">District</FormLabel>
      <Select
        name="district"
        value={editingCamera.district}
        isDisabled={modalMode === "edit"}
        onChange={handleModalDistrictChange}
        placeholder="Select District"
        size="lg"
      >
        {districtsList.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </Select>
    </FormControl>

    {/* Column 2: Assembly */}
    <FormControl isRequired>
      <FormLabel fontSize="sm">Assembly</FormLabel>
      <Select
        name="assembly"
        value={editingCamera.assembly}
        onChange={handleEditInputChange}
        placeholder="Select Assembly"
        isDisabled={modalMode === "edit"}
        size="lg"
      >
        {modalAssembliesList.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </Select>
    </FormControl>

    {/* Column 1: Vehicle No. */}
    <FormControl isRequired mt={2}>
      <FormLabel fontSize="sm">Location</FormLabel>
      <Input
        name="location"
        value={editingCamera.location || ""}
        onChange={handleEditInputChange}
        placeholder="location"
        size="lg"
      />
    </FormControl>

    {/* Column 2: Device ID */}
    <FormControl isRequired mt={2} position="relative">
  <FormLabel fontSize="sm">Device ID</FormLabel>
  <Input
    name="DeviceId"
    value={editingCamera.DeviceId || ""}
    onChange={handleDeviceIdChange} // Use the new handler
   // onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Small delay to allow click
    placeholder="Enter Device ID"
    size="lg"
    autoComplete="off"
  />

  {/* Suggestion Dropdown */}
  {showSuggestions && deviceIdSuggestions.length > 0 && (
    <ChakraBox
      position="absolute"
      top="100%"
      left="0"
      right="0"
      zIndex="dropdown"
      bg={bg}
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      boxShadow="lg"
      maxH="200px"
      overflowY="auto"
    >
      {deviceIdSuggestions.map((id) => (
        <Box
          key={id}
          px={4}
          py={2}
          cursor="pointer"
          _hover={{ bg: "blue.50", color: "blue.600" }}
          onClick={() => handleSelectSuggestion(id)}
          fontSize="sm"
          borderBottom="1px solid"
          borderColor="gray.100"
        >
          {id}
        </Box>
      ))}
    </ChakraBox>
  )}
</FormControl>

    {/* Column 1: Operator Name */}
    <FormControl mt={2}>
      <FormLabel fontSize="sm">Operator Name</FormLabel>
      <Input
        name="operatorName"
        value={editingCamera.operatorName || ""}
        onChange={handleEditInputChange}
        placeholder="Enter Operator Name"
        size="lg"
      />
    </FormControl>

    {/* Column 2: Operator Mobile */}
    <FormControl mt={2}>
  <FormLabel fontSize="sm">Operator Mobile No.</FormLabel>
  <Input
    name="operatorMobile"
    type="tel"
    maxLength={10} // Limits characters to 10
    value={editingCamera.operatorMobile || ""}
    onChange={(e) => {
      // Regex to allow only numeric digits
      const value = e.target.value.replace(/\D/g, "");
      if (value.length <= 10) {
        handleEditInputChange({
          target: { name: "operatorMobile", value: value },
        });
      }
    }}
    placeholder="Enter 10-digit number"
    size="lg"
  />
</FormControl>

  </Grid>
</ModalBody>

            <ModalFooter>
              <Button
                colorScheme="blue"
                mr={3}
                onClick={handleSave}
                isLoading={isSaving}
                isDisabled={isSaving}
                size="lg"
              >
                Save
              </Button>
              <Button onClick={onClose} isDisabled={isSaving} size="lg">
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default Boxes;
