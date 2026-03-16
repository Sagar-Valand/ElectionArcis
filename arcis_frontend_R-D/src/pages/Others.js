import React, { useState } from "react";
import {
  Box,
  Button,
  VStack,
  Icon,
  Text,
  Image,
  Flex,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  FormControl,
  FormLabel,
  ModalFooter,
  Input,
  useToast,
  useBreakpointValue,
  Divider,
  Collapse
} from "@chakra-ui/react";
import { FaRegUser } from "react-icons/fa";
import { GoThumbsup } from "react-icons/go";
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation
import { RiCalendarScheduleLine } from "react-icons/ri";
import { IoDocumentTextOutline, IoPower } from "react-icons/io5";
import { TbDeviceCctv } from "react-icons/tb";
import { RiCheckboxMultipleBlankLine, RiSettings3Line, RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import theme from "../theme";
import { logout, logoutFromAllDevices } from "../actions/userActions";
import { addDevice } from "../actions/cameraActions";
import MyProfile from "../components/Modals/MyProfile";
import { TbCoinRupee, TbInfoCircle } from "react-icons/tb";

const menuItems = [
   {
    label: "View",
    icon: TbDeviceCctv,
    subItems: [
      { label: "List view", path: "/listview" },
      { label: "Map view", path: "/MapView" },
    ],
  },
  {
    label: "Heatmap",
    icon: RiCheckboxMultipleBlankLine,
    path: "/Heatmapp",
  },
  {
    label: "Reports",
    icon: IoDocumentTextOutline,
    subItems: [
      { label: "Camera", path: "/DowntimeReport" },
      { label: "Installation", path: "/InstallationReport" },
      { label: "Connected", path: "/ConnectedonceReport" },
    ],
  },
  {
    label: "Helpdesk Activity",
    icon: IoDocumentTextOutline,
    path: "/helpdesk",
  },
  {
    label: "Master",
    icon: RiSettings3Line,
    subItems: [
      { label: "Master", path: "/EditableReport" },
      { label: "Inventory Master", path: "/inventoryUpdation" },
      { label: "Incidence Master", path: "/incidenceMaster" },
    ],
  },
];

const Others = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeModal, setActiveModal] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null); // Track which submenu is open
  const [deviceId, setDeviceId] = useState("");
  const [cameraName, setCameraName] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  const textColor = useColorModeValue("custom.lightModeText", "custom.darkModeText");

  const logoutClick = async () => {
    await logout();
    navigate("/login");
  };

  const openModal = (modal) => {
    setActiveModal(modal);
    onOpen();
  };

  const closeModal = () => {
    setActiveModal(null);
    onClose();
  };

  const handleAddDevice = async () => {
    try {
      await addDevice(cameraName, deviceId);
      toast({ title: "Device Added", status: "success", duration: 3000 });
      closeModal();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add device", status: "error" });
    }
  };

  const handleLogoutFromAllDevices = async () => {
    alert("Are you sure you want to Logout from all devices...");
    await logoutFromAllDevices();
    navigate("/login");
  };

  const toggleSubmenu = (label) => {
    setOpenSubmenu(openSubmenu === label ? null : label);
  };

  return (
    <Box
      bg={useColorModeValue("white", "custom.darModeBg")}
      color={textColor}
      p={2}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
    >
      {/* Header */}
      <Flex textAlign="center" mb={6} justifyContent="center" alignItems="center" direction={"column"} mt={10}>
        <Image src="/images/ArcisAiLogo.png" width={"30%"} height={"auto"} alt="ArcisAI Logo" />
      </Flex>

      {/* Menu Items */}
      <VStack align="stretch" spacing={2} w="100%" p={2} flex={0}>
        {menuItems.map((item, index) => (
          <Box key={index}>
            {item.path ? (
              <Link to={item.path}>
                <Flex align="center" p={2} cursor="pointer" _hover={{ fontWeight: "700" }}>
                  <Icon as={item.icon} fontSize="23px" color="custom.bottomNavText" />
                  <Text fontWeight="normal" fontSize="18px" ml={4} color="custom.bottomNavText">
                    {item.label}
                  </Text>
                </Flex>
              </Link>
            ) : (
              <>
                <Flex
                  align="center"
                  p={2}
                  cursor="pointer"
                  justifyContent="space-between"
                  onClick={() => toggleSubmenu(item.label)}
                  _hover={{ fontWeight: "700" }}
                >
                  <Flex align="center">
                    <Icon as={item.icon} fontSize="23px" color="custom.bottomNavText" />
                    <Text fontWeight="normal" fontSize="18px" ml={4} color="custom.bottomNavText">
                      {item.label}
                    </Text>
                  </Flex>
                  <Icon as={openSubmenu === item.label ? RiArrowUpSLine : RiArrowDownSLine} />
                </Flex>
                <Collapse in={openSubmenu === item.label} animateOpacity>
                  <VStack align="stretch" pl={10} mt={1} spacing={1}>
                    {item.subItems?.map((sub, idx) => (
                      <Link key={idx} to={sub.path}>
                        <Text fontSize="16px" p={1} color="gray.500" _hover={{ color: textColor, fontWeight: "600" }}>
                          {sub.label}
                        </Text>
                      </Link>
                    ))}
                  </VStack>
                </Collapse>
              </>
            )}
          </Box>
        ))}

        <Flex
          align="center"
          w="full"
          p={2}
          borderRadius="md"
          cursor="pointer"
          _hover={{ bg: "red.50" }}
          transition="all 0.2s ease"
          onClick={() => openModal("logout")}
        >
          <Icon as={IoPower} boxSize={5} color="red.600" />
          <Text fontSize="lg" color="red.600" fontWeight="semibold" ml={4}>
            Logout
          </Text>
        </Flex>
      </VStack>

      {isOpen && activeModal === "My Profile" && <MyProfile isOpen={isOpen} onClose={onClose} />}

      {/* Add Device Id Modal */}
      <Modal onClose={onClose} isOpen={isOpen && activeModal === "addNewDevice"} isCentered size={"lg"}>
        <ModalOverlay />
        <ModalContent bg={useColorModeValue("white", theme.colors.custom.darkModeBg)} color={"black"}>
          <ModalHeader textAlign={"center"} p={1} mt={4} color={textColor}>
            Add New Device
          </ModalHeader>
          <ModalBody pb={6} textAlign="center">
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" width="100%" p={1}>
              <FormControl width="350px" mt={5}>
                <FormLabel color={textColor}>Enter Device Name:</FormLabel>
                <Input
                  placeholder="Device Name"
                  value={cameraName}
                  onChange={(e) => setCameraName(e.target.value)}
                  _focus={{ borderColor: theme.colors.custom.primary }}
                />
              </FormControl>
              <FormControl width="350px" mt={4}>
                <FormLabel color={textColor}>Enter Device ID:</FormLabel>
                <Input
                  placeholder="Device ID"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  _focus={{ borderColor: theme.colors.custom.primary }}
                />
              </FormControl>
            </Box>
          </ModalBody>
          <ModalFooter justifyContent={"space-evenly"}>
            <Button onClick={onClose} variant="outline" colorScheme="red">Cancel</Button>
            <Button onClick={handleAddDevice} bg={theme.colors.custom.primary} color="white">Save Device</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Logout Modal */}
      <Modal isOpen={isOpen && activeModal === "logout"} onClose={onClose} isCentered size={{ base: "sm", md: "xl" }}>
        <ModalOverlay />
        <ModalContent p={6} borderRadius="8px" bg={useColorModeValue("white", "gray.800")}>
          <ModalHeader textAlign="center" fontWeight="bold">Oh no! You're leaving...</ModalHeader>
          <ModalBody>
            <Flex direction="column" align="center" mt={4}>
              <Icon as={IoPower} color="red.500" boxSize="50px" mb={4} />
              <Text textAlign="center">You will be signed out of your account.</Text>
            </Flex>
          </ModalBody>
          <Flex gap={4} p={4} justifyContent="center">
            <Button onClick={onClose} variant="outline" colorScheme="red">Cancel</Button>
            <Button colorScheme="purple" onClick={logoutClick}>Logout</Button>
          </Flex>
          <Divider mt={2} />
          <Flex justifyContent={"center"}>
            <Button variant="ghost" colorScheme="red" size="sm" onClick={handleLogoutFromAllDevices}>
              Logout from All Devices
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Others;
