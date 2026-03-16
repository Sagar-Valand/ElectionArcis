import {
  Box,
  Flex,
  Text,
  Tabs,
  TabList,
  Tab,
  Input,
  InputGroup,
  IconButton,
  SimpleGrid,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Badge,
  useColorModeValue,
  Image,
  Divider,
  InputLeftElement,
  HStack,
  Tag,
  Portal,
  Tooltip,
  Skeleton,
  SkeletonText,
  InputRightElement,
  Icon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  FormControl,
  FormLabel,
  ModalFooter,
  Heading,
  Select,
  Switch,
  Spacer,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Grid,
  useToast,
  RadioGroup,
  VStack,
  Radio,
  grid,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Spinner,

} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import {
  getAllCameras,
  getSharedCamera,
  getSharedEmails,
  removeSharedCamera,
  removeUserCamera,
  shareCamera,
  updateCamera,
  getdistrictwiseAccess,
  getDistrictNameByAssemblyName,
  getCamerasByDistrict
} from "../actions/cameraActions";
import { MdGridView } from "react-icons/md";
import { TfiLayoutListThumb } from "react-icons/tfi";
import { CiCircleRemove, CiMap } from "react-icons/ci";
import { IoMdNotificationsOutline } from "react-icons/io";
import { IoPlayCircleOutline, IoSearchOutline } from "react-icons/io5";
import { LuLayoutList } from "react-icons/lu";
import { Link as RouterLink, useLocation } from "react-router-dom";
import theme from "../theme";
import { ChevronDownIcon, ChevronUpIcon, InfoIcon } from "@chakra-ui/icons";
import {
  getAlertSettings,
  getAreaDetection,
  getAudioInfo,
  getCustomerStats,
  getFace,
  getHumanoid,
  getHumanTracking,
  getImageInfo,
  getLineCross,
  getMissingObjectDetection,
  getMotionDetection,
  getQuality,
  getUnattendedObjectDetection,
  getVideoSettings,
  rebootCamera,
  setAlertSettings,
  setAreaDetection,
  setAudioInfo,
  getSmartQuality,
  setSmartQuality,
  setCustomerStats,
  setFace,
  setHumanoid,
  setHumanTrackingSettings,
  setImageInfo,
  setLineCross,
  setMissingObjectDetection,
  setMotionDetection,
  setQualitySettings,
  setUnattendedObjectDetection,
  setVideoSettings,
} from "../actions/settingsActions";
import LineCrossCanvas from "../components/Canvas/LineCrossCanvas";
import CustomerCanvas from "../components/Canvas/CustomerCanvas";
import UAOCanvas from "../components/Canvas/UAOCanvas";
import MODCanvas from "../components/Canvas/MODCanvas";
import NoCameraFound from "../components/NoCameraFound";
import AreaCanvas from "../components/Canvas/AreaCanvas";
import MobileHeader from "../components/MobileHeader";
import AudioRecorder from "../components/AudioRecorder";
import { FiInfo } from "react-icons/fi";
//import DashboardHeader from "./DashboardHeader";

const Cameras = () => {
  const toast = useToast();

  const [userDistricts, setUserDistricts] = useState([]);
  const [isDistrictLoading, setIsDistrictLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [isGridView, setGridView] = useState(() => {
    // Load the view preference from localStorage on initialization
    const savedView = localStorage.getItem("cameraView");
    return savedView ? savedView === "grid" : true; // Default to Grid View
  });
  const [tempView, setTempView] = useState(
    isGridView ? "Grid View" : "List View"
  ); // Temporary state for the selection

  const [sharedCameras, setSharedCameras] = useState([]);
  const [sortStatus, setSortStatus] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(isGridView ? 6 : 20);
  // const tabBg = useColorModeValue("#F1EFFE", "#5F4BB6");
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeModal, setActiveModal] = useState(null);
  const [smartQualityActiveModal, setSmartQualityActiveModal] = useState(null);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [selectedCameraName, setSelectedCameraName] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [selectedCameraType, setSelectedCameraType] = useState(null);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [activeTab, setActiveTab] = useState("General");
  const [camerasTab, setCamerasTab] = useState("My Cameras");
  const [timeZoneOffset, setTimeZoneOffset] = useState("+00:00"); // Initial timezone value
  const [brightness, setBrightness] = useState(50);
  const [contrast, setContrast] = useState(50);
  const [saturation, setSaturation] = useState(0);
  const [hue, setHue] = useState(0);
  const [sharpness, setSharpness] = useState(50);
  const [flip, setFlip] = useState(false);
  const [audio, setAudio] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [irCutMode, setIrCutMode] = useState(false);
  const [quality, setQuality] = useState("");
  const [sharedEmails, setSharedEmails] = useState([]);
  const [totalCameras, setTotalCameras] = useState(0);
  const [totalSharedCameras, setTotalSharedCameras] = useState(0);
  // AI Settings States
  const [aiEnabled, setAiEnabled] = useState(false);
  const [humanTracking, setHumanTracking] = useState(false);
  const [cruiseMode, setCruiseMode] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const cardDetailsColor = useColorModeValue("linear-gradient(180deg, rgba(173, 209, 235) 5.17%, rgba(255, 255, 255) 45.14%)", "linear-gradient(to right bottom, #163B74 10.53%, rgba(3, 7, 17) 100.32%)")
  // Motion Detection States
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [motionSensitivity, setMotionSensitivity] = useState(0);
  const [motionAudioAlert, setMotionAudioAlert] = useState(false);
  const [motionLightAlert, setMotionLightAlert] = useState(false);
  // Human Detection States
  const [humanEnabled, setHumanEnabled] = useState(false);
  const [humanSensitivity, setHumanSensitivity] = useState(0);
  const [humanSensitivityLevel, setHumanSensitivityLevel] = useState(0);
  const [humanAudioAlert, setHumanAudioAlert] = useState(false);
  const [humanLightAlert, setHumanLightAlert] = useState(false);
  // Face Detection States
  const [faceEnabled, setFaceEnabled] = useState(false);
  const [audioAlert, setAudioAlert] = useState(false);
  const [enablesmartQuality, setenableSmartQuality] = useState(false);
  const [dataPlan, setdataPlan] = useState(0);
  const [lightAlert, setLightAlert] = useState(false);
  const [faceSensitivity, setFaceSensitivity] = useState(0);
  // Line Crossing States
  const [lineCrossEnabled, setLineCrossEnabled] = useState(false);
  const [lineCrossAudioAlert, setLineCrossAudioAlert] = useState(false);
  const [lineCrossLightAlert, setLineCrossLightAlert] = useState(false);
  const [lineCrossSensitivity, setLineCrossSensitivity] = useState(0);
  // Line Cross Canvas States
  const [detectLine, setDetectLine] = useState(null);
  const [direction, setDirection] = useState(null);
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
  // Area Detection States
  const [areaEnabled, setAreaEnabled] = useState(false);
  const [areaAudioAlert, setAreaAudioAlert] = useState(false);
  const [areaLightAlert, setAreaLightAlert] = useState(false);
  const [areaSensitivity, setAreaSensitivity] = useState(0);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [detectArea, setDetectArea] = useState([]);
  const [areaDirection, setAreaDirection] = useState(null);
  const [Action, setAction] = useState("");
  // Traffic Detection States
  const [trafficEnabled, setTrafficEnabled] = useState(false);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  const [detectTraffic, setDetectTraffic] = useState(null);
  const [trafficDirection, setTrafficDirection] = useState(null);
  // Unattended Object Detection States
  const [unattendedEnabled, setUnattendedEnabled] = useState(false);
  const [unattendedAudioAlert, setUnattendedAudioAlert] = useState(false);
  const [unattendedLightAlert, setUnattendedLightAlert] = useState(false);
  const [unattendedSensitivity, setUnattendedSensitivity] = useState(0);
  const [isUnattendedModalOpen, setIsUnattendedModalOpen] = useState(false);
  const [detectUnattended, setDetectUnattended] = useState(null);
  const [unattendedDirection, setUnattendedDirection] = useState(null);
  // Missing Object Detection States
  const [missingEnabled, setMissingEnabled] = useState(false);
  const [missingAudioAlert, setMissingAudioAlert] = useState(false);
  const [missingLightAlert, setMissingLightAlert] = useState(false);
  const [missingSensitivity, setMissingSensitivity] = useState(0);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [detectMissing, setDetectMissing] = useState(null);
  const [missingDirection, setMissingDirection] = useState(null);
  const [unattendedDuration, setUnattendedDuration] = useState(0);
  const [missingDuration, setMissingDuration] = useState(0);
  // wifi settings
  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiResponse, setWifiResponse] = useState(null);
  const [selectedAssembly, setSelectedAssembly] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // --- NEW State for Districts and Assemblies ---
  const [userEmail, setUserEmail] = useState(localStorage.getItem("email") || ''); // Get email once
  const [allAccessibleData, setAllAccessibleData] = useState([]); // Raw data from first API
  // --- End NEW State ---
  const [districtWiseCameras, setDistrictWiseCameras] = useState({});
  const [assemblyWiseCameras, setAssemblyWiseCameras] = useState({});
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [selectedAssemblyValue, setSelectedAssemblyValue] = useState('');
  const [uniqueDistricts, setUniqueDistricts] = useState([]);
  const [assemblies, setAssemblies] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingAssemblies, setLoadingAssemblies] = useState(false);
  const [districtError, setDistrictError] = useState(null);
  const [assemblyError, setAssemblyError] = useState(null);
  const [selectedDistrictDid, setSelectedDistrictDid] = useState('');
  const [unfilteredCameras, setUnfilteredCameras] = useState([]);
  const [view, setView] = useState("grid");
  const [psOption, setPsOption] = useState("ps");
  const [reportFormat, setReportFormat] = useState("csv");

  // State for fetched data
  const [districts, setDistricts] = useState([]);


  // Chakra UI hooks
  const radioButtonColor = useColorModeValue("black", "white");
  const grid_view_icon = useColorModeValue("/images/grid_view_icon_light.png", "/images/grid_view_icon.png");
  const list_view_icon = useColorModeValue("/images/list_view_icon_light.png", "/images/list_view_icon.png");
  const buttonGradientColor = useColorModeValue(
    "linear-gradient(93.5deg, #9CBAD2 , #CDDEEB 94.58%)", // light mode
    "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)" // dark mode
  );


  // gradient style for buttons
  const gradientBtn = {
    bg: buttonGradientColor,
    _hover: {
      bg: useColorModeValue(
        "linear-gradient(93.5deg, #8EABC5 , #C4D7E7 94.58%)", // slightly darker hover in light mode
        "linear-gradient(93.5deg, #1F1F1F 0.56%, #010307 50.58%)" // darker hover in dark mode
      ),
    },
  };
  const totalCount = cameras.length;
  const onlineCount = cameras.filter((cam) => cam.status === "online").length;
  const offlineCount = cameras.filter((cam) => cam.status === "offline").length;

  const handleTimeZoneChange = (event) => {
    setTimeZoneOffset(event.target.value);
  };

  const openModal = (modal, cameraId, cameraName) => {
    setActiveModal(modal);
    setSelectedCameraId(cameraId);
    setSelectedCameraName(cameraName);
    onOpen();
  };

  const openSettingsModal = (modal, deviceId, cameraName, productType) => {
    setActiveModal(modal);
    setSelectedDeviceId(deviceId);
    setSelectedCameraName(cameraName);
    setSelectedCameraType(productType);
    onOpen();
  };

  const openShareModal = (modal, deviceId) => {
    setActiveModal(modal);
    setSelectedDeviceId(deviceId);
    onOpen();
  };

  const openShareAccessModal = (modal, deviceId) => {
    fetchSharedEmails(deviceId);
    setActiveModal(modal);
    setSelectedDeviceId(deviceId);
    onOpen();
  };

  const openRemoveSharedCameraModal = (modal, deviceId) => {
    setActiveModal(modal);
    setSelectedDeviceId(deviceId);
    onOpen();
  };

  const openRemoveCamera = (modal, deviceId) => {
    setActiveModal(modal);
    setSelectedDeviceId(deviceId);
    onOpen();
  };

  const openRemoveAdminShareModal = (modal, deviceId, email) => {
    setActiveModal(modal);
    setSelectedEmailId(email);
    setSelectedDeviceId(deviceId);
    onOpen();
  };

  const handleToggleSmartQuality = (modal) => {
    setenableSmartQuality(!enablesmartQuality);
    if (!enablesmartQuality) {
      setSmartQualityActiveModal(modal);
      onOpen();
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveTab("General");
    onClose();
  };

  const handleUpdateCameraName = async (name) => {
    // Update the camera in the cameras array
    try {
      const response = await updateCamera(selectedCameraId, name);
      closeModal();
      setSelectedCameraId(null);
      setSelectedCameraName(null);
      fetchAllCameras();
      // // console.log("Camera updated:", response);
    } catch (error) {
      console.error("Error updating camera:", error);
    }
  };

  const handleShareCamera = async () => {
    // Update the camera in the cameras array
    try {
      const response = await shareCamera(selectedDeviceId, shareEmail);
      closeModal();
      setSelectedDeviceId(null);
      setShareEmail(null);
      fetchAllCameras();
      toast({
        title: response.message,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating camera:", error);
    }
  };

  // Sample camera data
  // const cameras = Array(10).fill({
  // name: "Entry Gate No 18",
  // status: "Offline", // "Offline"
  // snapshot: "Snapshot : 15 mins ago",
  // });

  // Colors to match the provided image
  const tabBg = useColorModeValue("#F1EFFE", "#5F4BB6");
  const gridBorderColor = useColorModeValue("#FCFCFC", "#231F1F");
  const tabActiveColor = useColorModeValue(
    "custom.lightModeText",
    "custom.darkModeText"
  );
  const onlineBackgroundColor = useColorModeValue("rgba(0,128,0,0.2)", "rgba(64, 130, 64, 0.5)");
  const offlineBackgroundColor = useColorModeValue("rgba(128,0,0,0.2)", "rgba(128,0,0,0.5)");
  const tabInactiveColor = useColorModeValue("#65758B", "custom.tabDarkMode");
  const bgColor = useColorModeValue("custom.primary", "custom.darkModePrimary");
  const textColor = useColorModeValue(
    "custom.lightModeText",
    "custom.darkModeText"
  );

  const selectedTab = useColorModeValue(
    "custom.primary",
    "custom.darkModePrimary"
  );

  // handle pagination
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
    // // console.log("Previous Page", page);
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
    // // console.log("Next Page", page);
  };
  // Example: In your API service file (e.g., api.js)
  // This function needs to take the district identifier (name or ID)
  // and return a promise that resolves to an array of assembly objects.
  const getAssembliesByDistrictAPI = async (districtIdentifier) => {
    // Replace with your actual API endpoint and logic
    // The backend needs an endpoint like /api/assemblies?district=<districtIdentifier>
    // or /api/districts/<districtIdentifier>/assemblies
    const response = await fetch(`/api/assemblies?district=${encodeURIComponent(districtIdentifier)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch assemblies');
    }
    const data = await response.json();
    return data.assemblies || []; // Assuming the API returns { assemblies: [...] }
  };

  // --- Fetch Cameras ---

  // src/components/Cameras.js

  const fetchAllCameras = async () => {
    setIsLoading(true);
    try {
      console.log("COMPONENT: fetchAllCameras - Calling action with parameters:", {
        page, itemsPerPage, search, sortStatus,
        district: selectedDistrictName, assembly: selectedAssemblyValue,
      });

      const response = await getAllCameras( // Calls the action from cameraActions.js
        page, itemsPerPage, search, sortStatus, selectedDistrictName, selectedAssemblyValue
      );

      console.log("COMPONENT: fetchAllCameras - Raw response from ACTION call:", JSON.stringify(response, null, 2));

      let camerasFromBackend = [];
      let dataSourceInfo = "No camera data or API call failed.";

      if (response && response.success) {
        camerasFromBackend = response.cameras || [];
        dataSourceInfo = `Using 'response.cameras' (count: ${camerasFromBackend.length}). Backend handled primary filtering.`;
        if (selectedAssemblyValue) dataSourceInfo += ` Queried for Assembly: ${selectedAssemblyValue}.`;
        else if (selectedDistrictName) dataSourceInfo += ` Queried for District: ${selectedDistrictName}.`;
        else dataSourceInfo += ` No specific district or assembly queried.`;
      } else if (response) {
        dataSourceInfo = `API call failed: ${response.message || 'Unknown API error'}`;
        console.error("COMPONENT: fetchAllCameras - API call reported failure:", response);
        toast({ title: "API Error", description: response.message || "Failed to retrieve cameras.", status: "error", duration: 5000, isClosable: true });
      }
      console.log("COMPONENT: fetchAllCameras - Data source info:", dataSourceInfo);

      if (response && response.success) {
        setUnfilteredCameras(camerasFromBackend);
        setTotalPages(response.totalPages || 1);
        setTotalCameras(response.total !== undefined ? response.total : 0);
      } else {
        setUnfilteredCameras([]); setTotalCameras(0); setPage(1); setTotalPages(1);
      }
    } catch (err) {
      const errorMessage = err.message || "Component error in fetching cameras.";
      console.error("COMPONENT: fetchAllCameras - JavaScript/Network Error:", errorMessage, err);
      setUnfilteredCameras([]); setTotalCameras(0); setPage(1); setTotalPages(1);
      toast({ title: "Fetch Error", description: errorMessage, status: "error", duration: 5000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };


  const fetchSharedCameras = async () => {
    try {
      const response = await getSharedCamera();
      // // console.log("getSharedCameras", response);
      setSharedCameras(response.data || []);
      setTotalSharedCameras(response.total || 0);
    } catch (error) {
      console.error("Error fetching cameras:", error);
    } finally {
      setIsLoading(false); // Stop loading when data is fetched
    }
  };

  const fetchSharedEmails = async (deviceId) => {
    try {
      const response = await getSharedEmails(deviceId);
      setSharedEmails(response.data);
      // // console.log("getSharedEmails", response);
    } catch (error) {
      console.error("Error fetching cameras:", error);
    } finally {
      setIsLoading(false); // Stop loading when data is fetched
    }
  };

  const email = localStorage.getItem("email");
  const handleRemoveSharedCamera = async () => {
    try {
      // Use emailId if it exists; otherwise, fallback to email
      const emailToUse = selectedEmailId || email;
      // // console.log("emailToUse", emailToUse);
      const response = await removeSharedCamera(emailToUse, selectedDeviceId);
      // // console.log("removeSharedCamera", response);

      fetchSharedCameras();
      setSelectedDeviceId(null);
      closeModal();

      toast({
        title: "Camera Access Removed Successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error fetching cameras:", error);
    }
  };

  const handleRemoveCamera = async () => {
    try {
      const response = await removeUserCamera(selectedDeviceId);
      // // console.log("removeUserCamera", response);
      fetchAllCameras();
      closeModal();
      toast({
        title: "Camera Removed Successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error fetching cameras:", error);
    }
  };


  // Utility function to calculate the time difference
  const getTimeAgo = (timestamp) => {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeDiffInSeconds = currentTime - timestamp;

    if (timeDiffInSeconds < 60) {
      return `${timeDiffInSeconds} seconds ago`;
    } else if (timeDiffInSeconds < 3600) {
      const minutes = Math.floor(timeDiffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (timeDiffInSeconds < 86400) {
      const hours = Math.floor(timeDiffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(timeDiffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  // Fetch initial data
  // const fetchCameras = async () => {
  //   try {
  //     const response = await getAllCameras(page, itemsPerPage, sortStatus); // Fetch paginated data
  //     console.log("getAllCameras: ", response);

  //     setCameras(response.cameras || []);
  //     setTotalPages(response.totalPages || 1);
  //     setTotalCameras(response.total || 0);

  //   } catch (error) {
  //     console.error("Error fetching cameras:", error);
  //   }
  // };

  const updateCameraData = () => {
    setCameras((prevCameras) =>
      prevCameras.map((camera) => {
        const storedData = localStorage.getItem(
          `deviceImage_${camera.deviceId}`
        );
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          return {
            ...camera,
            imageUrl:
              parsedData.imageUrl ||
              "https://zeta.arcisai.io/images/CameraCard.png", // Default fallback
            lastOpened: getTimeAgo(parsedData.timestamp),
          };
        }
        return {
          ...camera,
          imageUrl: "https://zeta.arcisai.io/images/CameraCard.png", // Default fallback
          lastOpened: "N/A",
        };
      })
    );
  };

  const handleViewChange = (isGrid) => {
    setGridView(isGrid);
    setItemsPerPage(isGrid ? 6 : 20); // Set itemsPerPage to 20 for list view, 6 for grid view
    setPage(isGrid ? 1 : 1);
  };

  useEffect(() => {
    // Save the current view preference to localStorage whenever it changes
    localStorage.setItem("cameraView", isGridView ? "grid" : "list");

    // Fetch cameras and shared cameras
    // fetchCameras();
    fetchSharedCameras();

    // Set interval to update camera data from localStorage
    const intervalId = setInterval(updateCameraData, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [isGridView, page]); // Depend on `isGridView` and `page`

  // Sort function based on status
  const sortCameras = (status) => {
    if (status === "online") {
      setCameras((prevCameras) =>
        [...prevCameras].sort((a, b) => (a.status === "online" ? -1 : 1))
      );
    } else if (status === "offline") {
      setCameras((prevCameras) =>
        [...prevCameras].sort((a, b) => (a.status === "offline" ? -1 : 1))
      );
    }
  };


  // --- Fetch Districts ---
  // --- Fetch Districts ---
  useEffect(() => {
    const fetchInitialDistricts = async () => {
      if (!userEmail) {
        setDistrictError("User email not available for fetching districts.");
        setLoadingDistricts(false);
        return;
      }
      setLoadingDistricts(true);
      setDistrictError(null);
      try {
        const response = await getdistrictwiseAccess(userEmail); // Call the ACTION

        if (response?.success && Array.isArray(response.matchedDistricts)) {

          // --- THIS IS THE FIX ---
          // The API returned duplicates, so we create a unique list here.

          const districtsMap = new Map();
          response.matchedDistricts.forEach(district => {
            // By using 'dist_name' as the key, the Map automatically handles
            // uniqueness. It will overwrite any previous entry with the same name.
            districtsMap.set(district.dist_name, district);
          });

          // Convert the map's values back into a unique array of district objects.
          const trulyUniqueDistricts = Array.from(districtsMap.values());

          // Now, set the state with the clean, de-duplicated data.
          setUniqueDistricts(trulyUniqueDistricts);
          // --- END OF FIX ---

        } else {
          setDistrictError(response?.message || "Failed to load districts.");
          setUniqueDistricts([]);
        }
      } catch (err) {
        setDistrictError(err.message || "Error occurred while fetching districts.");
        setUniqueDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchInitialDistricts();
  }, [userEmail]); // Depends on userEmail



  // --- Fetch Assemblies when district is selected ---
  // --- Fetch Assemblies when district is selected ---
  // src/components/Cameras.js
  const handleDistrictChange = async (event) => {
    const selectedDistName = event.target.value;
    console.log("COMPONENT: handleDistrictChange - Selected District Name:", selectedDistName);
    setSelectedDistrictName(selectedDistName);
    setSelectedAssemblyValue(''); // CRITICAL RESET
    console.log("COMPONENT: handleDistrictChange - selectedAssemblyValue RESET");

    setAssemblies([]);
    setAssemblyError(null);

    if (!selectedDistName) {
      setSelectedDistrictDid('');
      setLoadingAssemblies(false);
      return;
    }

    // const districtObject = uniqueDistricts.find(d => d.name === selectedDistName); // Already set by fetchDistricts for display
    // setSelectedDistrictDid(districtObject ? districtObject.did : ''); // If needed for client-side logic

    setLoadingAssemblies(true);
    try {
      // Pass userEmail from component state
      const response = await getDistrictNameByAssemblyName(userEmail, selectedDistName);
      console.log("COMPONENT: handleDistrictChange - Response from getDistrictNameByAssemblyName (fetching assemblies):", JSON.stringify(response, null, 2));

      if (response?.success) {
        const assembliesArray = response.districts; // Backend returns assemblies under 'districts' key
        if (Array.isArray(assembliesArray)) {
          setAssemblies(assembliesArray); // Backend now sorts assemblies
          if (assembliesArray.length === 0) console.log("COMPONENT: No assemblies found for district:", selectedDistName);
        } else {
          setAssemblyError("Invalid assembly data format from API."); setAssemblies([]);
        }
      } else {
        setAssemblyError(response?.message || "Failed to load assemblies for district."); setAssemblies([]);
      }
    } catch (err) {
      setAssemblyError(err.message || "Error fetching assemblies."); setAssemblies([]);
    } finally {
      setLoadingAssemblies(false);
    }
  };



  // --- Assembly Change Handler ---
  const handleAssemblyChange = (event) => {
    setSelectedAssemblyValue(event.target.value);

  };



  // Handle click for sorting
  const handleSort = (status) => {
    setSortStatus(status);

    // sortCameras(status);
    setPage(1);
    // console.log(status);
  };

  const handleCameraClick = (cameraId, status) => {
    navigate(`/camera/${cameraId}`, { state: { status } });
  };

  const fetchData = async () => {
    try {
      if (activeTab === "Media") {
        const response = await getVideoSettings(selectedDeviceId);
        const response2 = await getImageInfo(selectedDeviceId);
        // console.log("getVideoSettings", response2);
        setIrCutMode(response2.irCutMode);
        setBrightness(response.brightnessLevel);
        setContrast(response.contrastLevel);
        setSaturation(response.saturationLevel);
        setSharpness(response.sharpnessLevel);
        setHue(response.hueLevel);
        setMirror(response.mirrorEnabled);
        setFlip(response.flipEnabled);
      } else if (activeTab === "General") {
        // console.log("getGeneralSettings");
        const qualityResponse = await getQuality(selectedDeviceId);
        // console.log("getQuality", qualityResponse);
        // console.log("selectedCameraType", selectedCameraType);
        setQuality(qualityResponse.quality.quality);
        if (selectedCameraType && selectedCameraType.includes("S-Series")) {
          // Check the camera type
          // console.log("S-Series");
          const aiResponse = await getAlertSettings(selectedDeviceId);
          setAiEnabled(aiResponse.bEnable);
          const aiResponse2 = await getHumanTracking(selectedDeviceId);
          setHumanTracking(aiResponse2.motionTracking);
          setCruiseMode(aiResponse2.cruiseMode);
          // console.log("getAlertSettings", aiResponse2);
        }
        const response = await getAudioInfo(selectedDeviceId);
        setAudio(response.enabled);
        const smartQualityresponse = await getSmartQuality(selectedDeviceId);
        // // console.log("response", response);
        setenableSmartQuality(smartQualityresponse.smartQuality.smartQuality);
        setdataPlan(smartQualityresponse.smartQuality.dataPlan);
        // // console.log("getSmartQuality", smartQuality);
      } else if (
        activeTab === "AI Settings" &&
        activeDropdown === "Motion Detection"
      ) {
        const response = await getMotionDetection(selectedDeviceId);
        setMotionEnabled(response.enabled);
        setMotionSensitivity(response.detectionGrid.sensitivityLevel);
        setMotionAudioAlert(response.alarmOut.audioAlert.enabled);
        setMotionLightAlert(response.alarmOut.lightAlert.enabled);
        // // console.log("getMotionDetection", response);
      } else if (
        activeTab === "AI Settings" &&
        activeDropdown === "Human Detection"
      ) {
        // // console.log("getAISettings");
        const response = await getHumanoid(selectedDeviceId);
        setHumanEnabled(response.Enabled ? response.Enabled : response.enabled);
        setHumanSensitivity(response.Sensitivity);
        setHumanSensitivityLevel(response.sensitivityStep);
        setHumanAudioAlert(response.AlarmOut.AudioAlert.Enabled);
        setHumanLightAlert(response.AlarmOut.LightAlert.Enabled);
        // // console.log("getHumanDetection", response);
      } else if (
        activeTab === "AI Settings" &&
        activeDropdown === "Face Detection"
      ) {
        const response = await getFace(selectedDeviceId);
        setFaceEnabled(response.Enabled);
        setFaceSensitivity(response.Sensitivity);
        setAudioAlert(response.AlarmOut.AudioAlert.Enabled);
        setLightAlert(response.AlarmOut.LightAlert.Enabled);
        // // console.log("getFace", response);
      } else if (
        activeTab === "AI Settings" &&
        activeDropdown === "Line Crossing Detection"
      ) {
        const response = await getLineCross(selectedDeviceId);
        setLineCrossEnabled(response.Enabled);
        setLineCrossSensitivity(response.Sensitivity);
        setLineCrossAudioAlert(response.AlarmOut.AudioAlert.Enabled);
        setLineCrossLightAlert(response.AlarmOut.LightAlert.Enabled);
        // // console.log("getLineCross", response);
      } else if (
        activeTab === "AI Settings" &&
        activeDropdown === "Area Detection"
      ) {
        const response = await getAreaDetection(selectedDeviceId);
        setAreaEnabled(response.Enabled);
        setAreaSensitivity(response.Sensitivity);
        setAreaAudioAlert(response.AlarmOut.AudioAlert.Enabled);
        setAreaLightAlert(response.AlarmOut.LightAlert.Enabled);
        setAction(response.Action);
        setAreaDirection(response.Direction);
        // setDetectArea(response.DetectRegion);
        // setAreaDuration(response.MinDuration);
        // console.log("getAreaDetection", response);
      } else if (
        activeTab === "AI Settings" &&
        activeDropdown === "Traffic Detection"
      ) {
        const response = await getCustomerStats(selectedDeviceId);
        setTrafficEnabled(response.Enabled);
        // // console.log("getCustomerStats", response);
      } else if (
        activeTab === "AI Settings" &&
        activeDropdown === "Unattended Object"
      ) {
        const response = await getUnattendedObjectDetection(selectedDeviceId);
        setUnattendedEnabled(response.Enabled);
        setUnattendedSensitivity(response.Sensitivity);
        setUnattendedAudioAlert(response.AlarmOut.AudioAlert.Enabled);
        setUnattendedLightAlert(response.AlarmOut.LightAlert.Enabled);
        setUnattendedDuration(response.Duration);
        // // console.log("getunattendedobject", response);
      } else if (
        activeTab === "AI Settings" &&
        activeDropdown === "Missing Object"
      ) {
        const response = await getMissingObjectDetection(selectedDeviceId);
        setMissingEnabled(response.Enabled);
        setMissingSensitivity(response.Sensitivity);
        setMissingAudioAlert(response.AlarmOut.AudioAlert.Enabled);
        setMissingLightAlert(response.AlarmOut.LightAlert.Enabled);
        setMissingDuration(response.Duration);
        // // console.log("getMissing", response);
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab} settings:`, error);
    }
  };

  useEffect(() => {
    // Only proceed if the modal is open and is the Camera Settings modal
    if (isOpen && activeModal === "Camera Settings") {
      fetchData();
    }
  }, [isOpen, activeModal, activeTab, activeDropdown, selectedDeviceId]);


  // --- useEffect to Fetch Districts ---
  // useEffect(() => {
  //   const fetchDistrictsForUser = async () => {
  //     // const userEmail = localStorage.getItem("email"); // Get email from storage

  //     if (!email) {
  //       setDistrictError("User email not found. Cannot load districts.");
  //       setIsDistrictLoading(false);
  //       setUserDistricts([]); // Ensure districts array is empty
  //       return;
  //     }

  //     setIsDistrictLoading(true);
  //     setDistrictError(null); // Reset error state

  //     try {
  //       const response = await getdistrictwiseAccess(email);
  //       // console.log('0000000000000000',response)
  //       console.log('API Response [getdistrictwiseAccess]:', response);
  //       if (response && response.success) {
  //         setUserDistricts(response.matchedDistricts || []);
  //       } else {

  //         setDistrictError(response?.message || "Failed to load districts.");
  //         setUserDistricts([]);
  //         toast({
  //           title: "Error Loading Districts",
  //           description: response?.message || "Could not fetch district list.",
  //           status: "error",
  //           duration: 5000,
  //           isClosable: true,
  //         });
  //       }
  //     } catch (error) {

  //       console.error("Error fetching user districts in component:", error);
  //       setDistrictError("An error occurred while fetching districts.");
  //       setUserDistricts([]);
  //       toast({
  //         title: "Network Error",
  //         description: "Could not connect to fetch district list.",
  //         status: "error",
  //         duration: 5000,
  //         isClosable: true,
  //       });
  //     } finally {
  //       setIsDistrictLoading(false);
  //     }
  //   };

  //   fetchDistrictsForUser();
  // }, [toast]);









  // Set AI Settings

  const handleAISettings = async () => {
    try {
      // console.log("handleAISettings", activeDropdown);
      if (activeDropdown === "Motion Detection") {
        const response = await setMotionDetection(
          selectedDeviceId,
          motionEnabled,
          motionSensitivity,
          motionAudioAlert,
          motionLightAlert
        );
        // console.log("setMotionDetection", response);
        toast({
          title: "Motion Settings Updated Successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (activeDropdown === "Human Detection") {
        const response = await setHumanoid(
          selectedDeviceId,
          humanEnabled,
          humanSensitivity,
          humanSensitivityLevel,
          humanAudioAlert,
          humanLightAlert
        );
        // // console.log("setHumanoid", response);
        toast({
          title: "Human Settings Updated Successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (activeDropdown === "Face Detection") {
        const response = await setFace(
          selectedDeviceId,
          faceEnabled,
          faceSensitivity,
          audioAlert,
          lightAlert
        );
        // console.log("setFace", response);
        toast({
          title: "Face Settings Updated Successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (activeDropdown === "Traffic Detection") {
        const response = await setCustomerStats(
          selectedDeviceId,
          trafficEnabled,
          detectTraffic,
          trafficDirection
        );
        // console.log("setLineCross", response);
        toast({
          title: "Line Crossing Settings Updated Successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (activeDropdown === "Line Crossing Detection") {
        const response = await setLineCross(
          selectedDeviceId,
          lineCrossEnabled,
          lineCrossSensitivity,
          lineCrossAudioAlert,
          lineCrossLightAlert,
          detectLine,
          direction
        );
        // console.log("setLineCross", response);
        toast({
          title: "Line Crossing Settings Updated Successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (activeDropdown === "Area Detection") {
        const response = await setAreaDetection(
          selectedDeviceId,
          areaEnabled,
          areaSensitivity,
          areaAudioAlert,
          areaLightAlert,
          detectArea,
          areaDirection,
          Action
        );
        // console.log("setAreaDetection", response);
        toast({
          title: "Area Detection Settings Updated Successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (activeDropdown === "Missing Object") {
        const response = await setMissingObjectDetection(
          selectedDeviceId,
          missingEnabled,
          missingSensitivity,
          missingAudioAlert,
          missingLightAlert,
          detectMissing,
          missingDuration
        );
        // console.log("setMissingObjectDetection", response);
        toast({
          title: "Missing Object Settings Updated Successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else if (activeDropdown === "Unattended Object") {
        const response = await setUnattendedObjectDetection(
          selectedDeviceId,
          unattendedEnabled,
          unattendedSensitivity,
          unattendedAudioAlert,
          unattendedLightAlert,
          detectUnattended,
          unattendedDuration
        );
        // console.log("setUnattendedObjectDetection", response);
        toast({
          title: "Unattended Object Settings Updated Successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error updating camera:", error);
    }
  };

  // const handleQualityChange = async (value) => {
  //   setQuality(value); // Update the state with the selected quality
  //   const qualityResponse = await setQualitySettings(selectedDeviceId, value);
  //   toast({
  //     title: "Quality Settings Updated Successfully",
  //     status: "success",
  //     duration: 3000,
  //     isClosable: true,
  //   });
  //   fetchData();
  //   // console.log("qualityResponse", qualityResponse);
  // };

  // State for quality loader
  const [qualityLoading, setQualityLoading] = useState(false);

  const handleQualityChange = async (value) => {
    setQuality(value); // Update the state with the selected quality
    setQualityLoading(true); // Show the loader
    try {
      const qualityResponse = await setQualitySettings(selectedDeviceId, value);
      toast({
        title: "Quality Settings Updated Successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchData(); // Fetch updated data
      // console.log("qualityResponse", qualityResponse);
    } catch (error) {
      toast({
        title: "Failed to Update Quality Settings",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error updating quality settings:", error);
    } finally {
      setQualityLoading(false); // Hide the loader
    }
  };

  const handleToggleSmart = async () => {
    try {
      const response = await setSmartQuality(selectedDeviceId, enablesmartQuality, dataPlan);
      // console.log("setSmartQuality", response);
      setSmartQualityActiveModal(null);
      toast({
        title: "Smart Quality Settings Updated Successfully",
        status: "success",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error updating camera:", error);
    }
  }

  const handleGeneralSettings = async () => {
    try {
      // try {
      const response = await setAudioInfo(selectedDeviceId, audio);
      // } catch (error) {
      //   console.error("Error updating camera:", error);
      // }
      const aiResponse = await setAlertSettings(selectedDeviceId, aiEnabled);
      // const savesmartQuality = await setSmartQuality(
      //   selectedDeviceId,
      //   enablesmartQuality,
      //   dataPlan
      // );
      const humanTrackingResponse = await setHumanTrackingSettings(
        selectedDeviceId,
        humanTracking,
        cruiseMode
      );
      fetchData();
      setSelectedDeviceId(null);
      closeModal();
      toast({
        title: "Settings Updated Successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating camera:", error);
    }
  };

  const handleWifiSettings = async () => {
    const payload = {
      wirelessMode: "stationMode",
      stationMode: {
        wirelessStaMode: "802.11bgn mixed",
        wirelessApBssId: "123456",
        wirelessApEssId: "Torque4",
        wirelessApPsk: "Raptor@101",
        wirelessFixedBpsModeEnabled: false,
      },
    };

    try {
      const res = await fetch("/netsdk/Network/Interface/4/Wireless", {
        method: "PUT",
        headers: {
          Authorization: "Basic YWRtaW46", // Base64 encoded credentials
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setWifiResponse(`Success: ${JSON.stringify(data)}`);
      } else {
        throw new Error(`Error: ${res.status}, ${JSON.stringify(data)}`);
      }
    } catch (error) {
      setWifiResponse(`Failed: ${error.message}`);
    }
  };

  const handleMediaSettings = async () => {
    try {
      const response = await setImageInfo(selectedDeviceId, irCutMode);
      const response2 = await setVideoSettings(
        selectedDeviceId,
        brightness,
        contrast,
        saturation,
        sharpness,
        hue,
        mirror,
        flip
      );
      // console.log("updateVideoSettings", response2);
      fetchData();
      setSelectedDeviceId(null);
      closeModal();
      toast({
        title: "Settings Updated Successfully",
        // description: "The video failed to load.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating camera:", error);
    }
  };

  // Reboot Settings
  const handleRebootCamera = async () => {
    try {
      const response = await rebootCamera(selectedDeviceId);
      // console.log("rebootCamera", response);
      setSelectedDeviceId(null);
      closeModal();
      toast({
        title: "Camera Rebooted Successfully",
        // description: "The video failed to load.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating camera:", error);
    }
  };
  const openCanvasModal = () => {
    setIsCanvasModalOpen(true);
  };
  const closeCanvasModal = () => {
    setIsCanvasModalOpen(false);
  };

  // CANVAS MODAL'S

  // line cross modal
  const handleCanvasData = (line, direction) => {
    setDetectLine(line);
    setDirection(direction);
  };
  // traffic detection modal
  const openTrafficModal = () => {
    setIsTrafficModalOpen(true);
  };
  const closeTrafficModal = () => {
    setIsTrafficModalOpen(false);
  };
  const handleTrafficData = (traffic, direction) => {
    setDetectTraffic(traffic);
    setTrafficDirection(direction);
  };
  // unattended object modal
  const openUnattendedModal = () => {
    setIsUnattendedModalOpen(true);
  };
  const closeUnattendedModal = () => {
    setIsUnattendedModalOpen(false);
  };
  const handleUnattendedData = (unattended, direction) => {
    setDetectUnattended(unattended);
    setUnattendedDirection(direction);
  };

  // missing object modal
  const openMissingModal = () => {
    setIsMissingModalOpen(true);
  };
  const closeMissingModal = () => {
    setIsMissingModalOpen(false);
  };
  const handleMissingData = (missing, direction) => {
    setDetectMissing(missing);
    setMissingDirection(direction);
  };

  // Area detection modal
  const openAreaModal = () => {
    setIsAreaModalOpen(true);
  };
  const closeAreaModal = () => {
    setIsAreaModalOpen(false);
  };
  const handleAreaData = (area, direction) => {
    setDetectArea(area);
    setAreaDirection(direction);
  };

  // Canvas gets over here //

  const saveButtonBackgroundColor = useColorModeValue(
    theme.colors.custom.primary,
    theme.colors.custom.darkModePrimary
  );
  const saveButtonColor = useColorModeValue(
    theme.colors.custom.lightModeText,
    theme.colors.custom.darkModeText
  );
  const saveButtonHoverBackgroundColor = useColorModeValue(
    theme.colors.custom.darkModePrimary,
    theme.colors.custom.primary
  );
  const saveButtonHoverColor = useColorModeValue(
    theme.colors.custom.darkModeText,
    theme.colors.custom.lightModeText
  );

  const handleOpenModal = (modalType) => {
    setActiveModal(modalType);
    onOpen();
  };

  const handleApply = () => {
    // Update the main state based on temporary selection
    setGridView(tempView === "Grid View");
    onClose(); // Close the drawer
  };

  //
  useEffect(() => {
    // Fetch data when the component mounts

    setIsLoading(true);
    fetchAllCameras();
  }, [sortStatus, page, isGridView]);


  // --- Trigger Camera Fetch when filters change ---
  // useEffect(() => {
  //   // if (!selectedDistrictName) return;
  //   fetchAllCameras();
  // }, [selectedDistrictName, selectedAssemblyValue, page, itemsPerPage, sortStatus, search]);

  // src/components/Cameras.js

  // Fetching districts for the dropdown
  useEffect(() => {
    const fetchInitialDistricts = async () => {
      if (!userEmail) {
        setDistrictError("User email not available for fetching districts.");
        setLoadingDistricts(false);
        return;
      }
      setLoadingDistricts(true);
      setDistrictError(null);
      try {
        const response = await getdistrictwiseAccess(userEmail); // Call the ACTION
        console.log("COMPONENT: useEffect[userEmail] - Response from getdistrictwiseAccess:", JSON.stringify(response.matchedDistricts ? response.matchedDistricts.slice(0, 5) : response, null, 2));
        if (response?.success && Array.isArray(response.matchedDistricts)) {
          setUniqueDistricts(response.matchedDistricts); // Backend provides unique, sorted names
        } else {
          setDistrictError(response?.message || "Failed to load districts.");
          setUniqueDistricts([]);
        }
      } catch (err) {
        setDistrictError(err.message || "Error occurred while fetching districts.");
        setUniqueDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchInitialDistricts();
  }, [userEmail]); // Depends on userEmail

  // Fetching cameras when filters or pagination change
  useEffect(() => {
    console.log("COMPONENT: useEffect[filters, page, etc.] - Triggering fetchAllCameras. Deps changed:", { selectedDistrictName, selectedAssemblyValue, page, itemsPerPage, search, sortStatus });
    fetchAllCameras();
  }, [selectedDistrictName, selectedAssemblyValue, page, itemsPerPage, search, sortStatus]);

  // Client-side processing of cameras received from backend (e.g., additional sorting IF NEEDED)
  useEffect(() => {
    let processedCameras = [...unfilteredCameras];
    // If backend handles status filtering via 'sortStatus', this client-side sort might only be for ordering the current page.
    // If 'sortStatus' is purely a backend filter, this client-side sort could be removed.
    if (sortStatus && camerasTab === "My Cameras") {
      processedCameras.sort((a, b) => {
        if (sortStatus === 'online') {
          if (a.status === 'online' && b.status !== 'online') return -1;
          if (a.status !== 'online' && b.status === 'online') return 1;
        } else if (sortStatus === 'offline') {
          if (a.status === 'offline' && b.status !== 'offline') return -1;
          if (a.status !== 'offline' && b.status === 'offline') return 1;
        }
        return 0;
      });
    }
    setCameras(processedCameras);
  }, [unfilteredCameras, sortStatus, camerasTab]);


  // --- useEffect to Fetch Cameras when filters/pagination change ---
  useEffect(() => {
    console.log("COMPONENT: useEffect[filters, page, etc.] - Triggering fetchAllCameras. Deps changed:", { selectedDistrictName, selectedAssemblyValue, page, itemsPerPage, search, sortStatus });
    fetchAllCameras();
  }, [selectedDistrictName, selectedAssemblyValue, page, itemsPerPage, search, sortStatus]);

  const text = useColorModeValue('gray.500', 'gray.400');

  return (
    <Box mb={{ base: "20", md: "5" }}>
      {/* Mobile Header */}
      <MobileHeader title="Camera" />
      <Flex direction="column" gap={4} h={"fit-content"}>
        {/* Header Row */}
        <Flex justifyContent="space-between" align="center">
          <Text fontWeight={400} fontSize="26px" color={text}>Grid View</Text>

          {/* View Toggle */}
          <Flex gap={3}>
            <Box
              borderRadius="12px"
              p="1px"
              bg={view === "grid" ? "linear-gradient(149.18deg, #D6D6D6 0%, #040811 101.62%)" : "transparent"}
            >
              <Box
                as="button"
                bg={view === "grid" ? buttonGradientColor : "transparent"}
                p="8px"
                borderRadius="12px"
                onClick={() => setView("grid")}
              >
                <Image src={grid_view_icon} />
              </Box>
            </Box>

            <Box
              borderRadius="12px"
              p="1px"
              bg={
                window.location.pathname === "/listview"
                  ? "linear-gradient(149.18deg, #D6D6D6 0%, #040811 101.62%)"
                  : "transparent"
              }
            >
              <Box
                as={RouterLink}
                to="/listview"
                bg={
                  window.location.pathname === "/listview"
                    ? buttonGradientColor
                    : "transparent"
                }
                p="8px"
                borderRadius="12px"
                onClick={() => console.log("Switched to list view")}
                aria-label="List View"
                display="flex" // Added to center icon if it's a child
                alignItems="center"
                justifyContent="center"
              >
                <Image src={list_view_icon} boxSize="20px" color="white" />{" "}
                {/* Changed Image to Icon */}
              </Box>
            </Box>

          </Flex>
        </Flex>

        {/* Filter Row */}
        <Grid
          templateColumns="repeat(7, 1fr)"
          columnGap={4}
          rowGap={2}
          alignItems="center"
        >
          {/* Dropdowns */}


          <Box minW="150px">
            <Select
              value={selectedDistrictName} // The value is the district name
              onChange={handleDistrictChange}
              placeholder={loadingDistricts ? "Loading..." : "Select District"}
              isDisabled={loadingDistricts || !userEmail || !!districtError} // Use !!districtError to convert to boolean
              icon={loadingDistricts ? <Spinner size="xs" /> : undefined}
              borderRadius="10px"
              bg={buttonGradientColor}
              width={"125px"}
              height={"34px"}
              fontSize={"12px"}
            >
              {/* Ensure uniqueDistricts is an array and map over it */}
              {Array.isArray(uniqueDistricts) && uniqueDistricts.map((district) => (
                <option key={district.districtAssemblycode} value={district.dist_name}>
                  {district.dist_name}
                </option>
              ))}
            </Select>
            {districtError && <Text color="red.500" fontSize="xs" mt={1}>{districtError}</Text>}
          </Box>
          <Box minW="150px">
            <Select
              value={selectedAssemblyValue}
              onChange={handleAssemblyChange}
              placeholder={
                !selectedDistrictName
                  ? "Select District First"
                  : loadingAssemblies
                    ? "Loading Assemblies..."
                    : assemblyError
                      ? "Error loading assemblies"
                      : assemblies.length === 0 // Check if assemblies is empty AFTER loading
                        ? "-- No Assemblies --"
                        : "Select Assembly"
              }
              isDisabled={!selectedDistrictName || loadingAssemblies || !!assemblyError || (assemblies.length === 0 && !loadingAssemblies && selectedDistrictName && !assemblyError)}
              icon={loadingAssemblies ? <Spinner size="xs" /> : undefined}
              borderRadius="10px"
              bg={buttonGradientColor}
              width={"125px"}
              height={"34px"}
              fontSize={"12px"}
            >
              {Array.isArray(assemblies) && assemblies.map((assembly) => (
                <option key={assembly.accode || assembly._id || assembly.name} value={assembly.accName}>
                  {assembly.accName || assembly.name}
                  {assembly.accode ? ` (${assembly.accode})` : ''}
                </option>
              ))}
            </Select>
            {assemblyError && !loadingAssemblies && <Text color="red.500" fontSize="xs" mt={1}>{assemblyError}</Text>}
          </Box>



          {/* <Link textDecoration="underline" onClick={() => {
            setSelectedDistrict("");
            setSelectedAssembly("");
            setAssemblies([]);
            console.log("Clear Filters");
          }} ml={3} width={"125px"}
            height={"34px"}
            fontSize={"12px"}>
            CLEAR FILTER
          </Link> */}




          {/* 🔍 Search Input */}
          <InputGroup>
            <Input
              placeholder="Search camera, Location, Model no."
              _focus={{
                borderColor: "purple.400", // or theme.colors.custom.primary
                boxShadow: `0 0 0 1px purple.400`,
              }}
              borderRadius="10px"
              bg={buttonGradientColor}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchAllCameras(page, itemsPerPage, search);
                }
              }}
              width={"125px"}
              height={"34px"}
              fontSize={"12px"}
              color={useColorModeValue("black", "white")}
              _placeholder={{ color: useColorModeValue("gray.600", "gray.400") }}

            />
            <InputLeftElement>
              <IconButton
                icon={<IoSearchOutline size="20px" />}
                onClick={() => fetchAllCameras(page, itemsPerPage, search)}
                variant="ghost"
                aria-label="Search"
                _hover={{ bg: "transparent" }}
                _focus={{ boxShadow: "none" }}
                _active={{ bg: "transparent" }}
              />
            </InputLeftElement>
          </InputGroup>

          {/* Row 2 */}

          <Flex gap={6} gridColumn="span 3">
            <Text color="blue.400">● Total Cameras ({totalCount})</Text>
            <Text color="green.400">● Online ({onlineCount})</Text>
            <Text color="red.400">● Offline ({offlineCount})</Text>
          </Flex>


          {/* CSV / PDF Radio Group */}

        </Grid>
      </Flex>

      {/* Tabs for Camera view */}
      {/* green */}
      {/* <Flex
        align="center"
        bg="green.500"
        justifyContent="space-between"
        w="100%"
        mt={{ base: "12", md: "0" }}
      > */}
      {/* Centered Tabs */}
      {/* <Tabs
          variant="filled"
          bg={useColorModeValue(
            "custom.tabInactiveLightBg",
            "custom.tabInactiveDarkBg"
          )}
          borderRadius="10px"
          boxShadow="1px 1px 10px 0px rgba(0, 0, 0, 0.13) inset"
          mx="auto"
          // minH="35px"
          h={{ base: "auto", md: "auto" }}
          w={{ base: "100%", md: "30%" }} // Full width on mobile
          onChange={(index) =>
            setCamerasTab(["My Cameras", "Shared Cameras"][index])
          }
        >
          <TabList>
            <Tab
              _selected={{
                bg: selectedTab,
                color: tabActiveColor,
                borderRadius: "10px",
                fontWeight: "bold",
              }}
              px={{ base: 0, md: 6 }}
              py={1.5}
              borderRadius="full"
              color={tabInactiveColor}
              h="full" // Ensure full height for consistency
              w={{ base: "50%", md: "50%" }} // Full width on mobile
            >
              My Cameras
            </Tab>
            <Tab
              _selected={{
                bg: selectedTab,
                color: tabActiveColor,
                borderRadius: "10px",
                fontWeight: "bold",
              }}
              px={{ base: 0, md: 6 }}
              py={1.5}
              borderRadius="full"
              color={tabInactiveColor}
              w={{ base: "50%", md: "50%" }} // Full width on mobile
              h="full" // Ensure full height for consistency
            >
              Shared Cameras
            </Tab>
          </TabList>
        </Tabs> */}

      {/* Dropdowns */}
      {/* <Flex gap={4} flexWrap="wrap"> */}

      {/* <Box minW="150px">
            <Select
              value={selectedDistrictName} // The value is the district name
              onChange={handleDistrictChange}
              placeholder={loadingDistricts ? "Loading..." : "-- Select District --"}
              isDisabled={loadingDistricts || !userEmail || !!districtError} // Use !!districtError to convert to boolean
              icon={loadingDistricts ? <Spinner size="xs" /> : undefined}
              borderRadius="10px"
            > */}
      {/* Ensure uniqueDistricts is an array and map over it */}
      {/* {Array.isArray(uniqueDistricts) && uniqueDistricts.map((district) => ( */}
      {/* <option key={district.districtAssemblycode} value={district.dist_name}> Use district.name as value */}
      {/* {district.dist_name}
                </option> */}
      {/* ))}
            </Select>
            {districtError && <Text color="red.500" fontSize="xs" mt={1}>{districtError}</Text>}
          </Box> */}


      {/* <Box minW="150px">
            <Select
              value={selectedAssemblyValue}
              onChange={handleAssemblyChange}
              placeholder={
                !selectedDistrictName
                  ? "-- Select District First --"
                  : loadingAssemblies
                    ? "Loading Assemblies..."
                    : assemblyError
                      ? "Error loading assemblies"
                      : assemblies.length === 0 // Check if assemblies is empty AFTER loading
                        ? "-- No Assemblies --"
                        : "-- Select Assembly --"
              }
              isDisabled={!selectedDistrictName || loadingAssemblies || !!assemblyError || (assemblies.length === 0 && !loadingAssemblies && selectedDistrictName && !assemblyError)}
              icon={loadingAssemblies ? <Spinner size="xs" /> : undefined}
              borderRadius="10px"
            > */}
      {/* {Array.isArray(assemblies) && assemblies.map((assembly) => ( */}
      {/* <option key={assembly.accode || assembly._id || assembly.name} value={assembly.accode}> Ensure accode is the value backend expects */}
      {/* {assembly.accName || assembly.name} Display name */}
      {/* {assembly.accode ? ` (${assembly.accode})` : ''}
                </option>
              ))}
            </Select>
            {assemblyError && !loadingAssemblies && <Text color="red.500" fontSize="xs" mt={1}>{assemblyError}</Text>}
          </Box>

        </Flex> */}



      {/* <InputGroup maxW="300px" display={{ base: "none", md: "flex" }}> */}
      {/* Hides search input on mobile */}
      {/* <Input
            placeholder="Search camera, Location, Model no."
            // border="1px solid #C7C8CE"
            // _focus={{ borderColor: "#C8D6E5" }}
            _focus={{
              borderColor: theme.colors.custom.primary, // Custom purple border color on focus
              boxShadow: ` 0 0 0 1px ${theme.colors.custom.primary}`, // Custom purple box shadow
            }}
            borderRadius={"10px"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchAllCameras(page, itemsPerPage, search); // Trigger search when pressing Enter
              }
            }}
          />
          <InputLeftElement>
            <IconButton
              icon={<IoSearchOutline size="20px" />}
              onClick={(e) => fetchAllCameras(page, 6, search)}
              variant="ghost"
              aria-label="Search"
              _hover={{ bg: "transparent" }} // Remove background on hover
              _focus={{ boxShadow: "none" }} // Remove focus outline
              _active={{ bg: "transparent" }} // Remove background on active state
            />
          </InputLeftElement>
        </InputGroup> */}
      {/* Search Bar aligned to the end */}
      {/* </Flex> */}

      {/* Filter and Camera Status */}
      {/* blue */}
      {/*
<Box w="100%" mt={2} bg="blue.200">
  // Camera title and Grouping
  <HStack width="100%">
    <Text
      fontSize="xl"
      fontWeight="bold"
      display={{ base: "none", md: "flex" }}
    >
      {camerasTab === "My Cameras"
        ? `Camera(${totalCameras})`
        : `Shared Camera(${totalSharedCameras})`}
    </Text>

    // Grouping link
    // <Link color="gray.500" fontSize="sm">Grouping</Link>
  </HStack>

  // Filter & View Icons
  {camerasTab === "My Cameras" && (
    <>
      <Box mt={2}>
        // Added margin-top for spacing
        <InputGroup maxW="full" display={{ base: "flex", md: "none" }}>
          <InputLeftElement>
            <IconButton
              icon={<IoSearchOutline size="20px" />}
              onClick={(e) => fetchAllCameras(page, 6, search)}
              variant="ghost"
              aria-label="Search"
              _hover={{ bg: "transparent" }}
              _focus={{ boxShadow: "none" }}
              _active={{ bg: "transparent" }}
            />
          </InputLeftElement>
          <Input
            placeholder="Search camera, Location, Model no."
            _focus={{
              borderColor: theme.colors.custom.primary,
              boxShadow: `0 0 0 1px ${theme.colors.custom.primary}`,
            }}
            borderRadius={"10px"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchAllCameras(page, itemsPerPage, search);
              }
            }}
          />
        </InputGroup>
      </Box>

      <HStack
        justify="space-between"
        width="100%"
        display={{ base: "flex", md: "flex" }}
      >
        // Left Side: Filter and Clear All
        <HStack
          mt={{ base: 3, md: 0 }}
          justify="space-between"
          width="100%"
        >
          <Box>
            <HStack spacing={2}>
              <Tag
                colorScheme="green"
                variant="outline"
                bg={
                  sortStatus === "online"
                    ? onlineBackgroundColor
                    : "rgba(59, 94, 198, 0)"
                }
                onClick={() => handleSort("online")}
                cursor={"pointer"}
              >
                <Box w={2} h={2} bg="#95DA25" borderRadius="full" mr={1} />
                Online
              </Tag>

              <Tag
                colorScheme="red"
                variant="outline"
                bg={
                  sortStatus === "offline"
                    ? offlineBackgroundColor
                    : "rgba(0,0,0,0)"
                }
                onClick={() => handleSort("offline")}
                cursor={"pointer"}
              >
                <Box w={2} h={2} bg="#FF6262" borderRadius="full" mr={1} />
                Offline
              </Tag>

              {sortStatus === "online" || sortStatus === "offline" ? (
                <Tag
                  colorScheme="gray"
                  variant="outline"
                  onClick={() => handleSort(null)}
                  cursor={"pointer"}
                >
                  Clear
                </Tag>
              ) : null}
            </HStack>
          </Box>

          <Flex
            display={{ base: "flex", md: "none" }}
            align="center"
            gap={0}
            cursor={"pointer"}
            onClick={() => handleOpenModal("filterOptions")}
          >
            <IconButton
              aria-label="View Option"
              icon={<Icon as={LuLayoutList} boxSize="16px" />}
              variant="plain"
              size="sm"
            />
            <Text fontSize="16px">View by</Text>
          </Flex>
        </HStack>

        // View Options as Tabs
        <Tabs
          variant="unstyled"
          display={{ base: "none", md: "flex" }}
          index={isGridView ? 0 : 1}
          onChange={(index) => handleViewChange(index === 0)}
        >
          <TabList
            width="111px"
            height="28px"
            border="1px solid #C7C8CE"
            borderRadius="10px"
            display="inline-flex"
            alignItems="center"
            justifyContent="space-between"
            overflow="hidden"
            flexShrink={0}
          >
            <Tooltip
              hasArrow
              label="Grid View"
              placement="bottom"
              bg="rgba(0, 0, 0)"
              color="white"
            >
              <Tab
                _selected={{
                  bg: "custom.primary",
                  color: "black",
                }}
                borderRight="1px solid #C7C8CE"
                flex="1"
                height="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                padding="0"
              >
                <Icon as={MdGridView} boxSize="20px" aria-label="Grid View" />
              </Tab>
            </Tooltip>

            <Tooltip
              hasArrow
              label="List View"
              placement="bottom"
              bg="rgba(0, 0, 0)"
              color="white"
            >
              <Tab
                _selected={{
                  bg: "custom.primary",
                  color: "black",
                }}
                flex="1"
                height="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                padding="0"
              >
                <Icon
                  as={TfiLayoutListThumb}
                  boxSize="20px"
                  aria-label="List View"
                />
              </Tab>
            </Tooltip>
          </TabList>
        </Tabs>
      </HStack>
    </>
  )}

  // Online and Offline Tags
</Box>
*/}





      {/* card code to display db data */}
      {/*{
    camerasTab === "My Cameras" && (
        <>
            {/* Camera Grid */}
      {/*}
            {isLoading ? (
                isGridView ? (
                    // Grid View Skeleton Loader
                    <SimpleGrid
                        columns={{ base: 2, md: 3 }}
                        spacing={6}
                        mt={{ base: 3, md: 4 }}
                    >
                        {[...Array(6)].map((_, index) => (
                            <Box key={index} borderRadius="8px" overflow="hidden">
                                <Skeleton height="242px" borderRadius="8px" />
                                <Box p={2} bg="custom.primary">
                                    <SkeletonText noOfLines={2} spacing="4" />
                                </Box>
                            </Box>
                        ))}
                    </SimpleGrid>
                ) : (
                    // List View Skeleton Loader
                    <SimpleGrid
                        columns={{ base: 1, sm: 2, md: 4 }}
                        spacing={6}
                        mt={4}
                    >
                        {[...Array(20)].map((_, index) => (
                            <Flex
                                key={index}
                                borderRadius="8px"
                                overflow="hidden"
                                bg="custom.primary"
                            >
                                <Skeleton
                                    width="80px"
                                    height="80px"
                                    borderRadius="8px"
                                    mr={4}
                                />
                                <Box flex="1">
                                    <SkeletonText noOfLines={2} spacing="4" />
                                </Box>
                            </Flex>
                        ))}
                    </SimpleGrid>
                )
            ) : cameras.length > 0 ? (
                isGridView ? (
                    <SimpleGrid
                        columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
                        spacing={6}
                        mt={{ base: 3, md: 4 }}
                        w="100%"
                    >
                        {cameras.map((camera, index) => {
                            // Get the image URL from localStorage or fall back to default
                            const storedData = localStorage.getItem(
                                `deviceImage_${camera.deviceId}`
                            );
                            // const imageUrl = storedData
                            //   ? JSON.parse(storedData).imageUrl // Parse JSON and extract imageUrl
                            //   : "https://zeta.arcisai.io/images/icon2.png"; // Fallback to default
                            // const timestamp = storedData
                            //   ? JSON.parse(storedData).timestamp
                            //   : null;
                            const imageUrl = camera.lastImage
                                ? camera.lastImage
                                : "https://zeta.arcisai.io/images/icon2.png";
                            const timestamp = camera.timestamp ? camera.timestamp : null;

                            return (
                                <Box
                                    key={index}
                                    borderRadius="8px"
                                    overflow="hidden"
                                    w={"auto"}
                                    flexShrink={0}
                                >
                                    {/* Image Section */}
      {/*  <Box
                                        cursor={"pointer"}
                                        position="relative"
                                        w="100%"
                                        onClick={() =>
                                            handleCameraClick(camera.deviceId, camera.status)
                                        }
                                    >
                                        <Image
                                            src={imageUrl} // Use dynamic image URL
                                            alt="Camera Snapshot"
                                            width="100%"
                                            borderRadius="8px 8px 0 0"
                                            height={["200px", "242px"]} // Responsive height
                                            objectFit="cover"
                                        />
                                        {/* Status Indicator */}
      {/*<Box
                                            position="absolute"
                                            top="2"
                                            // right="2"
                                            left={"2"}
                                            bg={
                                                camera.status === "online" ? "#95DA25" : "#FF6262"
                                            }
                                            borderRadius="full"
                                            h="13px"
                                            w="13px"
                                            aria-label="Active status indicator"
                                        />

                                        {/* Play button
 <IconButton
                            aria-label="Play Video"
                            icon={<IoPlayCircleOutline size="30px" />}
                            bg="rgba(148, 163, 184, 0.43)"
                            variant="ghost"
                            isRound
                            size="sm"
                            position="absolute"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                          /> */}

      {/* Play Icon */}
      {/*<IconButton
                                            bg="rgba(148, 163, 184, 0.43)"
                                            aria-label="Play Video"
                                            icon={<IoPlayCircleOutline size="30px" />}
                                            variant="ghost"
                                            position="absolute"
                                            bottom="2"
                                            right="2"
                                            isRound
                                            size="md"
                                        />
                                    </Box>

                                    {/* Details Section */}
      {/*<Box p={2} bg={bgColor}>
                                        <Flex justify="space-between" align="center">
                                            {/* Text Container */}
      {/*<Box>
                                                <Text
                                                    fontWeight="bold"
                                                    fontSize="14px"
                                                    color={textColor}
                                                >
                                                    {camera.dist_name}/{camera.accName}/{camera.ps_id}/{camera.deviceId}/

                                                    {camera.locations && camera.locations.length > 0
                                                        ? (typeof camera.locations[0] === 'string'
                                                            ? camera.locations[0]
                                                            : (camera.locations[0] && camera.locations[0].loc_name)
                                                        )
                                                        : 'N/A'}

                                                </Text>

                                                <Text
                                                    fontSize="12px"
                                                    color={textColor}
                                                    opacity={0.4}
                                                >
                                                    {/* Snapshot:{" "}
                              {timestamp ? getTimeAgo(timestamp) : "N/A"} */}
      {/*</Text>
                                            </Box>

                                            {/* Menu for More Options */}
      {/*<Menu>
                                                <MenuButton
                                                    as={IconButton}
                                                    aria-label="More options"
                                                    icon={<BsThreeDotsVertical />}
                                                    variant="unstyled"
                                                    size="md"
                                                    mr={"-10px"}
                                                />
                                                <MenuList
                                                    fontSize="12px" // Decrease font size
                                                    p={"15px"} // Adjust padding
                                                // minWidth="10px" // Set a minimum width for the menu
                                                // _hover={{ bg: "purple.100" }}
                                                >
                                                    <MenuItem
                                                        _hover={{ bg: "custom.primary" }}
                                                        onClick={() =>
                                                            openSettingsModal(
                                                                "Camera Settings",
                                                                camera.deviceId,
                                                                camera.name,
                                                                camera.productType
                                                            )
                                                        }
                                                    >
                                                        Camera Setting
                                                    </MenuItem>
                                                    <MenuItem
                                                        _hover={{ bg: "custom.primary" }}
                                                        onClick={() =>
                                                            openShareAccessModal(
                                                                "Share Access",
                                                                camera.deviceId
                                                            )
                                                        }
                                                    >
                                                        View Sharing Access
                                                    </MenuItem>
                                                    <MenuItem
                                                        _hover={{ bg: "custom.primary" }}
                                                        onClick={() =>
                                                            openModal(
                                                                "Rename Device",
                                                                camera._id,
                                                                camera.name
                                                            )
                                                        }
                                                    >
                                                        Rename Device
                                                    </MenuItem>
                                                    {/* <MenuItem _hover={{ bg: "custom.primary" }}>
                                Pricing Plan
                              </MenuItem> */}
      {/* <MenuItem _hover={{ bg: "custom.primary" }}>
                        Manage Cloud Recording
                      </MenuItem>
                      <MenuItem _hover={{ bg: "custom.primary" }}>
                        Camera Details
                      </MenuItem> */}
      {/*<Divider my={1} w={"90%"} /> {/* Divider added */}
      {/*<MenuItem
                                                        _hover={{ bg: "custom.primary" }}
                                                        onClick={() =>
                                                            openShareModal(
                                                                "Share Camera",
                                                                camera.deviceId
                                                            )
                                                        }
                                                    >
                                                        Grant Access to Another
                                                    </MenuItem>
                                                    {/* <MenuItem _hover={{ bg: "custom.primary" }}>
                        Edit Access Rights to the Camera
                      </MenuItem> */}
      {/*<Divider my={1} color={"#F2E5FF"} w={"90%"} />{" "}
                                                    {/* Divider added */}
      {/*<MenuItem
                                                        _hover={{ bg: "custom.primary" }}
                                                        color={"red.500"}
                                                        onClick={() => {
                                                            openRemoveCamera(
                                                                "removeUserCamera",
                                                                camera.deviceId
                                                            );
                                                        }}
                                                    >
                                                        Remove Camera
                                                    </MenuItem>
                                                </MenuList>
                                            </Menu>
                                        </Flex>
                                    </Box>
                                </Box>
                            );
                        })}
                    </SimpleGrid>
                ) : (
                    <SimpleGrid
                        columns={{ base: 1, sm: 2, md: 4 }}
                        spacing={6}
                        mt={4}
                        w="100%"
                    >
                        {cameras.map((camera, index) => {
                            const storedData = localStorage.getItem(
                                `deviceImage_${camera.deviceId}`
                            );
                            // const { imageUrl, timestamp } = storedData
                            //   ? JSON.parse(storedData)
                            //   : {
                            //     imageUrl:
                            //       "https://zeta.arcisai.io/images/icon2.png",
                            //     timestamp: null,
                            //   };
                            const imageUrl = camera.lastImage
                                ? camera.lastImage
                                : "https://zeta.arcisai.io/images/icon2.png";
                            const timestamp = camera.timestamp ? camera.timestamp : null;

                            return (
                                <Box
                                    key={index}
                                    borderRadius="8px"
                                    overflow="hidden"
                                    bg={bgColor}
                                    position="relative" // Make Box position relative for absolute positioning
                                >
                                    {/* MenuButton positioned in top-right corner without extra space */}
      {/*<Box
                                        position="absolute"
                                        top={1}
                                        right={0}
                                        zIndex={1}
                                        p={0}
                                    >
                                        <Menu>
                                            <MenuButton
                                                as={IconButton}
                                                icon={<BsThreeDotsVertical />}
                                                variant="unstyled"
                                                size="sm"
                                                aria-label="Options"
                                            />
                                            <Portal>
                                                <MenuList
                                                    fontSize="12px" // Decrease font size
                                                    p={"15px"} // Adjust padding
                                                // minWidth="10px" // Set a minimum width for the menu
                                                // _hover={{ bg: "purple.100" }}
                                                >
                                                    <MenuItem
                                                        _hover={{ bg: "custom.primary" }}
                                                        onClick={() =>
                                                            openSettingsModal(
                                                                "Camera Settings",
                                                                camera.deviceId,
                                                                camera.name,
                                                                camera.productType
                                                            )
                                                        }
                                                    >
                                                        Camera Setting
                                                    </MenuItem>
                                                    <MenuItem
                                                        _hover={{ bg: "custom.primary" }}
                                                        onClick={() =>
                                                            openShareAccessModal(
                                                                "Share Access",
                                                                camera.deviceId
                                                            )
                                                        }
                                                    >
                                                        View Sharing Access
                                                    </MenuItem>
                                                    <MenuItem
                                                        _hover={{ bg: "custom.primary" }}
                                                        onClick={() =>
                                                            openModal(
                                                                "Rename Device",
                                                                camera._id,
                                                                camera.name
                                                            )
                                                        }
                                                    >
                                                        Rename Device
                                                    </MenuItem>
                                                    {/* <MenuItem _hover={{ bg: "custom.primary" }}>
                                Pricing Plan
                              </MenuItem> */}
      {/* <MenuItem _hover={{ bg: "custom.primary" }}>
                        Manage Cloud Recording
                      </MenuItem>
                      <MenuItem _hover={{ bg: "custom.primary" }}>
                        Camera Details
                      </MenuItem> */}
      {/*<Divider my={1} w={"90%"} /> {/* Divider added */}
      {/*<MenuItem
                                                        _hover={{ bg: "custom.primary" }}
                                                        onClick={() =>
                                                            openShareModal(
                                                                "Share Camera",
                                                                camera.deviceId
                                                            )
                                                        }
                                                    >
                                                        Grant Access to Another
                                                    </MenuItem>
                                                    {/* <MenuItem _hover={{ bg: "custom.primary" }}>
                        Edit Access Rights to the Camera
                      </MenuItem> */}
      {/*<Divider my={1} color={"#F2E5FF"} w={"90%"} />{" "}
                                                    {/* Divider added */}
      {/*<MenuItem
                                                        _hover={{ bg: "custom.primary" }}
                                                        color={"red.500"}
                                                        onClick={() => {
                                                            openRemoveCamera(
                                                                "removeUserCamera",
                                                                camera.deviceId
                                                            );
                                                        }}
                                                    >
                                                        Remove Camera
                                                    </MenuItem>
                                                </MenuList>
                                            </Portal>
                                        </Menu>
                                    </Box>

                                    <Flex align="center" p={0}>
                                        <Box
                                            position="relative"
                                            display="inline-block"
                                            onClick={() =>
                                                handleCameraClick(camera.deviceId, camera.status)
                                            }
                                            cursor={"pointer"}
                                            borderRight="3px solid"
                                            borderColor={gridBorderColor}
                                        >
                                            <Image
                                                src={imageUrl}
                                                alt="Camera Snapshot"
                                                width="90px"
                                                height="80px"
                                                objectFit="cover"
                                            />

                                            {/* Play button */}
      {/*<IconButton
                                                aria-label="Play Video"
                                                icon={<IoPlayCircleOutline size="30px" />}
                                                bg="rgba(148, 163, 184, 0.43)"
                                                variant="ghost"
                                                isRound
                                                size="sm"
                                                position="absolute"
                                                top="50%"
                                                left="50%"
                                                transform="translate(-50%, -50%)"
                                            />

                                            {/* Status indicator */}
      {/*<Box
                                                position="absolute"
                                                top="1"
                                                left="1"
                                                bg={
                                                    camera.status === "online" ? "#95DA25" : "#FF6262"
                                                }
                                                borderRadius="full"
                                                h="11px"
                                                w="11px"
                                                aria-label="Active status indicator"
                                            />
                                        </Box>
                                        <Box ml={4}>
                                            <Text
                                                fontWeight="bold"
                                                fontSize="14px"
                                                color={textColor}
                                                mb={6}
                                            >
                                                {/* {camera.deviceId}/{camera.dist_name} */}
      {/*{camera.dist_name}/{camera.accName}/{camera.ps_id}/{camera.deviceId}/

                                                {camera.locations && camera.locations.length > 0
                                                    ? (typeof camera.locations[0] === 'string'
                                                        ? camera.locations[0]
                                                        : (camera.locations[0] && camera.locations[0].loc_name)
                                                    )
                                                    : 'N/A'}



                                            </Text>
                                            <Text fontSize="12px" color={textColor} opacity={0.4}>
                                                {/* Snapshot:{" "}
                            {timestamp ? getTimeAgo(timestamp) : "N/A"} */}

      {/*</Text>
                                        </Box>
                                    </Flex>
                                </Box>
                            );
                        })}
                    </SimpleGrid>
                )
            ) : (
                <><NoCameraFound
                    title={"Cameras Available"}
                    description="It looks like you have not activated any Cameras yet"
                /></>
            )}
        </>
    )
}
*/}

      {camerasTab === "My Cameras" && (
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 3 }}
          spacing={6}
          mt={{ base: 3, md: 4 }}
          w="100%"
        >
          {/* Assuming 'cameras' is an array of camera objects you're mapping over */}
          {cameras.map((camera, id) => ( // Replace `[...Array(6)].map((_, id) => (` with `cameras.map((camera, id) => (`
            <Box
              key={id}
              borderRadius="8px"
              overflow="hidden"
              w="auto"
              flexShrink={0}
            >
              {/* Image Section */}
              <Box
                cursor="pointer"
                position="relative"
                w="100%"
                h={["200px", "242px"]}
                borderRadius="12px"
                overflow="hidden"
                onClick={() =>
                  handleCameraClick(camera.deviceId, camera.status)}
              >
                <Image
                  src="/images/video_placeholder.png" // You might want to use camera.lastImage here
                  alt="Camera Snapshot"
                  position="absolute"
                  top="0"
                  left="0"
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
                <Box
                  cursor={"pointer"}
                  position="relative"
                  w="100%"
                  onClick={() =>
                    handleCameraClick(camera.deviceId, camera.status)
                  }
                ></Box>

                {/* Status Indicator */}
                <Box
                  position="absolute"
                  top="2"
                  left="2"
                  bg="#95DA25" // You might want to use camera.status to determine color
                  borderRadius="full"
                  h="13px"
                  w="13px"
                  aria-label="Active status indicator"
                />

                {/* Play Icon */}
                <IconButton
                  bg="rgba(148, 163, 184, 0.43)"
                  aria-label="Play Video"
                  icon={<IoPlayCircleOutline size="30px" />}
                  variant="ghost"
                  position="absolute"
                  bottom="2"
                  left="2"
                  isRound
                  size="md"
                />
              </Box>

              {/* Details Section */}
              <Box p={2} bg={cardDetailsColor} mt="5px" borderRadius={"12px"}>
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="bold" fontSize="14px">
                      {camera.dist_name}/{camera.accName}/{camera.ps_id}/{camera.deviceId}/
                      {camera.locations && camera.locations.length > 0
                        ? (typeof camera.locations[0] === 'string'
                          ? camera.locations[0]
                          : (camera.locations[0] && camera.locations[0].loc_name)
                        )
                        : 'N/A'}
                    </Text>
                    {/* <Text fontSize="12px" color="white" opacity={0.4}>
                Snapshot: 2 mins ago
              </Text> */}
                  </Box>

                  {/* Menu */}
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      aria-label="More options"
                      icon={<BsThreeDotsVertical />}
                      variant="unstyled"
                      size="md"
                      mr="-10px"
                    />
                    <MenuList fontSize="12px" p="15px">
                      <MenuItem
                        _hover={{ bg: "custom.primary" }}
                        onClick={() =>
                          openSettingsModal(
                            "Camera Settings",
                            camera.deviceId,
                            camera.name,
                            camera.productType
                          )
                        }
                      >
                        Camera Setting
                      </MenuItem>
                      <MenuItem
                        _hover={{ bg: "custom.primary" }}
                        onClick={() =>
                          openShareAccessModal(
                            "Share Access",
                            camera.deviceId
                          )
                        }
                      >
                        View Sharing Access
                      </MenuItem>
                      <MenuItem
                        _hover={{ bg: "custom.primary" }}
                        onClick={() =>
                          openModal(
                            "Rename Device",
                            camera._id,
                            camera.name
                          )
                        }
                      >
                        Rename Device
                      </MenuItem>
                      <Divider my={1} w="90%" />
                      <MenuItem
                        _hover={{ bg: "custom.primary" }}
                        onClick={() =>
                          openShareModal(
                            "Share Camera",
                            camera.deviceId
                          )
                        }
                      >
                        Grant Access to Another
                      </MenuItem>
                      <Divider my={1} color="#F2E5FF" w="90%" />
                      <MenuItem
                        _hover={{ bg: "custom.primary" }}
                        color="red.500"
                        onClick={() => {
                          openRemoveCamera(
                            "removeUserCamera",
                            camera.deviceId
                          );
                        }}
                      >
                        Remove Camera
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}


      {camerasTab === "Shared Cameras" ? (
        sharedCameras.length > 0 ? (
          <>
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 2, lg: 3 }}
              spacing={6}
              mt={4}
              w="100%"
            >
              {sharedCameras.map((camera, index) => (
                <Box
                  key={index}
                  // mt={10}
                  // ml={["5", "10"]} // Responsive margin-left for different screen sizes
                  borderRadius="8px"
                  overflow="hidden"
                  // w={["100%", "340px"]} // Responsive width
                  w={"auto"} // Responsive width
                  flexShrink={0}
                // h={"100vh"}
                >
                  {/* Image Section */}
                  <Box
                    position="relative"
                    w="100%"
                    onClick={() =>
                      handleCameraClick(camera.deviceId, camera.status)
                    }
                  >
                    <Image
                      src="/images/CameraCard.png" // Replace with actual image source
                      alt="Camera Snapshot"
                      width="100%"
                      borderRadius="8px 8px 0 0"
                      height={["200px", "242px"]} // Responsive height
                      objectFit="cover"
                    />
                    {/* Status Indicator */}
                    <Box
                      position="absolute"
                      top="2"
                      right="2" // Changed 'left' to 'right'
                      bg={camera.status === "online" ? "#95DA25" : "#FF6262"}
                      borderRadius="full"
                      h="13px"
                      w="13px"
                      aria-label="Active status indicator"
                    />

                    {/* Play Icon */}
                    <IconButton
                      aria-label="Play Video"
                      icon={
                        <Image
                          src="./images/playIcon.svg" // Path to your play icon image in public folder
                          alt="Play Icon"
                          boxSize="35px" // Adjust size as needed
                        />
                      }
                      variant="ghost"
                      position="absolute"
                      bottom="2"
                      right="2"
                      isRound
                      size="md"
                    />
                  </Box>
                  <Box
                    cursor={"pointer"}
                    position="relative"
                    w="100%"
                    onClick={() =>
                      handleCameraClick(camera.deviceId, camera.status)
                    }
                  ></Box>

                  {/* Details Section */}
                  <Box p={2} bg={bgColor}>
                    <Flex justify="space-between" align="center">
                      {/* Text Container */}
                      <Box>
                        <Text
                          fontWeight="bold"
                          fontSize="14px"
                          color={textColor}
                        >
                          {camera.dist_name}/{camera.accName}/{camera.ps_id}/{camera.deviceId}/

                          {camera.locations && camera.locations.length > 0 ? camera.locations[0].loc_name : 'N/A'}
                        </Text>
                        <Text fontSize="12px" color="gray.600">
                          {camera.snapshot}
                        </Text>
                      </Box>

                      {/* Menu for More Options */}
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="More options"
                          icon={<BsThreeDotsVertical />}
                          variant="unstyled"
                          size="sm"
                        />
                        <MenuList fontSize="12px" p={"15px"}>
                          {/* <MenuItem _hover={{ bg: "custom.primary" }} onClick={() => openSettingsModal('Camera Settings', camera.deviceId, camera.name)}>
                          Camera Setting
                        </MenuItem>
                        <MenuItem _hover={{ bg: "custom.primary" }} onClick={() => openModal('Rename Device', camera._id, camera.name)}>
                          Rename Device
                        </MenuItem>
                        <MenuItem _hover={{ bg: "custom.primary" }}>
                          Pricing Plan
                        </MenuItem>

                        <Divider my={1} w={"90%"} />
                        <MenuItem _hover={{ bg: "custom.primary" }} onClick={() => openShareModal('Share Camera', camera.deviceId)}>
                          Grant Access to Another
                        </MenuItem>
                        <Divider my={1} color={"#F2E5FF"} w={"90%"} />{" "} */}
                          <MenuItem
                            _hover={{ bg: "custom.primary" }}
                            color={"red.500"}
                            onClick={() => {
                              openRemoveSharedCameraModal(
                                "removeSharedAccess",
                                camera.deviceId
                              );
                            }}
                          >
                            Remove Camera
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Flex>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </>
        ) : (
          <NoCameraFound
            title="Shared Camera Available"
            description="It looks like you haven't beem granted access to any camera Yet."
          />
        )
      ) : null}

      {/* Pagination */}
      <Flex justify="center" mt={6}>
        {page}/{totalPages}
      </Flex>
      <Flex justify="center" mt={2}>
        <Button
          onClick={handlePreviousPage}
          disabled={page === 1} // Disable if it's the first page
          mr={1}
        >
          Previous
        </Button>
        <Button
          onClick={handleNextPage}
          disabled={page === totalPages} // Disable if it's the last page
          ml={1}
        >
          Next
        </Button>
      </Flex>

      {/* Modal for Sharing Camera */}
      <Modal
        onClose={onClose}
        isOpen={isOpen && activeModal === "Share Camera"}
        isCentered
        size={"lg"}
      >
        <ModalOverlay />
        <ModalContent
          bg={useColorModeValue("white", theme.colors.custom.darkModeBg)}
          color={textColor}
        >
          <ModalHeader
            textAlign={"center"}
            p={1}
            mt={4}
            color={useColorModeValue(
              theme.colors.custom.lightModeText,
              theme.colors.custom.darkModeText
            )}
          >
            Share Camera
          </ModalHeader>
          <ModalBody pb={6} textAlign="center">
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              width="100%"
              //   padding="10px"
              p={1}
            >
              <FormControl width="350px" mt={5}>
                <FormLabel
                  htmlFor="device-name"
                  textAlign="start"
                  color={useColorModeValue(
                    theme.colors.custom.lightModeText,
                    theme.colors.custom.darkModeText
                  )}
                >
                  DeviceId:
                </FormLabel>
                <Input
                  id="device-name"
                  placeholder="Device Name"
                  borderColor="gray"
                  borderRadius="10px"
                  px={4}
                  _placeholder={{ color: "gray.400" }}
                  value={selectedDeviceId}
                  disabled
                  _focus={{
                    borderColor: theme.colors.custom.primary, // Custom purple border color on focus
                    boxShadow: `0 0 0 1px ${theme.colors.custom.primary}`, // Custom purple box shadow
                  }}
                />
              </FormControl>

              {/* Email of User */}
              <FormControl width="350px" mt={5}>
                <FormLabel
                  htmlFor="device-name"
                  textAlign="start"
                  color={useColorModeValue(
                    theme.colors.custom.lightModeText,
                    theme.colors.custom.darkModeText
                  )}
                >
                  Email Id:
                </FormLabel>
                <Input
                  id="device-name"
                  placeholder="Enter Email Id"
                  borderColor="gray"
                  borderRadius="10px"
                  px={4}
                  _placeholder={{ color: "gray.400" }}
                  type="email"
                  required
                  onChange={(e) => setShareEmail(e.target.value)}
                  _focus={{
                    borderColor: theme.colors.custom.primary, // Custom purple border color on focus
                    boxShadow: `0 0 0 1px ${theme.colors.custom.primary}`, // Custom purple box shadow
                  }}
                />
              </FormControl>
            </Box>
          </ModalBody>

          <ModalFooter marginRight={"10px"} justifyContent={"space-evenly"}>
            <Button
              onClick={closeModal}
              w="150px"
              border="1px"
              background="0"
              color="red.500"
              borderColor="red.500"
              _hover={{ background: "none" }}
            >
              Cancel
            </Button>

            <Button
              onClick={() => handleShareCamera()}
              w="150px"
              background={useColorModeValue(
                theme.colors.custom.primary,
                theme.colors.custom.darkModePrimary
              )}
              color={useColorModeValue(
                theme.colors.custom.lightModeText,
                theme.colors.custom.darkModeText
              )}
              fontWeight={"normal"}
              _hover={{
                backgroundColor: useColorModeValue(
                  theme.colors.custom.darkModePrimary,
                  theme.colors.custom.primary
                ),
                color: useColorModeValue(
                  theme.colors.custom.darkModeText,
                  theme.colors.custom.lightModeText
                ),
              }}
            >
              Share Camera
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for Managing Sharing Access */}
      <Modal
        onClose={onClose}
        isOpen={isOpen && activeModal === "Share Access"}
        isCentered
        size={"lg"}
      >
        <ModalOverlay />
        <ModalContent
          bg={useColorModeValue("white", theme.colors.custom.darkModeBg)}
        >
          <ModalHeader textAlign={"center"} p={1} mt={4}>
            View Shared Access
          </ModalHeader>
          <ModalBody textAlign="center">
            {/* <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              width="100%"
              //   padding="10px"
              p={1}
            > */}
            {/* <Flex alignItems="center" justifyContent="space-between" mb={4}> */}
            ,
            {sharedEmails.length === 0 ? (
              <Text>Seems you've not shared cameras yet...</Text>
            ) : (
              sharedEmails.map((email, index) => (
                <Flex
                  key={index}
                  alignItems="center"
                  justifyContent="space-between"
                  mb={4}
                >
                  <Text>{email}</Text>
                  <Button
                    color="red.500"
                    variant={"outline"}
                    onClick={() => {
                      openRemoveAdminShareModal(
                        "removeSharedAccess",
                        selectedDeviceId,
                        email
                      );
                    }}
                  >
                    Remove
                  </Button>
                </Flex>
              ))
            )}
            {/* <Text>Camera model</Text>
              <Text>Remove</Text> */}
            {/* </Flex> */}
            {/* </Box> */}
          </ModalBody>
          <Divider />
          <ModalFooter marginRight={"10px"} justifyContent={"space-evenly"}>
            <Button
              onClick={closeModal}
              w="150px"
              border="1px"
              background="0"
              color="red.500"
              borderColor="red.500"
              _hover={{ background: "none" }}
            >
              Cancel
            </Button>

            {/* <Button
              w="150px"
              background={useColorModeValue(
                theme.colors.custom.primary,
                theme.colors.custom.darkModePrimary
              )}
              color={useColorModeValue(
                theme.colors.custom.lightModeText,
                theme.colors.custom.darkModeText
              )}
              fontWeight={"normal"}
              _hover={{
                backgroundColor: useColorModeValue(
                  theme.colors.custom.darkModePrimary,
                  theme.colors.custom.primary
                ),
                color: useColorModeValue(
                  theme.colors.custom.darkModeText,
                  theme.colors.custom.lightModeText
                ),
              }}
            >
              Save Camera
            </Button> */}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for Rename Device */}
      <Modal
        onClose={onClose}
        isOpen={isOpen && activeModal === "Rename Device"}
        isCentered
        size={"lg"}
      >
        <ModalOverlay />
        <ModalContent
          bg={useColorModeValue("white", theme.colors.custom.darkModeBg)}
          color={textColor}
        >
          <ModalHeader
            textAlign={"center"}
            p={1}
            mt={4}
            color={useColorModeValue(
              theme.colors.custom.lightModeText,
              theme.colors.custom.darkModeText
            )}
          >
            Rename Device
          </ModalHeader>
          <ModalBody pb={6} textAlign="center">
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              width="100%"
              //   padding="10px"
              p={1}
            >
              <FormControl width="350px" mt={5}>
                <FormLabel
                  htmlFor="device-name"
                  textAlign="start"
                  color={useColorModeValue(
                    theme.colors.custom.lightModeText,
                    theme.colors.custom.darkModeText
                  )}
                >
                  Enter Device Name:
                </FormLabel>
                <Input
                  id="device-name"
                  placeholder="Device Name"
                  borderColor="gray"
                  borderRadius="10px"
                  px={4}
                  _placeholder={{ color: "gray.400" }}
                  value={selectedCameraName}
                  onChange={(e) => setSelectedCameraName(e.target.value)}
                  _focus={{
                    borderColor: theme.colors.custom.primary, // Custom purple border color on focus
                    boxShadow: `0 0 0 1px ${theme.colors.custom.primary}`, // Custom purple box shadow
                  }}
                />
              </FormControl>
            </Box>
          </ModalBody>

          <ModalFooter marginRight={"10px"} justifyContent={"space-evenly"}>
            <Button
              onClick={closeModal}
              w="150px"
              border="1px"
              background="0"
              color="red.500"
              borderColor="red.500"
              _hover={{ background: "none" }}
            >
              Cancel
            </Button>

            <Button
              onClick={() => handleUpdateCameraName(selectedCameraName)}
              w="150px"
              background={useColorModeValue(
                theme.colors.custom.primary,
                theme.colors.custom.darkModePrimary
              )}
              color={useColorModeValue(
                theme.colors.custom.lightModeText,
                theme.colors.custom.darkModeText
              )}
              fontWeight={"normal"}
              _hover={{
                backgroundColor: useColorModeValue(
                  theme.colors.custom.darkModePrimary,
                  theme.colors.custom.primary
                ),
                color: useColorModeValue(
                  theme.colors.custom.darkModeText,
                  theme.colors.custom.lightModeText
                ),
              }}
            >
              Save Device
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for Camera Settings */}
      <Modal
        onClose={closeModal}
        isOpen={isOpen && activeModal === "Camera Settings"}
        isCentered
        size={"3xl"}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Camera Settings</ModalHeader>

          {/* Modal Body */}
          <ModalBody>
            {/* Tabs */}
            <Tabs
              variant="unstyled"
              mb={6}
              onChange={(index) =>
                setActiveTab(
                  [
                    "General",
                    "Media",
                    "AI Settings",
                    "Wifi Settings",
                    "System",
                  ][index]
                )
              }
            >
              <TabList>
                <Tab
                  _selected={{
                    fontWeight: "bold",
                    borderBottom: "4px solid",
                    borderColor: useColorModeValue(
                      theme.colors.custom.primary,
                      theme.colors.custom.darkModeText
                    ),
                  }}
                >
                  General
                </Tab>
                <Tab
                  _selected={{
                    fontWeight: "bold",
                    borderBottom: "4px solid",
                    borderColor: useColorModeValue(
                      theme.colors.custom.primary,
                      theme.colors.custom.darkModeText
                    ),
                  }}
                >
                  Media
                </Tab>
                <Tab
                  _selected={{
                    fontWeight: "bold",
                    borderBottom: "4px solid",
                    borderColor: useColorModeValue(
                      theme.colors.custom.primary,
                      theme.colors.custom.darkModeText
                    ),
                  }}
                >
                  AI Settings
                </Tab>
                {selectedCameraType === "Wifi-S-Series" && (
                  <Tab
                    _selected={{
                      fontWeight: "bold",
                      borderBottom: "4px solid",
                      borderColor: saveButtonBackgroundColor,
                    }}
                  >
                    Wifi Settings
                  </Tab>
                )}
              </TabList>
            </Tabs>

            {/* Conditional Content Based on Active Tab */}
            {activeTab === "General" && (
              <>
                {selectedCameraType &&
                  selectedCameraType.includes("S-Series") && (
                    <>
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb={4}
                      >
                        <Text>AI Notifications</Text>
                        <Switch
                          isChecked={aiEnabled}
                          onChange={() => setAiEnabled(!aiEnabled)}
                          size="md"
                        />
                      </Flex>
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb={4}
                      >
                        <Text>Human Tracking</Text>
                        <Switch
                          isChecked={humanTracking}
                          onChange={() => setHumanTracking(!humanTracking)}
                          size="md"
                        />
                      </Flex>
                    </>
                  )}

                <Flex justifyContent="space-between" alignItems="center" mb={4}>
                  <Text>Audio</Text>
                  <Switch
                    isChecked={audio}
                    onChange={() => setAudio(!audio)}
                    size="md"
                  />
                </Flex>

                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text>Camera name</Text>
                  <Input
                    disabled
                    defaultValue={selectedCameraName}
                    size="sm"
                    maxW="60%"
                  />
                </Flex>

                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text>Camera model</Text>
                  <Text fontWeight="bold">{selectedCameraType}</Text>
                </Flex>

                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text>Device ID</Text>
                  <Text fontWeight="bold">{selectedDeviceId}</Text>
                </Flex>

                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text>Firmware</Text>
                  <Text fontWeight="bold">V12.98630</Text>
                </Flex>



                <Flex alignItems="center" justifyContent="space-between">
                  <Text>Quality</Text>
                  {/* <Flex maxW="60%" alignItems="center"> */}
                  <Select
                    disabled={enablesmartQuality}
                    value={quality}
                    onChange={(e) => handleQualityChange(e.target.value)}
                    size="sm"
                    maxW="60%"
                  >
                    <option value="verylow">Very Low</option>
                    <option value="low">Low</option>
                    <option value="mid">Medium</option>
                    <option value="high">High</option>
                    <option value="veryhigh">Very High</option>
                  </Select>
                  {qualityLoading && <Spinner size="sm" ml={0} />}{" "}
                  {/* Loader next to the input */}
                  {/* </Flex> */}
                </Flex>
                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text>Cruise Mode</Text>
                  {/* <Flex maxW="60%" alignItems="center"> */}
                  <Select
                    value={cruiseMode}
                    onChange={(e) => setCruiseMode(e.target.value)}
                    size="sm"
                    maxW="60%"
                  >
                    <option value="cruise_stop">None</option>
                    <option value="cruise_preset">Preset</option>
                    <option value="cruise_allround">All Round</option>
                  </Select>
                  {qualityLoading && <Spinner size="sm" ml={0} />}{" "}
                  {/* Loader next to the input */}
                  {/* </Flex> */}
                </Flex>

                {/* <Divider mb={4} />

                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text>Time Zone</Text>
                  <Select
                    value={timeZoneOffset}
                    onChange={handleTimeZoneChange}
                    size="sm"
                    maxW="60%"
                  >
                    {[
                      "-12:00",
                      "-11:00",
                      "-10:00",
                      "-09:00",
                      "-08:00",
                      "-07:00",
                      "-06:00",
                      "-05:00",
                      "-04:00",
                      "-03:00",
                      "-02:00",
                      "-01:00",
                      "+00:00",
                      "+01:00",
                      "+02:00",
                      "+03:00",
                      "+04:00",
                      "+05:00",
                      "+05:30",
                      "+06:00",
                      "+07:00",
                      "+08:00",
                      "+09:00",
                      "+10:00",
                      "+11:00",
                      "+12:00",
                    ].map((tz) => (
                      <option key={tz} value={tz}>{`GMT ${tz}`}</option>
                    ))}
                  </Select>
                </Flex> */}

                <Divider mb={2} />

                <Flex w="full" justifyContent="space-between">
                  {/* <Button colorScheme="red" variant="outline" size="sm">
                Set to Default
              </Button> */}
                  <Button
                    p={0}
                    colorScheme="red"
                    variant="ghost"
                    textDecoration={"underline"}
                    size="sm"
                    onClick={() => handleRebootCamera()}
                  >
                    Reboot Camera
                  </Button>
                  <IconButton
                    colorScheme="red"
                    aria-label="Info"
                    icon={<InfoIcon />}
                    size="sm"
                    variant="ghost"
                  />
                  <Spacer />
                  <Button
                    variant="outline"
                    size="sm"
                    mr={2}
                    onClick={closeModal}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    background={saveButtonBackgroundColor}
                    color={saveButtonColor}
                    fontWeight={"normal"}
                    _hover={{
                      backgroundColor: saveButtonHoverBackgroundColor,
                      color: saveButtonHoverColor,
                    }}
                    onClick={() => handleGeneralSettings()}
                  >
                    Save
                  </Button>
                </Flex>
              </>
            )}

            {/* Media Tab Content */}
            {activeTab === "Media" && (
              <Box>
                {/* <Text mb={4} fontWeight="bold">Media Settings</Text> */}

                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text>IR Mode</Text>
                  <Select
                    value={irCutMode}
                    onChange={(e) => setIrCutMode(e.target.value)}
                    size="sm"
                    maxW="60%"
                  >
                    <option value="auto">IrLedMode</option>
                    <option value="light">Light Mode</option>
                    <option value="smart">Smart Mode</option>
                    <option value="daylight">Daylight Mode</option>
                    <option value="night">Night Mode</option>
                  </Select>
                  {/* <IconButton aria-label="Info" icon={<InfoIcon />} size="xs" variant="ghost" /> */}
                </Flex>

                {/* Brightness Slider */}
                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text flex="1">Brightness</Text>
                  <Box flex="1" mx={4}>
                    <Slider
                      value={brightness}
                      onChange={(val) => setBrightness(val)}
                      min={0}
                      max={100}
                      step={1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Box>
                  <Text>{brightness}%</Text>
                </Flex>

                {/* Contrast Slider */}
                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text flex="1">Contrast</Text>
                  <Box flex="1" mx={4}>
                    <Slider
                      value={contrast}
                      onChange={(val) => setContrast(val)}
                      min={0}
                      max={100}
                      step={1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Box>
                  <Text>{contrast}%</Text>
                </Flex>

                {/* Saturation Slider */}
                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text flex="1">Saturation</Text>
                  <Box flex="1" mx={4}>
                    <Slider
                      value={saturation}
                      onChange={(val) => setSaturation(val)}
                      min={0}
                      max={100}
                      step={1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Box>
                  <Text>{saturation}%</Text>
                </Flex>

                {/* Hue Slider */}
                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text flex="1">Hue</Text>
                  <Box flex="1" mx={4}>
                    <Slider
                      value={hue}
                      onChange={(val) => setHue(val)}
                      min={0}
                      max={100}
                      step={1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Box>
                  <Text>{hue}%</Text>
                </Flex>

                {/* Sharpness Slider */}
                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text flex="1">Sharpness</Text>
                  <Box flex="1" mx={4}>
                    <Slider
                      value={sharpness}
                      onChange={(val) => setSharpness(val)}
                      min={0}
                      max={100}
                      step={1}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Box>
                  <Text>{sharpness}%</Text>
                </Flex>

                {/* Flip Check box */}
                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text flex="1">Flip</Text>
                  <Switch
                    size="sm"
                    isChecked={flip}
                    onChange={() => setFlip(!flip)}
                  />
                </Flex>

                {/* Mirror Check box */}
                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text flex="1">Mirror</Text>
                  <Switch
                    size="sm"
                    isChecked={mirror}
                    onChange={() => setMirror(!mirror)}
                  />
                </Flex>

                {/* <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text>Media Quality</Text>
                  <Input placeholder="Enter media quality" size="sm" maxW="60%" />
                </Flex> */}

                <Divider mb={2} />

                <Flex w="full" justifyContent="space-between">
                  <Button
                    p={0}
                    colorScheme="red"
                    variant="ghost"
                    textDecoration={"underline"}
                    size="sm"
                    onClick={() => handleRebootCamera()}
                  >
                    Reboot Camera
                  </Button>
                  <IconButton
                    colorScheme="red"
                    aria-label="Info"
                    icon={<InfoIcon />}
                    size="sm"
                    variant="ghost"
                  />
                  <Spacer />
                  <Button
                    variant="outline"
                    size="sm"
                    mr={2}
                    onClick={closeModal}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    background={saveButtonBackgroundColor}
                    color={saveButtonColor}
                    fontWeight={"normal"}
                    _hover={{
                      backgroundColor: saveButtonHoverBackgroundColor,
                      color: saveButtonHoverColor,
                    }}
                    onClick={() => handleMediaSettings()}
                  >
                    Save
                  </Button>
                </Flex>
              </Box>
            )}

            {activeTab === "AI Settings" && (
              <Box>
                {/* Dropdown for Motion Detection */}
                <Box>
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    // color={theme.colors.custom.primary}
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "Motion Detection"
                          ? null
                          : "Motion Detection"
                      )
                    }
                    cursor="pointer"
                    mb={4}
                  >
                    <Text>Motion Detection</Text>
                    <Icon
                      as={
                        activeDropdown === "Motion Detection"
                          ? ChevronUpIcon
                          : ChevronDownIcon
                      }
                    />
                  </Flex>
                  {activeDropdown === "Motion Detection" && (
                    <Box pl={4} pb={4}>
                      {/* Grid for Switches */}
                      <Grid
                        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                        gap={4}
                        mb={4}
                      >
                        <Flex
                          width={{ base: "auto", md: "260px" }}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text>Enable</Text>
                          <Switch
                            isChecked={motionEnabled}
                            onChange={() => setMotionEnabled(!motionEnabled)}
                            size="md"
                          />
                        </Flex>
                        <Flex
                          width={{ base: "auto", md: "260px" }}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text>Alarm Sound</Text>
                          <Switch
                            isChecked={motionAudioAlert}
                            onChange={() =>
                              setMotionAudioAlert(!motionAudioAlert)
                            }
                            size="md"
                          />
                        </Flex>
                        <Flex
                          width={{ base: "auto", md: "260px" }}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text>Light Alert</Text>
                          <Switch
                            isChecked={motionLightAlert}
                            onChange={() =>
                              setMotionLightAlert(!motionLightAlert)
                            }
                            size="md"
                          />
                        </Flex>
                        {/* <Flex width={{ base: 'auto', md: '260px' }} justifyContent="space-between" alignItems="center">
                          <Text>App Notification</Text>
                          <Switch size="md" />
                        </Flex> */}
                      </Grid>

                      {/* Slider for Brightness */}
                      <Flex
                        alignItems="center"
                        justifyContent="space-between"
                        mb={4}
                      >
                        <Text flex="1">Sensitivity Level</Text>
                        <Box flex="1" mx={4}>
                          <Slider
                            value={motionSensitivity}
                            onChange={(val) => setMotionSensitivity(val)}
                            min={0}
                            max={100}
                            step={1}
                          >
                            <SliderTrack>
                              <SliderFilledTrack />
                            </SliderTrack>
                            <SliderThumb />
                          </Slider>
                        </Box>
                        <Text>{motionSensitivity}%</Text>
                      </Flex>
                    </Box>
                  )}
                </Box>

                {/* Dropdown for Human Detection */}
                <Box>
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    // color={theme.colors.custom.primary}
                    onClick={() =>
                      setActiveDropdown(
                        activeDropdown === "Human Detection"
                          ? null
                          : "Human Detection"
                      )
                    }
                    cursor="pointer"
                    mb={4}
                  >
                    <Text>Human Detection</Text>
                    <Icon
                      as={
                        activeDropdown === "Human Detection"
                          ? ChevronUpIcon
                          : ChevronDownIcon
                      }
                    />
                  </Flex>
                  {activeDropdown === "Human Detection" && (
                    <Box pl={4} pb={4}>
                      <Grid
                        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                        gap={4}
                        mb={4}
                      >
                        <Flex
                          width={{ base: "auto", md: "260px" }}
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text>Enable</Text>
                          <Switch
                            isChecked={humanEnabled}
                            onChange={() => setHumanEnabled(!humanEnabled)}
                            size="md"
                          />
                        </Flex>
                        {selectedCameraType &&
                          selectedCameraType.includes("S-Series") && (
                            <>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Text>Alarm Alert</Text>
                                <Switch
                                  isChecked={humanAudioAlert}
                                  onChange={() =>
                                    setHumanAudioAlert(!humanAudioAlert)
                                  }
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Text>Light Alert</Text>
                                <Switch
                                  isChecked={humanLightAlert}
                                  onChange={() =>
                                    setHumanLightAlert(!humanLightAlert)
                                  }
                                  size="md"
                                />
                              </Flex>
                              {/* <Flex
                              width={{ base: "auto", md: "260px" }}
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text>App Notification</Text>
                              <Switch size="md" />
                            </Flex> */}
                              {/* <Flex width={{ base: 'auto', md: '260px' }} justifyContent="space-between" alignItems="center">
                          <Text>RTMP Push</Text>
                          <Switch size="md" />
                        </Flex>
                        <Flex width={{ base: 'auto', md: '260px' }} justifyContent="space-between" alignItems="center">
                          <Text>FTP Push</Text>
                          <Switch size="md" />
                        </Flex> */}
                              {/* <Flex
                              width={{ base: "auto", md: "260px" }}
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text>Detection Box</Text>
                              <Switch size="md" />
                            </Flex> */}
                            </>
                          )}
                      </Grid>
                      {selectedCameraType &&
                        selectedCameraType.includes("S-Series") ? (
                        <Flex
                          alignItems="center"
                          justifyContent="space-between"
                          mb={4}
                        >
                          <Text flex="1">Sensitivity Level</Text>
                          <Box flex="1" mx={4} position="relative">
                            <Slider
                              value={humanSensitivity}
                              onChange={(val) => setHumanSensitivity(val)}
                              min={0}
                              max={10}
                              step={2} // Makes the slider snap to 0, 20, 40, 60, 80, 100
                            >
                              <SliderTrack>
                                <SliderFilledTrack />
                              </SliderTrack>
                              <SliderThumb />
                            </Slider>
                            {/* Custom labels for slider points */}
                            {/* <Flex justifyContent="space-between" mt={2} position="absolute" width="100%">
                            {[0, 20, 40, 60, 80, 100].map((point) => (
                              <Text key={point} fontSize="sm" textAlign="center" width="25px">
                                {point}
                              </Text>
                            ))}
                          </Flex> */}
                          </Box>
                          <Text>{humanSensitivity}</Text>
                        </Flex>
                      ) : (
                        <Flex
                          alignItems="center"
                          justifyContent="space-between"
                          mb={4}
                        >
                          <Text>Sensitivity Level</Text>
                          <Select
                            value={humanSensitivityLevel}
                            onChange={(e) =>
                              setHumanSensitivityLevel(e.target.value)
                            }
                            size="sm"
                            maxW="60%"
                          >
                            <option value="lowest">Lowest</option>
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="highest">Highest</option>
                          </Select>
                          {/* <IconButton aria-label="Info" icon={<InfoIcon />} size="xs" variant="ghost" /> */}
                        </Flex>
                      )}
                    </Box>
                  )}
                </Box>

                {selectedCameraType &&
                  selectedCameraType.includes("S-Series") && (
                    <>
                      {/* Dropdown for Face Detection */}
                      <Box>
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                          // color={theme.colors.custom.primary}
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "Face Detection"
                                ? null
                                : "Face Detection"
                            )
                          }
                          cursor="pointer"
                          mb={4}
                        >
                          <Text>Face Detection</Text>
                          <Icon
                            as={
                              activeDropdown === "Face Detection"
                                ? ChevronUpIcon
                                : ChevronDownIcon
                            }
                          />
                        </Flex>
                        {activeDropdown === "Face Detection" && (
                          <Box pl={4} pb={4}>
                            <Grid
                              templateColumns={{
                                base: "1fr",
                                md: "repeat(2, 1fr)",
                              }}
                            // gap={4}
                            // mb={4}
                            >
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Enable Face Detection</Text>
                                <Switch
                                  isChecked={faceEnabled}
                                  onChange={() => setFaceEnabled(!faceEnabled)}
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Audio Alert</Text>
                                <Switch
                                  isChecked={audioAlert}
                                  onChange={() => setAudioAlert(!audioAlert)}
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Light Alert</Text>
                                <Switch
                                  isChecked={lightAlert}
                                  onChange={() => setLightAlert(!lightAlert)}
                                  size="md"
                                />
                              </Flex>
                            </Grid>
                            <Flex
                              alignItems="center"
                              justifyContent="space-between"
                              mb={4}
                            >
                              <Text flex="1">Sensitivity Level</Text>
                              <Box flex="1" mx={4}>
                                <Slider
                                  value={faceSensitivity}
                                  onChange={(val) => setFaceSensitivity(val)}
                                  min={0}
                                  max={10}
                                  step={1}
                                >
                                  <SliderTrack>
                                    <SliderFilledTrack />
                                  </SliderTrack>
                                  <SliderThumb />
                                </Slider>
                              </Box>
                              <Text>{faceSensitivity}</Text>
                            </Flex>
                            {/* Add additional controls here */}
                          </Box>
                        )}
                      </Box>

                      {/* Dropdown for Line Crossing Detection */}
                      <Box>
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                          // color={theme.colors.custom.primary}
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "Line Crossing Detection"
                                ? null
                                : "Line Crossing Detection"
                            )
                          }
                          cursor="pointer"
                          mb={4}
                        >
                          <Text>Line Crossing Detection</Text>
                          <Icon
                            as={
                              activeDropdown === "Line Crossing Detection"
                                ? ChevronUpIcon
                                : ChevronDownIcon
                            }
                          />
                        </Flex>
                        {activeDropdown === "Line Crossing Detection" && (
                          <Box pl={4} pb={4}>
                            <Grid
                              templateColumns={{
                                base: "1fr",
                                md: "repeat(2, 1fr)",
                              }}
                            // gap={4}
                            // mb={4}
                            >
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Line Crossing Detection</Text>
                                <Switch
                                  isChecked={lineCrossEnabled}
                                  onChange={() =>
                                    setLineCrossEnabled(!lineCrossEnabled)
                                  }
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Alarm Alert</Text>
                                <Switch
                                  isChecked={lineCrossAudioAlert}
                                  onChange={() =>
                                    setLineCrossAudioAlert(!lineCrossAudioAlert)
                                  }
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Light Alert</Text>
                                <Switch
                                  isChecked={lineCrossLightAlert}
                                  onChange={() =>
                                    setLineCrossLightAlert(!lineCrossLightAlert)
                                  }
                                  size="md"
                                />
                              </Flex>
                            </Grid>
                            {/* <Flex
                            alignItems="center"
                            justifyContent="space-between"
                            mb={4}
                          >
                            <Text flex="1">Sensitivity Level</Text>
                            <Box flex="1" mx={4}>
                              <Slider
                                value={lineCrossSensitivity}
                                onChange={(val) => setLineCrossSensitivity(val)}
                                min={0}
                                max={100}
                                step={1}
                              >
                                <SliderTrack>
                                  <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                              </Slider>
                            </Box>
                            <Text>{lineCrossSensitivity}</Text>
                          </Flex> */}
                            <Flex
                              width={{ base: "auto", md: "260px" }}
                              justifyContent="space-between"
                              alignItems="center"
                              mb={4}
                            >
                              <Button onClick={openCanvasModal}>
                                Open Canvas
                              </Button>
                            </Flex>
                          </Box>
                        )}
                      </Box>

                      <LineCrossCanvas
                        isOpen={isCanvasModalOpen}
                        onClose={closeCanvasModal}
                        onCanvasData={handleCanvasData}
                        existingCoordinates={detectLine}
                        existingDirection={direction}
                        deviceId={selectedDeviceId}
                      />

                      {/* Dropdown for Traffic/Customer Statistics */}
                      <Box>
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                          // color={theme.colors.custom.primary}
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "Traffic Detection"
                                ? null
                                : "Traffic Detection"
                            )
                          }
                          cursor="pointer"
                          mb={4}
                        >
                          <Text>Traffic Detection</Text>
                          <Icon
                            as={
                              activeDropdown === "Traffic Detection"
                                ? ChevronUpIcon
                                : ChevronDownIcon
                            }
                          />
                        </Flex>
                        {activeDropdown === "Traffic Detection" && (
                          <Box pl={4} pb={4}>
                            <Grid
                              templateColumns={{
                                base: "1fr",
                                md: "repeat(2, 1fr)",
                              }}
                            // gap={4}
                            // mb={4}
                            >
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Traffic Detection</Text>
                                <Switch
                                  isChecked={trafficEnabled}
                                  onChange={() =>
                                    setTrafficEnabled(!trafficEnabled)
                                  }
                                  size="md"
                                />
                              </Flex>
                              {/* <Flex width={{ base: 'auto', md: '260px' }} justifyContent="space-between" alignItems="center" mb={4}>
                          <Text>Audio Alert</Text>
                          <Switch isChecked={audioAlert} onChange={() => setAudioAlert(!audioAlert)} size="md" />
                        </Flex> */}
                            </Grid>
                            <Flex
                              width={{ base: "auto", md: "260px" }}
                              justifyContent="space-between"
                              alignItems="center"
                              mb={4}
                            >
                              <Button onClick={openTrafficModal}>
                                Open Canvas
                              </Button>
                            </Flex>
                          </Box>
                        )}
                      </Box>

                      <CustomerCanvas
                        isOpen={isTrafficModalOpen}
                        onClose={closeTrafficModal}
                        onCanvasData={handleTrafficData}
                        existingCoordinates={detectTraffic}
                        existingDirection={trafficDirection}
                        deviceId={selectedDeviceId}
                      />

                      {/* Dropdown for Unattended Luggage Detection */}
                      <Box>
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                          // color={theme.colors.custom.primary}
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "Unattended Object"
                                ? null
                                : "Unattended Object"
                            )
                          }
                          cursor="pointer"
                          mb={4}
                        >
                          <Text>Unattended Object</Text>
                          <Icon
                            as={
                              activeDropdown === "Unattended Object"
                                ? ChevronUpIcon
                                : ChevronDownIcon
                            }
                          />
                        </Flex>
                        {activeDropdown === "Unattended Object" && (
                          <Box pl={4} pb={4}>
                            <Grid
                              templateColumns={{
                                base: "1fr",
                                md: "repeat(2, 1fr)",
                              }}
                            // gap={4}
                            // mb={4}
                            >
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Unattended Object Detection</Text>
                                <Switch
                                  isChecked={unattendedEnabled}
                                  onChange={() =>
                                    setUnattendedEnabled(!unattendedEnabled)
                                  }
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Alarm Alert</Text>
                                <Switch
                                  isChecked={unattendedAudioAlert}
                                  onChange={() =>
                                    setUnattendedAudioAlert(
                                      !unattendedAudioAlert
                                    )
                                  }
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Light Alert</Text>
                                <Switch
                                  isChecked={unattendedLightAlert}
                                  onChange={() =>
                                    setUnattendedLightAlert(
                                      !unattendedLightAlert
                                    )
                                  }
                                  size="md"
                                />
                              </Flex>
                            </Grid>
                            <Flex
                              alignItems="center"
                              justifyContent="space-between"
                              mb={4}
                            >
                              <Text flex="1">Min. Duration</Text>
                              <Box flex="1" mx={4}>
                                <Slider
                                  value={unattendedDuration}
                                  onChange={(val) => setUnattendedDuration(val)}
                                  min={0}
                                  max={60}
                                  step={1}
                                >
                                  <SliderTrack>
                                    <SliderFilledTrack />
                                  </SliderTrack>
                                  <SliderThumb />
                                </Slider>
                              </Box>
                              <Text>{unattendedDuration}s</Text>
                            </Flex>
                            <Flex
                              alignItems="center"
                              justifyContent="space-between"
                              mb={4}
                            >
                              <Text flex="1">Sensitivity Level</Text>
                              <Box flex="1" mx={4}>
                                <Slider
                                  value={unattendedSensitivity}
                                  onChange={(val) =>
                                    setUnattendedSensitivity(val)
                                  }
                                  min={0}
                                  max={10}
                                  step={1}
                                >
                                  <SliderTrack>
                                    <SliderFilledTrack />
                                  </SliderTrack>
                                  <SliderThumb />
                                </Slider>
                              </Box>
                              <Text>{unattendedSensitivity}</Text>
                            </Flex>
                            <Flex
                              width={{ base: "auto", md: "260px" }}
                              justifyContent="space-between"
                              alignItems="center"
                              mb={4}
                            >
                              <Button onClick={openUnattendedModal}>
                                Open Canvas
                              </Button>
                            </Flex>
                          </Box>
                        )}
                      </Box>

                      <UAOCanvas
                        isOpen={isUnattendedModalOpen}
                        onClose={closeUnattendedModal}
                        onCanvasData={handleUnattendedData}
                        existingCoordinates={detectUnattended}
                        deviceId={selectedDeviceId}
                      />

                      {/* Dropdown for Missing Object */}
                      <Box>
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                          // color={theme.colors.custom.primary}
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "Missing Object"
                                ? null
                                : "Missing Object"
                            )
                          }
                          cursor="pointer"
                          mb={4}
                        >
                          <Text>Missing Object</Text>
                          <Icon
                            as={
                              activeDropdown === "Missing Object"
                                ? ChevronUpIcon
                                : ChevronDownIcon
                            }
                          />
                        </Flex>
                        {activeDropdown === "Missing Object" && (
                          <Box pl={4} pb={4}>
                            <Grid
                              templateColumns={{
                                base: "1fr",
                                md: "repeat(2, 1fr)",
                              }}
                            // gap={4}
                            // mb={4}
                            >
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Missing Object Detection</Text>
                                <Switch
                                  isChecked={missingEnabled}
                                  onChange={() =>
                                    setMissingEnabled(!missingEnabled)
                                  }
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Alarm Alert</Text>
                                <Switch
                                  isChecked={missingAudioAlert}
                                  onChange={() =>
                                    setMissingAudioAlert(!missingAudioAlert)
                                  }
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Light Alert</Text>
                                <Switch
                                  isChecked={missingLightAlert}
                                  onChange={() =>
                                    setMissingLightAlert(!missingLightAlert)
                                  }
                                  size="md"
                                />
                              </Flex>
                            </Grid>
                            <Flex
                              alignItems="center"
                              justifyContent="space-between"
                              mb={4}
                            >
                              <Text flex="1">Min. Duration</Text>
                              <Box flex="1" mx={4}>
                                <Slider
                                  value={missingDuration}
                                  onChange={(val) => setMissingDuration(val)}
                                  min={0}
                                  max={60}
                                  step={1}
                                >
                                  <SliderTrack>
                                    <SliderFilledTrack />
                                  </SliderTrack>
                                  <SliderThumb />
                                </Slider>
                              </Box>
                              <Text>{missingDuration}s</Text>
                            </Flex>
                            <Flex
                              alignItems="center"
                              justifyContent="space-between"
                              mb={4}
                            >
                              <Text flex="1">Sensitivity Level</Text>
                              <Box flex="1" mx={4}>
                                <Slider
                                  value={missingSensitivity}
                                  onChange={(val) => setMissingSensitivity(val)}
                                  min={0}
                                  max={10}
                                  step={1}
                                >
                                  <SliderTrack>
                                    <SliderFilledTrack />
                                  </SliderTrack>
                                  <SliderThumb />
                                </Slider>
                              </Box>
                              <Text>{missingSensitivity}</Text>
                            </Flex>
                            <Flex
                              width={{ base: "auto", md: "260px" }}
                              justifyContent="space-between"
                              alignItems="center"
                              mb={4}
                            >
                              <Button onClick={openMissingModal}>
                                Open Canvas
                              </Button>
                            </Flex>
                          </Box>
                        )}
                      </Box>
                      <MODCanvas
                        isOpen={isMissingModalOpen}
                        onClose={closeMissingModal}
                        onCanvasData={handleMissingData}
                        existingCoordinates={detectMissing}
                        deviceId={selectedDeviceId}
                      />

                      {/* Dropdown for Area Detection */}
                      <Box>
                        <Flex
                          justifyContent="space-between"
                          alignItems="center"
                          // color={theme.colors.custom.primary}
                          onClick={() =>
                            setActiveDropdown(
                              activeDropdown === "Area Detection"
                                ? null
                                : "Area Detection"
                            )
                          }
                          cursor="pointer"
                          mb={4}
                        >
                          <Text>Area Detection</Text>
                          <Icon
                            as={
                              activeDropdown === "Area Detection"
                                ? ChevronUpIcon
                                : ChevronDownIcon
                            }
                          />
                        </Flex>
                        {activeDropdown === "Area Detection" && (
                          <Box pl={4} pb={4}>
                            <Grid
                              templateColumns={{
                                base: "1fr",
                                md: "repeat(2, 1fr)",
                              }}
                            >
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Area Detection</Text>
                                <Switch
                                  isChecked={areaEnabled}
                                  onChange={() => setAreaEnabled(!areaEnabled)}
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Alarm Alert</Text>
                                <Switch
                                  isChecked={areaAudioAlert}
                                  onChange={() =>
                                    setAreaAudioAlert(!areaAudioAlert)
                                  }
                                  size="md"
                                />
                              </Flex>
                              <Flex
                                width={{ base: "auto", md: "260px" }}
                                justifyContent="space-between"
                                alignItems="center"
                                mb={4}
                              >
                                <Text>Light Alert</Text>
                                <Switch
                                  isChecked={areaLightAlert}
                                  onChange={() =>
                                    setAreaLightAlert(!areaLightAlert)
                                  }
                                  size="md"
                                />
                              </Flex>
                            </Grid>
                            {/* <Flex
                            alignItems="center"
                            justifyContent="space-between"
                            mb={4}
                          >
                            <Text flex="1">Sensitivity Level</Text>
                            <Box flex="1" mx={4}>
                              <Slider
                                value={areaSensitivity}
                                onChange={(val) => setAreaSensitivity(val)}
                                min={0}
                                max={100}
                                step={1}
                              >
                                <SliderTrack>
                                  <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                              </Slider>
                            </Box>
                            <Text>{areaSensitivity}%</Text>
                          </Flex> */}
                            <Flex
                              width={{ base: "auto", md: "260px" }}
                              justifyContent="space-between"
                              alignItems="center"
                              mb={4}
                            >
                              <Button onClick={openAreaModal}>
                                Open Canvas
                              </Button>
                            </Flex>
                          </Box>
                        )}
                      </Box>
                      <AreaCanvas
                        isOpen={isAreaModalOpen}
                        onClose={closeAreaModal}
                        onCanvasData={handleAreaData}
                        existingAction={Action}
                        existingCoordinates={detectArea}
                        existingDirection={areaDirection}
                        deviceId={selectedDeviceId}
                      />
                    </>
                  )}
                <Divider mb={2} />

                <Flex w="full" justifyContent="space-between">
                  {/* <Button colorScheme="red" variant="outline" size="sm">
Set to Default
</Button> */}
                  <Button
                    p={0}
                    colorScheme="red"
                    variant="ghost"
                    textDecoration={"underline"}
                    size="sm"
                    onClick={() => handleRebootCamera()}
                  >
                    Reboot Camera
                  </Button>
                  <IconButton
                    colorScheme="red"
                    aria-label="Info"
                    icon={<InfoIcon />}
                    size="sm"
                    variant="ghost"
                  />
                  <Spacer />
                  <Button
                    variant="outline"
                    size="sm"
                    mr={2}
                    onClick={closeModal}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    background={saveButtonBackgroundColor}
                    color={saveButtonColor}
                    fontWeight={"normal"}
                    _hover={{
                      backgroundColor: saveButtonHoverBackgroundColor,
                      color: saveButtonHoverColor,
                    }}
                    onClick={() => handleAISettings()}
                  >
                    Save
                  </Button>
                </Flex>
              </Box>
            )}

            {activeTab === "Wifi Settings" && (
              <>
                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text>Wifi Name</Text>
                  <Input
                    value={wifiName}
                    onChange={(event) => setWifiName(event.target.value)}
                    size="sm"
                    maxW="60%"
                  />
                </Flex>

                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text>Password</Text>
                  <Input
                    value={wifiPassword}
                    onChange={(event) => setWifiPassword(event.target.value)}
                    size="sm"
                    maxW="60%"
                  />
                </Flex>

                <Divider mb={2} />

                <Flex w="full" justifyContent="space-between">
                  {/* <Button colorScheme="red" variant="outline" size="sm">
                Set to Default
              </Button> */}
                  <Button
                    p={0}
                    colorScheme="red"
                    variant="ghost"
                    textDecoration={"underline"}
                    size="sm"
                    onClick={() => handleRebootCamera()}
                  >
                    Reboot Camera
                  </Button>
                  <IconButton
                    colorScheme="red"
                    aria-label="Info"
                    icon={<InfoIcon />}
                    size="sm"
                    variant="ghost"
                  />
                  <Spacer />
                  <Button
                    variant="outline"
                    size="sm"
                    mr={2}
                    onClick={closeModal}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    background={saveButtonBackgroundColor}
                    color={saveButtonColor}
                    fontWeight={"normal"}
                    _hover={{
                      backgroundColor: saveButtonHoverBackgroundColor,
                      color: saveButtonHoverColor,
                    }}
                    onClick={() => handleWifiSettings()}
                  >
                    Save
                  </Button>
                </Flex>
              </>
            )}

            {/* Add other tab contents here if needed */}
          </ModalBody>

          {/* Modal Footer */}
          {/* <ModalFooter>
            <Flex w="full" justifyContent="space-between">
              <Button colorScheme="red" variant="ghost" textDecoration={'underline'} size="sm">
                Reboot Camera
              </Button>
              <IconButton colorScheme="red" aria-label="Info" icon={<InfoIcon />} size="sm" variant="ghost" />
              <Spacer />
              <Button variant="outline" size="sm" mr={2} onClick={closeModal}>
                Close
              </Button>
              <Button
                size="sm"
                background={useColorModeValue(
                  theme.colors.custom.primary,
                  theme.colors.custom.darkModePrimary
                )}
                color={useColorModeValue(
                  theme.colors.custom.lightModeText,
                  theme.colors.custom.darkModeText
                )}
                fontWeight={"normal"}
                _hover={{
                  backgroundColor: useColorModeValue(
                    theme.colors.custom.darkModePrimary,
                    theme.colors.custom.primary
                  ),
                  color: useColorModeValue(
                    theme.colors.custom.darkModeText,
                    theme.colors.custom.lightModeText
                  ),
                }}>
                Save
              </Button>
            </Flex>
          </ModalFooter> */}
        </ModalContent>
      </Modal>

      {/* removeSharedAccess Modal */}
      <Modal
        isOpen={isOpen && activeModal === "removeSharedAccess"}
        onClose={onClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          p={3} // Add padding to the modal content
          borderRadius="8px" // Add border radius for rounded corners
          boxShadow="lg" // Add shadow for a floating effect
          // maxW="400px" // Limit width for better responsiveness
          bg={useColorModeValue("white", "gray.800")}
          color={textColor}
        >
          <ModalHeader
            textAlign="center"
            fontSize="xl"
            fontWeight="bold"
            color={useColorModeValue("black", "white")}
          >
            Are you sure?
          </ModalHeader>
          <ModalBody>
            <Flex direction="column" align="center" justify="center">
              <Icon as={CiCircleRemove} color="red.500" boxSize="50px" mb={4} />
              <Text
                textAlign="center"
                color={useColorModeValue("gray.800", "gray.200")}
                fontSize="md"
              >
                Remove access from this camera.
              </Text>
            </Flex>
          </ModalBody>
          <ModalFooter justifyContent="center" gap={4}>
            <Button
              onClick={onClose}
              w="150px"
              border="1px"
              background="0"
              color="red.500"
              borderColor="red.500"
              _hover={{ background: "none" }}
            >
              Cancel
            </Button>

            <Button
              w={"150px"}
              background={useColorModeValue(
                theme.colors.custom.primary,
                theme.colors.custom.darkModePrimary
              )}
              color={useColorModeValue(
                theme.colors.custom.lightModeText,
                theme.colors.custom.darkModeText
              )}
              fontWeight="normal"
              _hover={{
                backgroundColor: useColorModeValue(
                  theme.colors.custom.darkModePrimary,
                  theme.colors.custom.primary
                ),
                color: useColorModeValue(
                  theme.colors.custom.darkModeText,
                  theme.colors.custom.lightModeText
                ),
              }}
              onClick={handleRemoveSharedCamera}
              borderRadius="6px"
            >
              Remove Access
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* remove user camera Modal */}
      <Modal
        isOpen={isOpen && activeModal === "removeUserCamera"}
        onClose={onClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          p={3} // Add padding to the modal content
          borderRadius="8px" // Add border radius for rounded corners
          boxShadow="lg" // Add shadow for a floating effect
          // maxW="400px" // Limit width for better responsiveness
          bg={useColorModeValue("white", "gray.800")}
          color={textColor}
        >
          <ModalHeader
            textAlign="center"
            fontSize="xl"
            fontWeight="bold"
            color={useColorModeValue("black", "white")}
          >
            Are you sure?
          </ModalHeader>
          <ModalBody>
            <Flex direction="column" align="center" justify="center">
              <Icon as={CiCircleRemove} color="red.500" boxSize="50px" mb={4} />
              <Text
                textAlign="center"
                color={useColorModeValue("gray.800", "gray.200")}
                fontSize="md"
              >
                Remove access of this camera.
              </Text>
            </Flex>
          </ModalBody>
          <ModalFooter justifyContent="center" gap={4}>
            <Button
              onClick={onClose}
              w="150px"
              border="1px"
              background="0"
              color="red.500"
              borderColor="red.500"
              _hover={{ background: "none" }}
            >
              Cancel
            </Button>

            <Button
              w={"150px"}
              background={useColorModeValue(
                theme.colors.custom.primary,
                theme.colors.custom.darkModePrimary
              )}
              color={useColorModeValue(
                theme.colors.custom.lightModeText,
                theme.colors.custom.darkModeText
              )}
              fontWeight="normal"
              _hover={{
                backgroundColor: useColorModeValue(
                  theme.colors.custom.darkModePrimary,
                  theme.colors.custom.primary
                ),
                color: useColorModeValue(
                  theme.colors.custom.darkModeText,
                  theme.colors.custom.lightModeText
                ),
              }}
              onClick={handleRemoveCamera}
              borderRadius="6px"
            >
              Remove Camera
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Smart Quality Camera Modal */}
      <Modal
        isOpen={isOpen && smartQualityActiveModal === "Smart Quality"}
        onClose={onClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          p={3} // Add padding to the modal content
          borderRadius="8px" // Add border radius for rounded corners
          boxShadow="lg" // Add shadow for a floating effect
          // maxW="400px" // Limit width for better responsiveness
          bg={useColorModeValue("white", "gray.800")}
          color={textColor}
        >
          <ModalHeader
            textAlign="center"
            fontSize="xl"
            fontWeight="bold"
            color={useColorModeValue("black", "white")}
          >
            Enter your SIM's daily limit in GB?
          </ModalHeader>
          <ModalBody>
            <Flex direction="column" align="center" justify="center">
              <Input
                placeholder="Dataplan"
                // disabled={enablesmartQuality}
                value={dataPlan || ""} // Controlled component value
                onChange={(e) => setdataPlan(e.target.value)} // Update state on change
                size="md"
                maxWidth="full" // Optional: Restrict input width
              />
            </Flex>
          </ModalBody>
          <ModalFooter justifyContent="center" gap={4}>
            <Button
              onClick={() => setSmartQualityActiveModal(null)}
              w="150px"
              border="1px"
              background="0"
              color="red.500"
              borderColor="red.500"
              _hover={{ background: "none" }}
            >
              Cancel
            </Button>

            <Button
              w={"150px"}
              background={useColorModeValue(
                theme.colors.custom.primary,
                theme.colors.custom.darkModePrimary
              )}
              color={useColorModeValue(
                theme.colors.custom.lightModeText,
                theme.colors.custom.darkModeText
              )}
              fontWeight="normal"
              _hover={{
                backgroundColor: useColorModeValue(
                  theme.colors.custom.darkModePrimary,
                  theme.colors.custom.primary
                ),
                color: useColorModeValue(
                  theme.colors.custom.darkModeText,
                  theme.colors.custom.lightModeText
                ),
              }}
              // onClick={handleRemoveSharedCamera}
              onClick={() => handleToggleSmart()}
              borderRadius="6px"
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* slide up modal for mobile view */}
      <Drawer
        isOpen={isOpen && activeModal === "filterOptions"}
        placement="bottom"
        onClose={onClose}
      >
        <DrawerOverlay />
        <DrawerContent borderTopRadius="md">
          <DrawerHeader textAlign="center" fontSize="lg">
            View By
          </DrawerHeader>
          <DrawerBody>
            <RadioGroup
              onChange={setTempView} // Update temporary state on selection
              value={tempView} // Use temporary state to show the selection
            >
              <VStack align="start" spacing={4}>
                <Radio value="Grid View">Grid View</Radio>
                <Radio value="List View">List View</Radio>
              </VStack>
            </RadioGroup>
          </DrawerBody>
          <DrawerFooter justifyContent="center">
            <Button bg={bgColor} width="50%" onClick={handleApply}>
              Apply
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Cameras;
