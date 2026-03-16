import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Flex,
  Text,
  Button,
  Input,
  IconButton,
  useDisclosure,
  SimpleGrid,
  useBreakpointValue,
  Skeleton,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  AiOutlineSend,
  AiOutlineMessage,
  AiOutlineClose,
} from "react-icons/ai";
import MultipleView from "./MultipleView";
import theme from "../theme";
import axios from "axios";
import Player from "../components/Player";
import { getAllCameras, getSingleCamera } from "../actions/cameraActions";
import NoCameraFound from "../components/NoCameraFound";

const ChatPanel = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [message, setMessage] = useState("");
  const [isRotated, setIsRotated] = useState(false);
  const [device, setDevice] = useState([]);
  const [deviceIds, setDeviceIds] = useState([]);
  const [isToggled, setIsToggled] = React.useState(false); // Track switch state
  const [videoUrl, setVideoUrl] = useState([]);
  const [videoName, setVideoName] = useState([]);
  const [noStream, setNoStream] = useState(false);
  const [loading, setLoading] = useState(true); // Loading state
  const isMobile = window.innerWidth < 768;
  const bgColor = useColorModeValue("white", "#231F1F");
  const handleOpen = () => {
    onOpen();
    setIsRotated(true);
  };

  const handleClose = () => {
    onClose();
    setIsRotated(false);
  };

  // Fetch all camera device IDs
  const fetchAllCameras = async () => {
    try {
      const response = await getAllCameras(1, 1000, "", "");
      const userDevices = response.cameras.map((camera) => camera.deviceId);
      setDeviceIds(userDevices);
    } catch (error) {
      console.error("Error fetching cameras:", error);
    }
  };

  useEffect(() => {
    fetchAllCameras();
  }, []);

  useEffect(() => {
    if (deviceIds.length === 0) return; // Ensure deviceIds are available before proceeding

    const fetchStreamData = async () => {
      setLoading(true); // Start loading
      try {
        const response = await axios.get(
          "https://zmedia.arcisai.io:443/rtmp/api/list"
        );
        const streamData = response.data;

        // Filter streams based on device IDs
        const filteredPaths = streamData.filter((item) =>
          deviceIds.some((deviceId) => item.StreamName.includes(deviceId))
        );

        // Create a new array with updated AppName fetched from another API
        const updatedPaths = await Promise.all(
          filteredPaths.map(async (item) => {
            try {
              // Extract the value after 'RTSP-' from item.Path
              const pathKey = item.Path.split("RTSP-")[1]; // Extract the part after 'RTSP-'
              if (!pathKey) {
                throw new Error(`Invalid path format: ${item.Path}`);
              }

              // Call the API to get the name using the extracted value
              const nameResponse = await getSingleCamera(pathKey);
              const nameData = nameResponse.data; // Assuming nameData contains the name
              return { Path: item.Path, AppName: nameData.name || "Unknown" }; // Fallback to "Unknown" if name is missing
            } catch (err) {
              console.error("Error fetching name for stream:", err);
              return { Path: item.Path, AppName: "Unknown" }; // Fallback to "Unknown" if API fails
            }
          })
        );

        if (updatedPaths.length > 0) {
          setVideoUrl(updatedPaths.map((item) => item.Path));
          setVideoName(updatedPaths.map((item) => item.AppName));
          setNoStream(false);
        } else {
          setVideoUrl([]);
          setNoStream(true);
        }
      } catch (error) {
        console.error("Error fetching stream data:", error);
        setNoStream(true);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchStreamData();
  }, [deviceIds]);

  const width = useBreakpointValue({ base: "100%" });
  const getResponsivePlayerStyle = () => ({
    width,
    height: "auto",
    aspectRatio: "16 / 9",
    borderRadius: "8px",
  });

  return (
    <Box
      maxW="1440px"
      mx="auto"
      // p={3}
      height={isMobile ? "calc(100vh - 90px)" : "auto"}
    >
      {/* Video Feed Section */}
      <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="bold">
        AI Feeds
      </Text>
      {loading ? (
        <SimpleGrid columns={2} spacing={2} mt={2}>
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} height="200px" borderRadius="md" />
          ))}
        </SimpleGrid>
      ) : noStream ? (
        <NoCameraFound
          title="Ai Feeds of"
          description="Check camera subscriptions or contact our support."
        />
      ) : (
        <SimpleGrid columns={2} spacing={2} mt={2}>
          {videoUrl.map((aiurl, index) => (
            <Box key={index}>
              <Player
                device={device}
                style={getResponsivePlayerStyle()}
                initialPlayUrl={`https://zmedia.arcisai.io:443/hdl/${aiurl}.flv`}
                showControls={false}
              />
              <Text fontWeight="bold" fontSize="xs" p={1}>
                {videoName[index] || "Unknown"}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}

      {/* Floating Chat */}
      <IconButton
        position="fixed"
        bottom="20px"
        right="20px"
        bg={theme.colors.custom.primary}
        color="white"
        borderRadius="full"
        p={3}
        shadow="lg"
        onClick={isOpen ? handleClose : handleOpen}
        icon={isOpen ? <AiOutlineClose /> : <AiOutlineMessage />}
        aria-label="Chat Button"
      />

      {/* Chat Modal */}
      {isOpen && (
        <Box
          position="fixed"
          top="90px"
          right="10px"
          w="30%"
          h="80%"
          bg={bgColor}
          borderLeftRadius="lg"
          boxShadow="lg"
          p={4}
          zIndex="10"
          overflowY="auto"
          css={{
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
            },
          }}
        ></Box>
      )}
    </Box>
  );
};

export default ChatPanel;
