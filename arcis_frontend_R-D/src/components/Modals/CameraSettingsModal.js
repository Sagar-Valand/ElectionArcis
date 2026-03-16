import {
    Box,
    Flex,
    Text,
    Tabs,
    TabList,
    Tab,
    Input,
    IconButton,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Button,
    useColorModeValue,
    Image,
    Divider,
    Icon,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    Switch,
    Spacer,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Grid,
    useToast,
    Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
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
} from "../../actions/settingsActions";
import LineCrossCanvas from "../Canvas/LineCrossCanvas";
import CustomerCanvas from "../Canvas/CustomerCanvas";
import UAOCanvas from "../Canvas/UAOCanvas";
import MODCanvas from "../Canvas/MODCanvas";
import AreaCanvas from "../Canvas/AreaCanvas";

const CameraSettingsModal = ({
    isOpen,
    onClose,
    deviceId,
    cameraName,
    productType,
}) => {
    const toast = useToast();

    // -- State Variables Migrated from Cameras.js --
    const [activeTab, setActiveTab] = useState("General");
    const [activeDropdown, setActiveDropdown] = useState(null);

    // General Tab
    const [quality, setQuality] = useState("");
    const [qualityLoading, setQualityLoading] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(false);
    const [humanTracking, setHumanTracking] = useState(false);
    const [cruiseMode, setCruiseMode] = useState("");
    const [audio, setAudio] = useState(false);
    const [enablesmartQuality, setenableSmartQuality] = useState(false);
    const [dataPlan, setdataPlan] = useState(0);

    // Media Tab
    const [irCutMode, setIrCutMode] = useState(false);
    const [brightness, setBrightness] = useState(50);
    const [contrast, setContrast] = useState(50);
    const [saturation, setSaturation] = useState(0);
    const [hue, setHue] = useState(0);
    const [sharpness, setSharpness] = useState(50);
    const [flip, setFlip] = useState(false);
    const [mirror, setMirror] = useState(false);

    // AI Settings
    // Motion Detection
    const [motionEnabled, setMotionEnabled] = useState(false);
    const [motionSensitivity, setMotionSensitivity] = useState(0);
    const [motionAudioAlert, setMotionAudioAlert] = useState(false);
    const [motionLightAlert, setMotionLightAlert] = useState(false);

    // Human Detection
    const [humanEnabled, setHumanEnabled] = useState(false);
    const [humanSensitivity, setHumanSensitivity] = useState(0);
    const [humanSensitivityLevel, setHumanSensitivityLevel] = useState("normal"); // Default assumption
    const [humanAudioAlert, setHumanAudioAlert] = useState(false);
    const [humanLightAlert, setHumanLightAlert] = useState(false);

    // Face Detection
    const [faceEnabled, setFaceEnabled] = useState(false);
    const [audioAlert, setAudioAlert] = useState(false);
    const [lightAlert, setLightAlert] = useState(false);
    const [faceSensitivity, setFaceSensitivity] = useState(0);

    // Line Cross
    const [lineCrossEnabled, setLineCrossEnabled] = useState(false);
    const [lineCrossAudioAlert, setLineCrossAudioAlert] = useState(false);
    const [lineCrossLightAlert, setLineCrossLightAlert] = useState(false);
    const [lineCrossSensitivity, setLineCrossSensitivity] = useState(0);
    const [detectLine, setDetectLine] = useState(null);
    const [direction, setDirection] = useState(null);
    const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);

    // Area Detection
    const [areaEnabled, setAreaEnabled] = useState(false);
    const [areaAudioAlert, setAreaAudioAlert] = useState(false);
    const [areaLightAlert, setAreaLightAlert] = useState(false);
    const [areaSensitivity, setAreaSensitivity] = useState(0);
    const [detectArea, setDetectArea] = useState([]);
    const [areaDirection, setAreaDirection] = useState(null);
    const [Action, setAction] = useState("");
    const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);

    // Traffic (Customer Stats)
    const [trafficEnabled, setTrafficEnabled] = useState(false);
    const [detectTraffic, setDetectTraffic] = useState(null);
    const [trafficDirection, setTrafficDirection] = useState(null);
    const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);

    // Unattended Object
    const [unattendedEnabled, setUnattendedEnabled] = useState(false);
    const [unattendedAudioAlert, setUnattendedAudioAlert] = useState(false);
    const [unattendedLightAlert, setUnattendedLightAlert] = useState(false);
    const [unattendedSensitivity, setUnattendedSensitivity] = useState(0);
    const [detectUnattended, setDetectUnattended] = useState(null);
    const [unattendedDirection, setUnattendedDirection] = useState(null);
    const [unattendedDuration, setUnattendedDuration] = useState(0);
    const [isUnattendedModalOpen, setIsUnattendedModalOpen] = useState(false);

    // Missing Object
    const [missingEnabled, setMissingEnabled] = useState(false);
    const [missingAudioAlert, setMissingAudioAlert] = useState(false);
    const [missingLightAlert, setMissingLightAlert] = useState(false);
    const [missingSensitivity, setMissingSensitivity] = useState(0);
    const [detectMissing, setDetectMissing] = useState(null);
    const [missingDirection, setMissingDirection] = useState(null);
    const [missingDuration, setMissingDuration] = useState(0);
    const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);

    // Wifi Settings (Placeholder from original code)
    // const [wifiName, setWifiName] = useState("");
    // const [wifiPassword, setWifiPassword] = useState("");

    const theme = useColorModeValue("light", "dark"); // Simplified theme access
    const saveButtonBackgroundColor = useColorModeValue("custom.primary", "custom.darkModePrimary");
    const saveButtonColor = useColorModeValue("white", "white");
    const saveButtonHoverBackgroundColor = useColorModeValue("custom.primaryHover", "custom.darkModePrimaryHover");
    const saveButtonHoverColor = useColorModeValue("white", "white");


    // --- Helper Functions ---

    const fetchData = async () => {
        if (!deviceId) return;

        try {
            if (activeTab === "Media") {
                const response = await getVideoSettings(deviceId);
                const response2 = await getImageInfo(deviceId);
                if (response2) setIrCutMode(response2.irCutMode);
                if (response) {
                    setBrightness(response.brightnessLevel);
                    setContrast(response.contrastLevel);
                    setSaturation(response.saturationLevel);
                    setSharpness(response.sharpnessLevel);
                    setHue(response.hueLevel);
                    setMirror(response.mirrorEnabled);
                    setFlip(response.flipEnabled);
                }
            } else if (activeTab === "General") {
                const qualityResponse = await getQuality(deviceId);
                if (qualityResponse && qualityResponse.quality) setQuality(qualityResponse.quality.quality);

                if (productType && productType.includes("S-Series")) {
                    const aiResponse = await getAlertSettings(deviceId);
                    if (aiResponse) setAiEnabled(aiResponse.bEnable);
                    const aiResponse2 = await getHumanTracking(deviceId);
                    if (aiResponse2) {
                        setHumanTracking(aiResponse2.motionTracking);
                        setCruiseMode(aiResponse2.cruiseMode);
                    }
                }
                const audioResponse = await getAudioInfo(deviceId);
                if (audioResponse) setAudio(audioResponse.enabled);

                const smartQualityresponse = await getSmartQuality(deviceId);
                if (smartQualityresponse && smartQualityresponse.smartQuality) {
                    setenableSmartQuality(smartQualityresponse.smartQuality.smartQuality);
                    setdataPlan(smartQualityresponse.smartQuality.dataPlan);
                }

            } else if (activeTab === "AI Settings" && activeDropdown) {
                // Fetch specific AI dropdown settings
                if (activeDropdown === "Motion Detection") {
                    const response = await getMotionDetection(deviceId);
                    if (response) {
                        setMotionEnabled(response.enabled);
                        if (response.detectionGrid) setMotionSensitivity(response.detectionGrid.sensitivityLevel);
                        if (response.alarmOut) {
                            setMotionAudioAlert(response.alarmOut.audioAlert.enabled);
                            setMotionLightAlert(response.alarmOut.lightAlert.enabled);
                        }
                    }
                } else if (activeDropdown === "Human Detection") {
                    const response = await getHumanoid(deviceId);
                    if (response) {
                        setHumanEnabled(response.enabled);
                        setHumanSensitivity(response.sensitivity);
                        setHumanSensitivityLevel(response.sensitivityLevel);
                        setHumanAudioAlert(response.audioAlert);
                        setHumanLightAlert(response.lightAlert);
                    }
                } else if (activeDropdown === "Face Detection") {
                    const response = await getFace(deviceId);
                    if (response) {
                        setFaceEnabled(response.enabled);
                        setFaceSensitivity(response.sensitivity);
                        setAudioAlert(response.audioAlert);
                        setLightAlert(response.lightAlert);
                    }
                } else if (activeDropdown === "Line Crossing Detection") {
                    const response = await getLineCross(deviceId);
                    if (response) {
                        setLineCrossEnabled(response.enabled);
                        setLineCrossSensitivity(response.sensitivity);
                        setLineCrossAudioAlert(response.audioAlert);
                        setLineCrossLightAlert(response.lightAlert);
                        setDetectLine(response.detectLine);
                        setDirection(response.direction);
                    }
                } else if (activeDropdown === "Area Detection") {
                    const response = await getAreaDetection(deviceId);
                    if (response) {
                        setAreaEnabled(response.enabled);
                        setAreaSensitivity(response.sensitivity);
                        setAreaAudioAlert(response.audioAlert);
                        setAreaLightAlert(response.lightAlert);
                        setDetectArea(response.detectArea);
                        setAreaDirection(response.direction);
                        setAction(response.action);
                    }
                } else if (activeDropdown === "Traffic Detection") {
                    const response = await getCustomerStats(deviceId);
                    if (response) {
                        setTrafficEnabled(response.enabled);
                        setDetectTraffic(response.detectTraffic);
                        setTrafficDirection(response.direction);
                    }
                } else if (activeDropdown === "Unattended Object") {
                    const response = await getUnattendedObjectDetection(deviceId);
                    if (response) {
                        setUnattendedEnabled(response.enabled);
                        setUnattendedSensitivity(response.sensitivity);
                        setUnattendedAudioAlert(response.audioAlert);
                        setUnattendedLightAlert(response.lightAlert);
                        setUnattendedDuration(response.duration);
                        setDetectUnattended(response.detectUnattended);
                        setUnattendedDirection(response.direction);
                    }
                } else if (activeDropdown === "Missing Object") {
                    const response = await getMissingObjectDetection(deviceId);
                    if (response) {
                        setMissingEnabled(response.enabled);
                        setMissingSensitivity(response.sensitivity);
                        setMissingAudioAlert(response.audioAlert);
                        setMissingLightAlert(response.lightAlert);
                        setMissingDuration(response.duration);
                        setDetectMissing(response.detectMissing);
                        setMissingDirection(response.direction);
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to fetch ${activeTab} settings:`, error);
            toast({ title: "Error fetching settings", status: "error", duration: 3000, isClosable: true });
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, activeTab, activeDropdown, deviceId]);


    // --- Handlers ---

    const handleRebootCamera = async () => {
        try {
            await rebootCamera(deviceId);
            toast({ title: "Camera Rebooting...", status: "info", duration: 3000, isClosable: true });
        } catch (error) {
            console.error("Error rebooting camera:", error);
            toast({ title: "Reboot failed", status: "error", duration: 3000, isClosable: true });
        }
    };

    const handleQualityChange = async (newQuality) => {
        setQualityLoading(true);
        setQuality(newQuality);
        try {
            await setQualitySettings(deviceId, newQuality);
            toast({ title: "Quality updated", status: "success", duration: 2000, isClosable: true });
        } catch (error) {
            console.error("Error updating quality:", error);
            toast({ title: "Error updating quality", status: "error", duration: 3000, isClosable: true });
        } finally {
            setQualityLoading(false);
        }
    };

    const handleGeneralSettings = async () => {
        try {
            if (productType && productType.includes("S-Series")) {
                await setAlertSettings(deviceId, aiEnabled);
                await setHumanTrackingSettings(deviceId, humanTracking, cruiseMode);
            }
            await setAudioInfo(deviceId, audio);
            await setSmartQuality(deviceId, enablesmartQuality, dataPlan);
            toast({ title: "General Settings Saved", status: "success", duration: 3000, isClosable: true });
        } catch (error) {
            console.error("Error saving general settings:", error);
            toast({ title: "Save failed", status: "error", duration: 3000, isClosable: true });
        }
    };

    const handleMediaSettings = async () => {
        try {
            await setVideoSettings(deviceId, brightness, contrast, saturation, hue, sharpness, flip, mirror);
            await setImageInfo(deviceId, irCutMode);
            toast({ title: "Media Settings Saved", status: "success", duration: 3000, isClosable: true });
        } catch (error) {
            console.error("Error saving media settings:", error);
            toast({ title: "Save failed", status: "error", duration: 3000, isClosable: true });
        }
    };

    const handleAISettings = async () => {
        try {
            if (activeDropdown === "Motion Detection") {
                await setMotionDetection(deviceId, motionEnabled, motionSensitivity, motionAudioAlert, motionLightAlert);
            } else if (activeDropdown === "Human Detection") {
                await setHumanoid(deviceId, humanEnabled, humanSensitivity, humanSensitivityLevel, humanAudioAlert, humanLightAlert);
            } else if (activeDropdown === "Face Detection") {
                await setFace(deviceId, faceEnabled, faceSensitivity, audioAlert, lightAlert);
            } else if (activeDropdown === "Line Crossing Detection") {
                await setLineCross(deviceId, lineCrossEnabled, lineCrossSensitivity, lineCrossAudioAlert, lineCrossLightAlert, detectLine, direction);
            } else if (activeDropdown === "Area Detection") {
                await setAreaDetection(deviceId, areaEnabled, areaSensitivity, areaAudioAlert, areaLightAlert, detectArea, areaDirection, Action);
            } else if (activeDropdown === "Traffic Detection") {
                await setCustomerStats(deviceId, trafficEnabled, detectTraffic, trafficDirection);
            } else if (activeDropdown === "Unattended Object") {
                await setUnattendedObjectDetection(deviceId, unattendedEnabled, unattendedSensitivity, unattendedAudioAlert, unattendedLightAlert, unattendedDuration, detectUnattended, unattendedDirection);
            } else if (activeDropdown === "Missing Object") {
                await setMissingObjectDetection(deviceId, missingEnabled, missingSensitivity, missingAudioAlert, missingLightAlert, missingDuration, detectMissing, missingDirection);
            }
            toast({ title: `${activeDropdown} settings updated`, status: "success", duration: 3000, isClosable: true });
        } catch (error) {
            console.error("Error saving AI settings:", error);
            toast({ title: "Save failed", status: "error", duration: 3000, isClosable: true });
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Camera Settings</ModalHeader>
                <ModalBody>
                    <Tabs variant="unstyled" mb={6} onChange={(index) => setActiveTab(["General", "Media", "AI Settings", "Wifi Settings"][index])}>
                        <TabList>
                            {["General", "Media", "AI Settings"].map((tab) => (
                                <Tab
                                    key={tab}
                                    _selected={{ fontWeight: "bold", borderBottom: "4px solid", borderColor: saveButtonBackgroundColor }}
                                >
                                    {tab}
                                </Tab>
                            ))}
                            {productType === "Wifi-S-Series" && (
                                <Tab _selected={{ fontWeight: "bold", borderBottom: "4px solid", borderColor: saveButtonBackgroundColor }}>
                                    Wifi Settings
                                </Tab>
                            )}
                        </TabList>
                    </Tabs>

                    {/* --- GENERAL TAB --- */}
                    {activeTab === "General" && (
                        <Box>
                            {productType && productType.includes("S-Series") && (
                                <>
                                    <Flex justifyContent="space-between" alignItems="center" mb={4}>
                                        <Text>AI Notifications</Text>
                                        <Switch isChecked={aiEnabled} onChange={() => setAiEnabled(!aiEnabled)} size="md" />
                                    </Flex>
                                    <Flex justifyContent="space-between" alignItems="center" mb={4}>
                                        <Text>Human Tracking</Text>
                                        <Switch isChecked={humanTracking} onChange={() => setHumanTracking(!humanTracking)} size="md" />
                                    </Flex>
                                </>
                            )}
                            <Flex justifyContent="space-between" alignItems="center" mb={4}>
                                <Text>Audio</Text>
                                <Switch isChecked={audio} onChange={() => setAudio(!audio)} size="md" />
                            </Flex>

                            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                <Text>Camera name</Text>
                                <Input disabled defaultValue={cameraName} size="sm" maxW="60%" />
                            </Flex>

                            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                <Text>Camera model</Text>
                                <Text fontWeight="bold">{productType}</Text>
                            </Flex>

                            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                <Text>Device ID</Text>
                                <Text fontWeight="bold">{deviceId}</Text>
                            </Flex>

                            <Flex alignItems="center" justifyContent="space-between">
                                <Text>Quality</Text>
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
                                {qualityLoading && <Spinner size="sm" ml={2} />}
                            </Flex>

                            <Flex alignItems="center" justifyContent="space-between" mt={4} mb={4}>
                                <Text>Cruise Mode</Text>
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
                            </Flex>

                            <Divider mb={2} />
                            <Flex w="full" justifyContent="space-between">
                                <Button p={0} colorScheme="red" variant="ghost" textDecoration={"underline"} size="sm" onClick={handleRebootCamera}>
                                    Reboot Camera
                                </Button>
                                <Spacer />
                                <Button variant="outline" size="sm" mr={2} onClick={onClose}>Close</Button>
                                <Button
                                    size="sm"
                                    background={saveButtonBackgroundColor}
                                    color={saveButtonColor}
                                    _hover={{ backgroundColor: saveButtonHoverBackgroundColor, color: saveButtonHoverColor }}
                                    onClick={handleGeneralSettings}
                                >
                                    Save
                                </Button>
                            </Flex>
                        </Box>
                    )}


                    {/* --- MEDIA TAB --- */}
                    {activeTab === "Media" && (
                        <Box>
                            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                <Text>IR Mode</Text>
                                <Select value={irCutMode} onChange={(e) => setIrCutMode(e.target.value)} size="sm" maxW="60%">
                                    <option value="auto">IrLedMode</option>
                                    <option value="light">Light Mode</option>
                                    <option value="smart">Smart Mode</option>
                                    <option value="daylight">Daylight Mode</option>
                                    <option value="night">Night Mode</option>
                                </Select>
                            </Flex>

                            {/* Reusable Slider Helper */}
                            {[
                                { label: "Brightness", val: brightness, set: setBrightness },
                                { label: "Contrast", val: contrast, set: setContrast },
                                { label: "Saturation", val: saturation, set: setSaturation },
                                { label: "Hue", val: hue, set: setHue },
                                { label: "Sharpness", val: sharpness, set: setSharpness }
                            ].map((item) => (
                                <Flex key={item.label} alignItems="center" justifyContent="space-between" mb={4}>
                                    <Text flex="1">{item.label}</Text>
                                    <Box flex="1" mx={4}>
                                        <Slider value={item.val} onChange={item.set} min={0} max={100} step={1}>
                                            <SliderTrack><SliderFilledTrack /></SliderTrack>
                                            <SliderThumb />
                                        </Slider>
                                    </Box>
                                    <Text>{item.val}%</Text>
                                </Flex>
                            ))}

                            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                <Text flex="1">Flip</Text>
                                <Switch size="sm" isChecked={flip} onChange={() => setFlip(!flip)} />
                            </Flex>

                            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                <Text flex="1">Mirror</Text>
                                <Switch size="sm" isChecked={mirror} onChange={() => setMirror(!mirror)} />
                            </Flex>

                            <Divider mb={2} />
                            <Flex w="full" justifyContent="space-between">
                                <Button p={0} colorScheme="red" variant="ghost" textDecoration={"underline"} size="sm" onClick={handleRebootCamera}>Reboot Camera</Button>
                                <Spacer />
                                <Button variant="outline" size="sm" mr={2} onClick={onClose}>Close</Button>
                                <Button
                                    size="sm"
                                    background={saveButtonBackgroundColor}
                                    color={saveButtonColor}
                                    _hover={{ backgroundColor: saveButtonHoverBackgroundColor, color: saveButtonHoverColor }}
                                    onClick={handleMediaSettings}
                                >
                                    Save
                                </Button>
                            </Flex>
                        </Box>
                    )}


                    {/* --- AI SETTINGS TAB --- */}
                    {activeTab === "AI Settings" && (
                        <Box>
                            {/* Motion Detection */}
                            <Box>
                                <Flex justifyContent="space-between" alignItems="center" cursor="pointer" onClick={() => setActiveDropdown(activeDropdown === "Motion Detection" ? null : "Motion Detection")} mb={4}>
                                    <Text>Motion Detection</Text>
                                    <Icon as={activeDropdown === "Motion Detection" ? ChevronUpIcon : ChevronDownIcon} />
                                </Flex>
                                {activeDropdown === "Motion Detection" && (
                                    <Box pl={4} pb={4}>
                                        <Flex justifyContent="space-between" mb={2}><Text>Enable</Text><Switch isChecked={motionEnabled} onChange={() => setMotionEnabled(!motionEnabled)} /></Flex>
                                        <Flex justifyContent="space-between" mb={2}><Text>Audio Alert</Text><Switch isChecked={motionAudioAlert} onChange={() => setMotionAudioAlert(!motionAudioAlert)} /></Flex>
                                        <Flex justifyContent="space-between" mb={4}><Text>Light Alert</Text><Switch isChecked={motionLightAlert} onChange={() => setMotionLightAlert(!motionLightAlert)} /></Flex>
                                        <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                            <Text flex="1">Sensitivity</Text>
                                            <Box flex="1" mx={4}><Slider value={motionSensitivity} onChange={setMotionSensitivity} min={0} max={100}><SliderTrack><SliderFilledTrack /></SliderTrack><SliderThumb /></Slider></Box>
                                            <Text>{motionSensitivity}</Text>
                                        </Flex>
                                        <Button size="sm" onClick={handleAISettings} colorScheme="blue">Save Motion Settings</Button>
                                    </Box>
                                )}
                            </Box>

                            {/* Human Detection */}
                            <Box>
                                <Flex justifyContent="space-between" alignItems="center" cursor="pointer" onClick={() => setActiveDropdown(activeDropdown === "Human Detection" ? null : "Human Detection")} mb={4}>
                                    <Text>Human Detection</Text>
                                    <Icon as={activeDropdown === "Human Detection" ? ChevronUpIcon : ChevronDownIcon} />
                                </Flex>
                                {activeDropdown === "Human Detection" && (
                                    <Box pl={4} pb={4}>
                                        <Flex justifyContent="space-between" mb={2}><Text>Enable</Text><Switch isChecked={humanEnabled} onChange={() => setHumanEnabled(!humanEnabled)} /></Flex>
                                        {productType && productType.includes("S-Series") && (
                                            <>
                                                <Flex justifyContent="space-between" mb={2}><Text>Audio Alert</Text><Switch isChecked={humanAudioAlert} onChange={() => setHumanAudioAlert(!humanAudioAlert)} /></Flex>
                                                <Flex justifyContent="space-between" mb={4}><Text>Light Alert</Text><Switch isChecked={humanLightAlert} onChange={() => setHumanLightAlert(!humanLightAlert)} /></Flex>
                                            </>
                                        )}
                                        {/* Sensitivity Logic */}
                                        {productType && productType.includes("S-Series") ? (
                                            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                                <Text flex="1">Sensitivity</Text>
                                                <Box flex="1" mx={4}><Slider value={humanSensitivity} onChange={setHumanSensitivity} min={0} max={10} step={2}><SliderTrack><SliderFilledTrack /></SliderTrack><SliderThumb /></Slider></Box>
                                                <Text>{humanSensitivity}</Text>
                                            </Flex>
                                        ) : (
                                            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                                                <Text>Sensitivity Level</Text>
                                                <Select value={humanSensitivityLevel} onChange={(e) => setHumanSensitivityLevel(e.target.value)} size="sm" maxW="60%">
                                                    <option value="lowest">Lowest</option>
                                                    <option value="low">Low</option>
                                                    <option value="normal">Normal</option>
                                                    <option value="high">High</option>
                                                    <option value="highest">Highest</option>
                                                </Select>
                                            </Flex>
                                        )}
                                        <Button size="sm" onClick={handleAISettings} colorScheme="blue">Save Human Settings</Button>
                                    </Box>
                                )}
                            </Box>

                        </Box>
                    )}

                </ModalBody>
                <ModalFooter>
                    {/* Footer content if needed */}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CameraSettingsModal;
