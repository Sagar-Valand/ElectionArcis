import { Box, IconButton, useColorModeValue } from "@chakra-ui/react";
import {
  FiArrowUp,
  FiArrowDown,
  FiArrowLeft,
  FiArrowRight,
  FiZoomIn,
  FiZoomOut,
} from "react-icons/fi";
import { BsArrowsFullscreen } from "react-icons/bs";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { handlePtzAction } from "../actions/settingsActions";

const CameraPTZ = ({ deviceId, onZoomIn, onZoomOut, onFullscreen, ...props }) => {
  const bgColor = useColorModeValue(
    "rgba(0, 0, 0, 0.6)",
    "rgba(255, 255, 255, 0.6)"
  );
  const iconColor = useColorModeValue("#fff", "#000");

  const [topPosition, setTopPosition] = useState("70%");
  const [rightPosition, setRightPosition] = useState("7%");

  useEffect(() => {
    const updatePosition = () => {
      // If props provide positioning, disable auto-positioning logic
      if (props.style || props.position || props.top || props.right) return;

      const screenWidth = window.innerWidth;
      // console.log("Rekha1:", deviceId);
      if (screenWidth < 321) {
        setTopPosition("7%");
        setRightPosition("1%");
      } else if (screenWidth < 376) {
        setTopPosition("16%");
        setRightPosition("1%");
      } else if (screenWidth < 481) {
        setTopPosition("21%");
        setRightPosition("1%");
      } else if (screenWidth < 769) {
        setTopPosition("38%");
        setRightPosition("1%");
      } else if (screenWidth < 1025) {
        setTopPosition("47%");
        setRightPosition("1%");
      } else {
        setTopPosition("25%");
        // setRightPosition("0%");
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [props.style, props.position, props.top, props.right]);

  const handlePTZ = async (direction) => {
    try {
      const response = await handlePtzAction(direction, deviceId);
      console.log(`PTZ move: ${direction}`);
    } catch (error) {
      console.error('Error handling PTZ:', error);
    }
  }

  // Determine styles: prefer props, fallback to internal state
  const boxStyles = {
    position: "absolute",
    top: topPosition,
    right: rightPosition,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    alignItems: "center",
    zIndex: 100,
    ...props // Override with any passed props (e.g., styles, position)
  };

  return (
    <Box {...boxStyles}>
      <Box
        display="grid"
        gridTemplateColumns="repeat(3, 1fr)"
        gridTemplateRows="repeat(3, 1fr)"
        gap="5px"
        alignItems="center"
        justifyContent="center"
      >
        <Box />
        <IconButton
          aria-label="Move Up"
          icon={<FiArrowUp />}
          onClick={() => handlePTZ("UP")}
          bg={bgColor}
          color={iconColor}
          borderRadius="full"
          w={{ base: "30px", md: "44px" }}
          h={{ base: "30px", md: "44px" }}
          minW="unset"
        />
        <Box />
        <IconButton
          aria-label="Move Left"
          icon={<FiArrowLeft />}
          onClick={() => handlePTZ("LEFT")}
          bg={bgColor}
          color={iconColor}
          borderRadius="full"
          w={{ base: "30px", md: "44px" }}
          h={{ base: "30px", md: "44px" }}
          minW="unset"
        />
        <Box />
        <IconButton
          aria-label="Move Right"
          icon={<FiArrowRight />}
          onClick={() => handlePTZ("RIGHT")}
          bg={bgColor}
          color={iconColor}
          borderRadius="full"
          w={{ base: "30px", md: "44px" }}
          h={{ base: "30px", md: "44px" }}
          minW="unset"
        />
        <Box />
        <IconButton
          aria-label="Move Down"
          icon={<FiArrowDown />}
          onClick={() => handlePTZ("DOWN")}
          bg={bgColor}
          color={iconColor}
          borderRadius="full"
          w={{ base: "30px", md: "44px" }}
          h={{ base: "30px", md: "44px" }}
          minW="unset"
        />
        <Box />
      </Box>
      {/* Zoom Controls */}
      <Box display="flex" gap={2}>
        <IconButton
          aria-label="Zoom In"
          icon={<FiZoomIn />}
          onClick={() => {
            console.log("Zoom In Clicked in CameraPTZ");
            if (onZoomIn) {
              console.log("Executing onZoomIn prop");
              onZoomIn();
            } else {
              console.log("Fallback to handlePTZ(zoomin)");
              handlePTZ("zoomin");
            }
          }}
          bg={bgColor}
          color={iconColor}
          borderRadius="full"
          w={{ base: "30px", md: "44px" }}
          h={{ base: "30px", md: "44px" }}
          minW="unset"
        />
        <IconButton
          aria-label="Zoom Out"
          icon={<FiZoomOut />}
          onClick={() => {
            console.log("Zoom Out Clicked in CameraPTZ");
            if (onZoomOut) {
              console.log("Executing onZoomOut prop");
              onZoomOut();
            } else {
              console.log("Fallback to handlePTZ(zoomout)");
              handlePTZ("zoomout");
            }
          }}
          bg={bgColor}
          color={iconColor}
          borderRadius="full"
          w={{ base: "30px", md: "44px" }}
          h={{ base: "30px", md: "44px" }}
          minW="unset"
        />
      </Box>
      {/* Fullscreen Button */}
      {onFullscreen && (
        <IconButton
          aria-label="Fullscreen"
          icon={<BsArrowsFullscreen />}
          onClick={onFullscreen}
          bg={bgColor}
          color={iconColor}
          borderRadius="full"
          w={{ base: "30px", md: "44px" }}
          h={{ base: "30px", md: "44px" }}
          minW="unset"
          mt={2}
        />
      )}
    </Box>
  );
};

export default CameraPTZ;
