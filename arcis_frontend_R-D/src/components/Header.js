import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Image,
  Button,
  Switch,
  Text,
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
  Divider,
  Icon,
  IconButton
} from "@chakra-ui/react";
import { CgLogOff } from "react-icons/cg";
import {
  logout,
  logoutFromAllDevices,
} from "../actions/userActions";
import { useNavigate } from "react-router-dom";
import theme from "../theme";
import { FaRegBell, FaRegUser, FaMoon, FaSun } from "react-icons/fa6";
import { IoPower } from "react-icons/io5";
import MyProfile from "./Modals/MyProfile";
import { TimeIcon } from "@chakra-ui/icons";


const Header = ({
  toggleTextVisibility,
  isSidebarExpanded,
  setSidebarExpanded,
  isSidebarHovered
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeModal, setActiveModal] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { colorMode, toggleColorMode } = useColorMode();
  // const activeLogo = useColorModeValue(eciLogo, eciLogo1);

  // Define widths based on your sidebar design
  // Case 1: 80px (collapsed) | Case 2: 260px (expanded/hovered)
  // const sidebarWidth = isSidebarHovered ? "260px" : "80px";

  const textColor = useColorModeValue(
    "custom.lightModeText",
    "custom.darkModeText"
  );

  // Define background color so it isn't transparent
  const headerBg = useColorModeValue("white", "#231F1F");

  const navigate = useNavigate();

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, []);

  const logoutClick = async () => {
    await logout();
    navigate("/login");
  };

  const handleLogoutFromAllDevices = async () => {
    alert("Are you sure you want to Logout from all devices...");
    const response = await logoutFromAllDevices();
    navigate("/login");
  };

  const openModal = (modal) => {
    setActiveModal(modal);
    onOpen();
  };

  const openProfileModal = (modal) => {
    setActiveModal(modal);
    onOpen();
  };

  return (
    <Box
      px={6}
      w="100%"
      h="75px"
      // --- CHANGE IS HERE ---
      // 'relative' means it sits in the normal flow of the page.
      // When the page scrolls, this element scrolls up with it.
      position="relative"
      //  bg={headerBg}
      //  boxShadow="sm" // Optional: adds a nice shadow under the header
      // ---------------------
      color={textColor}
    >

      <Flex
        h="75px"
        alignItems="center"
        px={6}
        justifyContent="space-between"
        borderBottom="1px solid"
        borderColor={useColorModeValue("gray.100", "gray.700")}

        // FIXED POSITIONING
        position="absolute"
        top="0"
        right="0"

        // --- EXACT CHANGE HERE ---
        // Match the Sidebar widths: 60px (collapsed) and 214px (expanded)
        left={{ base: 0, md: isSidebarExpanded ? "214px" : "60px" }}

        // --- EXACT CHANGE HERE ---
        // Use the SAME transition as your sidebar
        transition="left 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        zIndex="1000"
      >
            <Flex flex={1} justifyContent="flex-start">
        
        </Flex>
       

        {/* 2. CENTER SECTION */}
        <Flex flex={2} justifyContent="center">
          <Text
            fontWeight={600}
            textAlign="center"
            fontSize={{ base: "12px", md: "16px" }}
            lineHeight="1.2"
            color={textColor}
          >
            Live Webcasting & Monitoring <br /> Kerala
            Legislative Assembly Election 2026
          </Text>
        </Flex>

        {/* 3. RIGHT SECTION: Timer, Mode, Profile */}
        <Flex flex={1} justifyContent="flex-end" alignItems="center" gap={4}>
          <Flex alignItems="center" gap={2} display={{ base: "none", lg: "flex" }}>
            <TimeIcon boxSize="18px" />
            <Text fontSize="sm" fontWeight="semibold" whiteSpace="nowrap">
              {new Date().toLocaleTimeString()}
            </Text>
          </Flex>

          <IconButton
            aria-label="Toggle dark mode"
            icon={colorMode === "light" ? <FaMoon /> : <FaSun />}
            onClick={toggleColorMode}
            size="sm"
            borderRadius="12px"
          />

          <Menu isLazy>
            <MenuButton as={Button} p={0} variant="ghost">
              <FaRegUser size="20px" />
            </MenuButton>
            <MenuList>
              <MenuItem isDisabled fontWeight="bold">{localStorage.getItem("name")}</MenuItem>
              <Divider />
              <MenuItem
                icon={<CgLogOff size="18px" />}
                onClick={() => openModal("logout")}
                color="red.600"
                fontSize="sm"
              >
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>

      {/* Logout Modal */}
      <Modal
        isOpen={isOpen && activeModal === "logout"}
        onClose={onClose}
        isCentered
      >
        <ModalOverlay />
        <ModalContent
          pt={3}
          pr={3}
          pl={3}
          pb={1}
          borderRadius="8px"
          boxShadow="lg"
          bg={useColorModeValue("white", "gray.800")}
        >
          <ModalHeader
            textAlign="center"
            fontSize="xl"
            fontWeight="bold"
            color={useColorModeValue("black", "white")}
          >
            Oh no! You're leaving... Are you sure?
          </ModalHeader>
          <ModalBody>
            <Flex direction="column" align="center" justify="center" mt={4}>
              <Icon as={IoPower} color="red.500" boxSize="50px" mb={4} />
              <Text
                textAlign="center"
                color={useColorModeValue("gray.800", "gray.200")}
                fontSize="md"
              >
                You will be signed out of your account. If you have unsaved
                changes, they will be lost.
              </Text>
            </Flex>
          </ModalBody>
          <Box>
            <Flex gap={4} mt={2} justifyContent="center">
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
                onClick={logoutClick}
                borderRadius="6px"
              >
                Logout
              </Button>
            </Flex>
          </Box>
          <Divider mt={2} />
          <Flex justifyContent={"center"}>
            <Button
              p={0}
              colorScheme="red"
              variant="ghost"
              textDecoration={"underline"}
              size="sm"
              w={"200px"}
              onClick={() => handleLogoutFromAllDevices()}
            >
              Logout from All Devices
            </Button>
          </Flex>
        </ModalContent>
      </Modal>

      {/* My Profile MOdal */}
      {isOpen && activeModal === "My Profile" && (
        <MyProfile isOpen={isOpen} onClose={onClose} />
      )}
    </Box>
  );
};

export default Header;
