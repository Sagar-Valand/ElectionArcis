import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  useBreakpointValue,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  SimpleGrid,
  Spinner, // --- CHANGE 1: Import Spinner for loading state
} from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getStreamDetails,
  setImageUrl,
  setImageUrll,
} from "../actions/cameraActions";
import Player from "../components/Player";
import SimpleFLVPlayer from "../components/SimpleFLVPlayer";
import axios from "axios";
import MobileHeader from "../components/MobileHeader";
import { RiArrowGoBackLine } from "react-icons/ri";
import { CiStreamOn } from "react-icons/ci";

const CameraView = () => {
  // --- CHANGE 2: Initialize device as `null` and add loading state
  const [device, setDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { deviceId } = useParams();
  const location = useLocation();
  const { status } = location.state || {};
  const navigate = useNavigate();
  const width = useBreakpointValue({ base: "100%" });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isToggled, setIsToggled] = React.useState(false);
  const [videoUrl, setVideoUrl] = useState([]);
  const [noStream, setNoStream] = useState(false);

  const getResponsivePlayerStyle = () => ({
    width,
    height: "auto",
    aspectRatio: "16 / 9",
    borderRadius: "8px",
  });

  const textColor = useColorModeValue(
    "custom.secondaryTextColor",
    "custom.darkModeText"
  );

  // --- CHANGE 3: Update fetch function to manage loading state
  const fetchStreamDetails = async (deviceId) => {
    setIsLoading(true); // Start loading
    try {
      const response = await getStreamDetails(deviceId);
      console.log("Get getStreamDetails", response);

      if (
        response.success &&
        response.streamData &&
        response.streamData.length > 0
      ) {
        setDevice(response.streamData[0]);
      } else {
        setDevice(null); // Set to null if not found
      }
    } catch (error) {
      console.error("Error fetching camera details:", error);
      setDevice(null);
    } finally {
      setIsLoading(false); // Stop loading regardless of outcome
    }
  };

  // (handleToggle, handleModalClose, handleBack functions remain the same)
  const handleToggle = () => {
    setIsToggled(!isToggled);
    if (!isToggled) {
      onOpen();
    } else {
      onClose();
    }
  };

  const handleModalClose = () => {
    onClose();
    setIsToggled(false);
  };

  const handleBack = () => {
    try {
      console.log("handleBack function called");
      setImageUrll(deviceId);
    } catch (error) {
      console.error("Error in handleBack:", error);
    } finally {
      navigate("/cameras");
    }
  };

  // Fetch stream details when the page loads
  useEffect(() => {
    if (deviceId) {
      fetchStreamDetails(deviceId);
    }
  }, [deviceId]);

  // --- CHANGE 4: Add a guard clause to this effect
  useEffect(() => {
    // Don't run this if we don't have device details yet
    if (!device || !device.deviceId) {
      return;
    }

    const fetchStreamData = async () => {
      try {
        const response = await axios.get(
          "https://zmedia.arcisai.io:443/rtmp/api/list"
        );
        const streamData = response.data;
        const matchedPaths = streamData
          .filter((item) => item.StreamName === `RTSP-${device.deviceId}`)
          .map((item) => item.Path);

        if (matchedPaths.length > 0) {
          setVideoUrl(matchedPaths);
          setNoStream(false);
        } else {
          setVideoUrl([]);
          setNoStream(true);
        }

        console.log("Matched AI Stream Paths:", matchedPaths);
      } catch (error) {
        console.error("Error fetching AI stream data:", error);
        setNoStream(true);
      }
    };

    fetchStreamData();
  }, [device]); // This dependency on 'device' is now safer

  // --- CHANGE 5: Handle loading and error states before rendering the player
  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Spinner size="xl" />
        <Text ml={4}>Loading Camera Details...</Text>
      </Flex>
    );
  }

  if (!device) {
    return (
      <Flex justify="center" align="center" height="80vh">
        <Text>Camera not found or failed to load details.</Text>
      </Flex>
    );
  }

  // --- CHANGE 6: Define the URL *after* the loading checks. It is now safe.
  // --- CHANGE 6: Define the URL with SSAN support ---
  let url = "";
  if (device) {
    if (device.deviceId && device.deviceId.startsWith("SSAN")) {
      url = `wss://ptz.vmukti.com/live-record/${device.deviceId}.flv`;
    } else if (device.plan === "LIVE" && device.p2purl && device.token) {
      url = `https://${device.deviceId}.${device.p2purl}/flv/live_ch0_0.flv?verify=${device.token}`;
    } else if (device.mediaUrl) {
      url = `wss://${device.mediaUrl}/jessica/DVR/${device.deviceId}.flv`;
    }
  }

  return (
    <>
      {/* Mobile Header */}
      <MobileHeader title="Camera View" />

      <Box
        mt={{ base: "12", md: "0" }}
        mb={{ base: "20", md: "5" }}
        p={{ base: 3, md: 0 }}
        maxW="1440px"
        mx="auto"
      // color={useColorModeValue("custom.lightModeText", "custom.darkModeText")}
      >
        <Flex
          justifyContent="space-between"
          alignItems="center"
          p={{ base: 2, md: 3 }}
          borderBottom="1px solid"
          borderColor="gray.200"
          mb={4}
        >
          <Text
            display="flex"
            fontSize={{ base: "sm", md: "md" }}
          >
            <Box
              as="span"
              onClick={handleBack}
              cursor="pointer"
              _hover={{ color: "blue.500" }}
              fontWeight={"bold"}
            >
              Camera
            </Box>

            <Box as="span" color={textColor} fontWeight="medium">
              {device.cameraName}
            </Box>
          </Text>
          <Text
            fontSize={{ base: "sm", md: "md" }}
            color={textColor}
            cursor="pointer"
            display="flex"
            alignItems="center"
            _hover={{ color: "blue.500" }}
            onClick={handleBack}
          >
            <RiArrowGoBackLine style={{ marginRight: "8px" }} />
            Back
          </Text>
        </Flex>

        <Box
          position="relative"
          borderRadius="lg"
          w="100%"
        >
          {/* CONDITIONAL RENDER: Use FLV Player for SSAN, otherwise standard Player */}
          {device.deviceId && device.deviceId.startsWith("SSAN") ? (
            <SimpleFLVPlayer
              url={url}
              style={getResponsivePlayerStyle()}
            />
          ) : (
            <Player
              device={device}
              initialPlayUrl={url}
              style={getResponsivePlayerStyle()}
              width="100%"
              height="100%"
              status={status}
              showControls={true}
              className=""
            />
          )}
        </Box>
      </Box>

      {/* The Modal part remains the same */}
      {isToggled && (
        <Modal isOpen={isOpen} onClose={handleModalClose} size="full">
          <ModalOverlay />
          <ModalContent bg="white">
            <ModalCloseButton
              position="absolute"
              top="10px"
              right="10px"
              zIndex="10"
              color={"Red"}
            />
           <ModalBody>
              <SimpleGrid columns={2} spacing={2}>
                {/* CONDITIONAL RENDER FOR MODAL */}
                {device.deviceId && device.deviceId.startsWith("SSAN") ? (
                  <SimpleFLVPlayer
                    url={url}
                    style={{ width: "48vw", height: "55vh" }}
                  />
                ) : (
                  <Player
                    device={device}
                    style={{ width: "48vw", height: "55vh" }}
                    initialPlayUrl={url}
                    showControls={false}
                  />
                )}
                
                {/* AI Streams (Keep as is) */}
                {videoUrl.map((aiurl, index) => (
                  <Player
                    key={index}
                    device={device}
                    style={{ width: "48vw", height: "55vh" }}
                    initialPlayUrl={`https://zmedia.arcisai.io:443/jessica/${aiurl}.flv`}
                    showControls={false}
                  />
                ))}
              </SimpleGrid>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default CameraView;
