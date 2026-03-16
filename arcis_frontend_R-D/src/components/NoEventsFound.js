import React from "react";
import { Box, Text, Icon, VStack, useColorModeValue } from "@chakra-ui/react";
import { TbCalendarCancel } from "react-icons/tb";

const NoEventsFound = ({ title, description }) => {
  return (
    <Box
      height="80vh" // Ensure the box takes up the full viewport height
      display="flex"
      alignItems="center" // Vertically center the content
      justifyContent="center" // Horizontally center the content
      bg={useColorModeValue("white", "custom.darkModeBg")}
      color={useColorModeValue("custom.lightModeText", "custom.darkModeText")}
      p={3}
      overflow="hidden" // Prevent scrolling
    >
      <VStack spacing={4} textAlign="center">
        <Icon as={TbCalendarCancel} boxSize={12} />
        <Text fontSize="xl" fontWeight="bold">
          Oh No! No {title} Events Detected:
        </Text>
        <Text fontSize="md" color="gray.600">
          {description}
        </Text>
      </VStack>
    </Box>
  );
};

export default NoEventsFound;
