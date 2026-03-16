import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Flex,
  Image,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { io } from "socket.io-client";
import theme from "../theme";
import { useNavigate } from "react-router-dom";

const WebSocketComponent = () => {
  const email = localStorage.getItem("email"); // Get the logged-in user's email
  const socketURL = `wss://alert.arcisai.io:5082`; // WebSocket URL
  const toast = useToast();
const navigate = useNavigate();
  const buttonBG = useColorModeValue(theme.colors.custom.primary, theme.colors.custom.darkModePrimary);
  const buttonColor=useColorModeValue(theme.colors.custom.lightModeText ,theme.colors.custom.darkModeText);
  
  const formatEventType = (eventType, deviceSN, timeStamp) => {
    const formattedTime = new Date(timeStamp).toLocaleString();
    switch (eventType) {
      case "Human Detection":
        return `📢 Alert! A person has been detected near ${deviceSN} at ${formattedTime}.`;
      case "Face Detection":
        return `📸 Face Identified! A face was detected by ${deviceSN} at ${formattedTime}.`;
      case "LineCross Detection":
        return `🚧 Security Alert! Someone has crossed the virtual boundary set on ${deviceSN} at ${formattedTime}.`;
      case "REGIONENTER":
        return `🚪 Entry Alert! A subject has entered a monitored region on ${deviceSN} at ${formattedTime}.`;
      case "REGIONEXIT":
        return `🚶 Exit Alert! A subject has left a monitored region on ${deviceSN} at ${formattedTime}.`;
      case "OBJREMOVE":
        return `🛑 Missing Object Alert! An object has disappeared from the monitored area on ${deviceSN} at ${formattedTime}.`;
      case "Motion Detection":
        return `🎥 Motion Detected! Unexpected movement detected by ${deviceSN} at ${formattedTime}.`;
      case "UNATTENDED":
        return `🎒 Unattended Object Alert! A new object has appeared in a restricted area on ${deviceSN} at ${formattedTime}.`;
      default:
        return `🔔 Alert received from ${deviceSN} at ${formattedTime}.`;
    }
  };
   
  useEffect(() => {
    if (!email) {
      console.error("Email not found in localStorage");
      return;
    }

    const socket = io(socketURL, {
      transports: ["websocket"], // Use WebSocket transport
      reconnection: true, // Enable reconnection
      reconnectionAttempts: 10, // Retry 10 times before giving up
      reconnectionDelay: 3000, // Initial delay between attempts (3 seconds)
      reconnectionDelayMax: 5000, // Maximum delay between attempts (5 seconds)
    });

    socket.on("connect", () => {
      console.log("Socket.IO connection established");
    });
    socket.on("alert", (data) => {
      console.log("Received Socket.IO message:", data);
      // Check if the alert matches the logged-in user's email
      if (data.email === email) {
        // Format the alert data
        const deviceSN = data.cameraname || "N/A";
        const timeStamp = data.timeStamp || "N/A";
        const image = data.imageUrl
          ? `https://alert.arcisai.io${data.imageUrl}`
          : "N/A";
        const eventType = formatEventType(data.eventType, deviceSN, timeStamp);
        // Trigger a toast notification
        toast({
          title: "AI Alert",
          status: "info",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",

          render: ({ onClose }) => (
        <>
      
            <Box
          
              color={buttonColor}
              pl={4}
              pr={4}
              pb={4}
              pt={3}
              w={"100%"}
              maxW={"300px"}
              h="auto"
              // maxH={'90vh'}
              bg={buttonBG}
              borderRadius="10px"
              boxShadow="lg"
              transition="all 0.3s ease"
              _hover={{ boxShadow: "xl" }} // Adds a hover effect for interaction
            >
              <Flex justifyContent="space-between" alignItems="center">
                <Text fontWeight="bold" fontSize="lg" color={buttonColor}>
                  {data.eventType}
                </Text>
                <CloseButton onClick={onClose} size={"sm"} />
              </Flex>

              <Flex alignItems="center" mt={3}>
                <Text
                  fontSize={"12px"}
                  fontWeight={400}
                  lineHeight={"normal"}
                  mr={2}
                  color={buttonColor}
                >
                  {eventType}
                </Text>
                <Image
                  src={image}
                  alt="event-icon"
                  w={"25%"}
                  h={"auto"}
                  objectFit="contain" // Ensures the image fits well inside its container
                
                />
              </Flex>

              <Button
                  size="xs"
                  color={buttonColor}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevents click event from bubbling up
                    navigate('/reports'); // Navigate only when the button is clicked
                  }}
                  background={buttonBG}
                  variant={'solid'}
                  w="30%" // Makes the button span the full width
                  mt={3}              
                    >
                Details
              </Button>
          
            </Box>
          
            
            </>
          ),
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn("Socket.IO connection closed:", reason);
      if (reason === "io server disconnect") {
        // The server explicitly disconnected the client, reconnect manually
        socket.connect();
      }
    });
    socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    // Cleanup WebSocket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, [email, socketURL, toast]);

  return null; // Component doesn't need to render anything itself, only trigger toasts
};

export default WebSocketComponent;
