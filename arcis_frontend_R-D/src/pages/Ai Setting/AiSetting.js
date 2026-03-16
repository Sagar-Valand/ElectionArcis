import React, { useEffect, useState, useRef } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    useDisclosure,
    Text,
    Spinner,
    Center
} from '@chakra-ui/react';
import styles from './AiSetting.css';
import Rectangle from '../../assets/Rectangle.png';
import Ellipse from '../../assets/Ellipse.png';
import plays from '../../assets/plays.png';
import off_Ellipse from '../../assets/off_Ellipse.png';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEye } from 'react-icons/fa';
import DrawingModal from '../../components/DrawingModal';
import Player from "../../components/Player";

// --- Centralized data structure for all AI settings (Unchanged) ---
const aiCategories = [
    {
        title: "People & Crowd Analytics",
        events: [
            { id: 1,  key: 'face_recognition', name: "Face Recognition" },
            { id: 2,  key: 'idle_time_detection', name: "idle time detecton" },
            { id: 17, key: 'line_crossing_detection', name: "Line-Cross Detection with Directional Logic" },
            { id: 21, key: 'person_count_detection', name: "Person counting" },
            { id: 11,  key: 'object_detection', name: "Object Detection" },
        ]
    },
    {
        title: "Safety & Risk Detection",
        events: [
            { id: 3,  key: 'fire_smoke_detection_custom', name: "Fire & Smoke Detection" },
            { id: 5,  key: 'ppe_detection', name: "PPE Kit Detection (Helmet, Vest, Gloves, Mask)" },
            { id: 6,  key: 'medical_ppe_detection', name: "Medical PPE Kit Detection " },
        ]
    },
    {
        title: "Vehicle & Road Monitoring",
        events: []
    },
    {
        title: "Driver Monitoring System (DMS)",
        events: [
            { id: 7,  key: 'mobile_detection', name: "Mobile Phone Usage Detection" },
        ]
    },
    {
        title: "Election-Specific AI",
        events: [
            { id: 31, key: 'evm_detection', name: "Multiple Persons near EVM Machine Detection" },
        ]
    }
];

// --- Helper Functions (API calls) ---

// ====================================================================
// CORRECTED: This function now correctly handles the backend response.
// ====================================================================
const loadCameras = async (email) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_LOCAL_URL || process.env.REACT_APP_URL}/aisetting/getMultipleCamera?email=${email}`
    );

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      toast.error("Could not reach server to get cameras.");
      return [];
    }

    const result = await response.json();

    // 1. Ensure the API responded with success and data is an array
    if (result.success && Array.isArray(result.data)) {
      // 2. Deduplicate cameras by deviceId (in case backend returns duplicates)
      const uniqueCamerasMap = new Map();
      result.data.forEach(camera => {
        uniqueCamerasMap.set(camera.deviceId, camera);
      });

      // 3. Return unique cameras as an array
      return Array.from(uniqueCamerasMap.values());
    }

    console.error("Failed to fetch cameras:", result.message);
    return [];

  } catch (error) {
    console.error("Error loading cameras:", error);
    toast.error("An error occurred while loading cameras.");
    return [];
  }
};

const loadAiSettings = async (deviceId) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_LOCAL_URL || process.env.REACT_APP_URL}/aisetting/getaisetting?deviceId=${deviceId}`);
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) return result.data[0];
        console.warn(`No AI settings found for deviceId: ${deviceId}`);
        return null;
    } catch (error) {
        console.error('Error loading AI settings:', error);
        return null;
    }
};

const saveAiSettings = async (settings) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_URL}/aisetting/saveaisetting`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
        const result = await response.json();
        if (result.success) {
            toast.success("Settings saved successfully!");
            return true;
        }
        toast.error(`Failed to save AI settings: ${result.message}`);
        return false;
    } catch (error) {
        toast.error('Error saving AI settings.');
        console.error('Error saving AI settings:', error);
        return false;
    }
};

function AiSetting({ }) {
    const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
    const { isOpen: isPlayerOpen, onOpen: onPlayerOpen, onClose: onPlayerClose } = useDisclosure();

    const [devices, setDevices] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [playUrl, setPlayUrl] = useState('');
    const [isDrawingModalOpen, setDrawingModalOpen] = useState(false);
    const [drawingContext, setDrawingContext] = useState(null);
    
    const [tempEventSettings, setTempEventSettings] = useState({});
    const [loadingSettings, setLoadingSettings] = useState(false);
    
    const email = localStorage.getItem('email');
    const pollingInterval = useRef(null);

    // CORRECTED: Uses 'camera.deviceId' (lowercase 'd')
    const handleViewStream = (camera) => {
        if (camera && camera.deviceId) {
            const url = `https://ptz.vmukti.com/live-record/${camera.deviceId}.flv`;
            setPlayUrl(url);
            onPlayerOpen();
        } else {
            console.error("Camera data is incomplete:", camera);
            toast.error("Cannot play stream, camera data is missing.");
        }
    };

    // CORRECTED: Uses 'camera.deviceId' (lowercase 'd')
    const handleOpenSettings = async (camera) => {
        setSelectedCamera(camera);
        onSettingsOpen();
        setLoadingSettings(true);
        try {
            const loadedSettings = await loadAiSettings(camera.deviceId);
            const initialSettings = {};
            aiCategories.forEach(category => {
                category.events.forEach(event => {
                    initialSettings[event.id] = (loadedSettings && loadedSettings[event.key]) || false;
                    const paramKey = `${event.key}_params`;
                    if (loadedSettings && loadedSettings[paramKey]) {
                        initialSettings[paramKey] = loadedSettings[paramKey];
                    }
                });
            });
            setTempEventSettings(initialSettings);
        } catch (error) {
            console.error("Error processing settings", error);
            toast.error("Could not load AI settings.");
        } finally {
            setLoadingSettings(false);
        }
    };
    
    // CORRECTED: Uses 'selectedCamera.deviceId' (lowercase 'd')
    const handleSaveSettings = async () => {
        if (!selectedCamera || !selectedCamera.deviceId) {
            toast.error("No camera selected.");
            return;
        }
        setLoadingSettings(true);

        const settingsToSave = { deviceId: selectedCamera.deviceId };

        aiCategories.forEach(category => {
            category.events.forEach(event => {
                const toggleValue = tempEventSettings[event.id];
                const paramKey = `${event.key}_params`; 
                const paramValue = tempEventSettings[paramKey];

                settingsToSave[event.key] = !!toggleValue;

                if (paramValue) {
                    settingsToSave[paramKey] = paramValue;
                }
            });
        });
        
        console.log("FINAL PAYLOAD to be sent to backend:", JSON.stringify(settingsToSave, null, 2));

        const saveSuccess = await saveAiSettings(settingsToSave);

        if (saveSuccess) {
            onSettingsClose();
        }
        setLoadingSettings(false);
    };

    // CORRECTED: Uses 'selectedCamera.deviceId' (lowercase 'd')
    const handleOpenDrawingModal = (eventKey) => {
        if (!selectedCamera || !selectedCamera.deviceId) {
            toast.error("Error: No camera context for drawing.");
            return;
        }
        const streamUrl = `https://ptz.vmukti.com/live-record/${selectedCamera.deviceId}.flv`;
        
        setDrawingContext({
            moduleKey: eventKey,
            initialParams: tempEventSettings[`${eventKey}_params`] || null,
            streamUrl: streamUrl,
        });
        setDrawingModalOpen(true);
    };
    
    const handleCloseDrawingModal = () => {
        setDrawingModalOpen(false);
        setDrawingContext(null);
    };

    const handleSaveCoordinates = (newData) => {
        setTempEventSettings(prev => ({
            ...prev,
            ...newData,
        }));
        toast.info(`Drawing zones updated. Click 'Save' to apply changes.`);
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            if (email) {
                const cameraData = await loadCameras(email);
                setDevices(cameraData);
            }
        };
        fetchInitialData();
        
        pollingInterval.current = setInterval(async () => {
            if (email) {
                const cameraData = await loadCameras(email);
                // Simple string comparison to see if data has changed to avoid needless re-renders
                if (JSON.stringify(cameraData) !== JSON.stringify(devices)) {
                    setDevices(cameraData);
                }
            }
        }, 5000);
        
        return () => clearInterval(pollingInterval.current);
    }, [email]); // Removed 'devices' from dependency array to prevent re-triggering interval on its own update

    const handleEventToggle = (eventId) => {
        setTempEventSettings(prevSettings => ({
            ...prevSettings,
            [eventId]: !prevSettings[eventId],
        }));
    };

    return (
        <div className="camera-list-container">
            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
            <div className="online-offline-buttons">
                <button className="online-button">Online <span>●</span></button>
                <button className="offline-button">Offline <span>●</span></button>
            </div>
            <div className="camera-grid">
                {/* CORRECTED: Check for devices.length to show a message if empty */}
                {devices && devices.length > 0 ? (
                    devices.map(device => (
                        // CORRECTED: Use 'device.deviceId' (lowercase 'd') for the key
                        <div className="camera-item" key={device.deviceId}>
                            <img src={Rectangle} alt="Camera View" style={{ width: '30%', height: 'auto' }} />
                            <div className="camera-image-container">
                                <img
                                    src={plays}
                                    className="camera-image play-image"
                                    alt="Play"
                                    style={{ cursor: 'pointer' }}
                                    onClick={(e) => { e.stopPropagation(); handleViewStream(device); }}
                                />
                                <img src={device.Status ? Ellipse : off_Ellipse} className="camera-image ellipse-image" alt="Status Dot" />
                            </div>
                            <button className="ai-settings-button" onClick={(e) => { e.stopPropagation(); handleOpenSettings(device); }}>
                                <img
                                    src="https://cdn.builder.io/api/v1/image/assets/TEMP/7aa834b209178650007785d19eca4f980c07a00c1196b49f12f2195efc597523?apiKey=21c2172730ed406bb6f91788633e80d1"
                                    alt="Settings"
                                    className="ai-settings-icon"
                                />
                            </button>
                            {/* CORRECTED: Use 'device.deviceId' and 'device.CameraName' */}
                            <p>{device.deviceId}</p>
                            <p>{device.CameraName}</p>
                        </div>
                    ))
                ) : (
                    <Center w="100%" h="200px">
                        <Text fontSize="lg">No cameras found for this user.</Text>
                    </Center>
                )}
            </div>

            {/* --- AI Settings Modal --- */}
            <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    {/* CORRECTED: Use 'selectedCamera?.deviceId' */}
                    <ModalHeader>AI Settings - {selectedCamera?.deviceId}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody overflowY="auto" maxH="60vh">
                        {loadingSettings ? (
                            <Center h="200px"><Spinner size="xl" /></Center>
                        ) : (
                            aiCategories.map(category => (
                                <div key={category.title}>
                                    <Text fontWeight="bold" fontSize="lg" mt={4} mb={2}>{category.title}</Text>
                                    <ul className="event-list">
                                        {category.events.map(event => (
                                            <li key={event.id} className="event-item">
                                                <span>{event.name}</span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {(event.key === 'line_crossing_detection' || event.key === 'idle_time_detection') && (
                                                        <Button size="sm" variant="ghost" onClick={() => handleOpenDrawingModal(event.key)} title={`Configure ${event.name}`}>
                                                            <FaEye />
                                                        </Button>
                                                    )}
                                                    <label className="toggle-switch">
                                                        <input type="checkbox" checked={!!tempEventSettings[event.id]} onChange={() => handleEventToggle(event.id)} />
                                                        <span className="slider"></span>
                                                    </label>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={handleSaveSettings} isLoading={loadingSettings}>Save</Button>
                        <Button variant='ghost' onClick={onSettingsClose}>Cancel</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            {/* --- Drawing Modal (No changes needed here) --- */}
            {drawingContext && (
                <DrawingModal
                    isOpen={isDrawingModalOpen}
                    onClose={handleCloseDrawingModal}
                    moduleKey={drawingContext.moduleKey}
                    initialParams={drawingContext.initialParams}
                    onSave={handleSaveCoordinates}
                    streamUrl={drawingContext.streamUrl}
                />
            )}

            {/* --- Player Modal (No changes needed here) --- */}
            <Modal isOpen={isPlayerOpen} onClose={onPlayerClose} size="4xl" isCentered>
                <ModalOverlay />
                <ModalContent bg="#000">
                    <ModalHeader color="white">Live Stream</ModalHeader>
                    <ModalCloseButton color="white" _focus={{ boxShadow: 'none' }} _hover={{ bg: 'rgba(255,255,255,0.1)' }} />
                    <ModalBody p={0}>
                        {playUrl ? (
                            <Player url={playUrl} />
                        ) : (
                            <Center h="880px">
                                <Spinner size="xl" color="white" />
                                <Text color="white" ml={4}>Loading Stream...</Text>
                            </Center>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </div>
    );
}

export default AiSetting;
