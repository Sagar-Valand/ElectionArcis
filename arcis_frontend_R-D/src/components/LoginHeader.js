import React from "react";
import {
  Box,
  Flex,
  Image,
  Switch,
  Text,
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  FormControl,
  FormLabel,
  Input,
  ModalFooter,
  Button,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react";

const LoginHeader = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Box
        px={6}
        w="100%"
        h="75px"
        // backgroundColor={"#FCFCFC"}
        zIndex={"99999"}
      >
        <Flex h={20} alignItems="center" justifyContent="space-between">
          {/* Company Logo - Left Side */}
          <Flex alignItems="center" gap={4}>
            {/* <Image
              src="/images/ArcisAiLogo.png"
              alt="Company Logo"
              boxSize="40px"
              w="107px"
              h="24px"
            /> */}
          </Flex>

          {/* Right Section */}
          <Flex alignItems="center" gap={3}>
            <Text>Light</Text>
            <Switch
              size="md"
              colorScheme="purple"
              isChecked={colorMode === "dark"} // Bind Switch to the color mode state
              onChange={toggleColorMode}
              sx={{
                "& .chakra-switch__track": {
                  backgroundColor: colorMode === "dark" ? "#54637A" : "#C8D6E5", // Custom track color
                },
                "& .chakra-switch__thumb": {
                  backgroundColor: colorMode === "dark" ? "#C8D6E5" : "#54637A", // Custom thumb color
                },
              }}
            />
            <Text>Dark</Text>
          </Flex>
        </Flex>
      </Box>

      {/* Modal for Adding New Device */}
      <Modal onClose={onClose} isOpen={isOpen} isCentered size={"lg"}>
        <ModalOverlay />
        <ModalContent
          bg={useColorModeValue("white", "#231F1F")} // Use ColorModeValue for background
          color={useColorModeValue("black", "white")} // Use ColorModeValue for text color
        >
          <ModalHeader textAlign={"center"}>Add New Device</ModalHeader>
          <ModalBody pb={6} textAlign="center">
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              width="100%"
              padding="20px"
            >
              <FormControl width="300px" mt={5}>
                <FormLabel htmlFor="device-name" textAlign="start">
                  Enter Device Name:
                </FormLabel>
                <Input
                  id="device-name"
                  placeholder="Device Name"
                  borderColor="gray"
                  borderRadius="10px"
                  px={4}
                  _placeholder={{ color: "gray.400" }}
                />
              </FormControl>

              <FormControl width="300px" mt={4}>
                <FormLabel htmlFor="device-id" textAlign="start">
                  Enter Device ID:
                </FormLabel>
                <Input
                  id="device-id"
                  placeholder="Device ID"
                  borderColor="gray"
                  borderRadius="10px"
                  px={4}
                  _placeholder={{ color: "gray.400" }}
                />
              </FormControl>

              <Text
                fontSize="sm"
                mt={2}
                textAlign="start"
                color="gray.500"
                width="300px"
              >
                Find this ID in your mail
              </Text>
            </Box>
          </ModalBody>

          <ModalFooter justifyContent={"space-evenly"}>
            <Button
              onClick={onClose}
              w="150px"
              border="1px"
              background="none"
              color="red"
              borderColor="red"
              _hover={"none"}
            >
              Cancel
            </Button>
            <Button
              onClick={onClose}
              w="150px"
              background="#BF83FC"
              color="black"
              fontWeight={"normal"}
            >
              Save Device
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default LoginHeader;
