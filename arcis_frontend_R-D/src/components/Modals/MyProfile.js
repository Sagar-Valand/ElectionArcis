import { CheckIcon, EditIcon, InfoIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  Tabs,
  Text,
  TabPanel,
  ModalFooter,
  Button,
  Flex,
  IconButton,
  ModalCloseButton,
  TabPanels,
  Input,
  VStack,
  useColorModeValue,
  useToast,
  useBreakpointValue,
} from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { sendVerificationForUpdateMobile, UpdateName, userProfile, verifyMobileOtpForChangeMobile } from "../../actions/userActions";
import theme from "../../theme";
import { TbEdit, TbEditOff } from "react-icons/tb"; // Import the check icon
import { IoCheckmarkOutline } from "react-icons/io5";
// import { CheckIcon } from "react-icons/fa"; // Import the check icon from react-icons/fa

function MyProfile({ isOpen, onClose }) {
  const [profileDetails, setProfileDetails] = useState({
    name: "N/A",
    mobile: "N/A",
    email: "N/A",
  });
  const [editedDetails, setEditedDetails] = useState(profileDetails);
  const [fieldBeingEdited, setFieldBeingEdited] = useState(""); // Track the field being edited
  const [nameChanged, setNameChanged] = useState(false); // Track if name has changed
  const [mobileChanged, setMobileChanged] = useState(false); // Track if mobile has changed
  const [emailChanged, setEmailChanged] = useState(false); // Track if email has changed
  const [verifyModalField, setVerifyModalField] = useState(null); // Track the verification modal
  const [otp, setOtp] = useState(null);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const toast = useToast();
  const showToast = (msg, status) => {
    toast({
      description: msg,
      status: status,
      duration: 3000,
      position: "bottom-center",
      isClosable: true,
    });
  };

  const fetchUserDetails = async () => {
    try {
      const response = await userProfile();
      const user = response.user;

      setProfileDetails({
        name: user.name || "N/A",
        mobile: user.mobile || "N/A",
        email: user.email || "N/A",
      });
      setEditedDetails({
        name: user.name || "N/A",
        mobile: user.mobile || "N/A",
        email: user.email || "N/A",
      });
    } catch (error) {
      console.error("Error fetching user Details:", error);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const handleEditToggle = (field) => {
    if (fieldBeingEdited === field) {
      setFieldBeingEdited(""); // If the same field is clicked, toggle off
    } else {
      setFieldBeingEdited(field); // Set the field being edited
    }
  };

  const handleInputChange = (e, field) => {
    const updatedDetails = { ...editedDetails, [field]: e.target.value };
    setEditedDetails(updatedDetails); // Update the field value

    // Track if the field value has changed
    if (field === "name")
      setNameChanged(updatedDetails.name !== profileDetails.name);
    if (field === "mobile")
      setMobileChanged(updatedDetails.mobile !== profileDetails.mobile);
    if (field === "email")
      setEmailChanged(updatedDetails.email !== profileDetails.email);
  };

  const handleUpdateName = async () => {
    try {
      const response = await UpdateName(editedDetails.name);
      if (response.status === 200) {
        localStorage.setItem("name", editedDetails.name);
        showToast(response.data.data, "success");
      } else {
        showToast(response.data.data, "error");
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleVerifyClick = async (field) => {
    try {
      setVerifyModalField(field); // Open the verify modal for the selected field
      const repsonse = await sendVerificationForUpdateMobile(editedDetails.mobile);
      console.log('send otppp', repsonse);
    } catch (error) {
      console.error("Error fetching user Details:", error);
    }
  };

  const handleMobileOtpSubmit = async () => {
    try {
      const response = await verifyMobileOtpForChangeMobile(editedDetails.mobile, otp);
      console.log('handlemobileupdate', response);
      fetchUserDetails();
      closeVerifyModal();
      onClose();
      toast.success('Mobile Number Updated Successfully');
    } catch (error) {
      console.error("Error fetching user Details:", error);
      toast.error('Failed to update mobile number. Please try again.');
    }
  }

  const closeVerifyModal = () => {
    setVerifyModalField(null); // Close the verify modal
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        isCentered
        size="2xl"
        height="400px"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader textAlign={"center"}>My Profile</ModalHeader>
          <ModalCloseButton onClick={onClose} />
          <ModalBody>
            <Tabs variant="unstyled">
              <TabList>
                <Tab
                  _selected={{
                    fontWeight: "bold",
                    borderBottom: "4px solid",
                    borderColor: useColorModeValue(
                      theme.colors.custom.primary,
                      theme.colors.custom.darkModeText
                    ),
                  }}
                  fontSize={{ base: "xs", md: "sm" }}
                >
                  Account
                </Tab>
                <Tab
                  _selected={{
                    fontWeight: "bold",
                    borderBottom: "4px solid",
                    borderColor: useColorModeValue(
                      theme.colors.custom.primary,
                      theme.colors.custom.darkModeText
                    ),
                  }}
                  fontSize={{ base: "xs", md: "sm" }}
                >
                  Access and security
                </Tab>
                <Tab
                  _selected={{
                    fontWeight: "bold",
                    borderBottom: "4px solid",
                    borderColor: useColorModeValue(
                      theme.colors.custom.primary,
                      theme.colors.custom.darkModeText
                    ),
                  }}
                  fontSize={{ base: "xs", md: "sm" }}
                >
                  Notification and email
                </Tab>
              </TabList>
              <TabPanels>
                {/* Account Tab */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {isMobile ? (
                      // Mobile View Layout
                      <>
                        <Flex justify="space-between" align="center">
                          <Text>Name:</Text>
                          <Text>{profileDetails.name}</Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                          <Text>Mobile:</Text>
                          <Text>{profileDetails.mobile}</Text>
                        </Flex>
                        <Flex justify="space-between" align="center">
                          <Text>Email:</Text>
                          <Text>{profileDetails.email}</Text>
                        </Flex>
                      </>
                    ) : (
                      <>
                        {/* User Name Row */}
                        <Flex justify="space-between" align="center">
                          <Flex
                            justify="space-between"
                            flexDirection={"column"}
                          >
                            <Flex align="center">
                              <Text>User name</Text>
                              <IconButton
                                aria-label={
                                  fieldBeingEdited === "name"
                                    ? "Save username"
                                    : "Edit username"
                                }
                                icon={
                                  fieldBeingEdited === "name" ? (
                                    <TbEditOff />
                                  ) : (
                                    <TbEdit />
                                  )
                                } // Conditionally render icon
                                size="sm"
                                ml={2}
                                variant="ghost"
                                onClick={() => handleEditToggle("name")}
                              />
                            </Flex>
                            {fieldBeingEdited === "name" ? (
                              <Flex align="center">
                                <Input
                                  value={editedDetails.name}
                                  onChange={(e) => handleInputChange(e, "name")}
                                  width={`${Math.max(
                                    5 + editedDetails.name.length
                                  )}ch`} // Adjust width dynamically
                                />
                                {nameChanged && (
                                  <IoCheckmarkOutline
                                    color="green"
                                    size={20}
                                    ml={2}
                                    onClick={() => handleUpdateName()}
                                    cursor={"pointer"}
                                  />
                                )}
                              </Flex>
                            ) : (
                              <Flex align="center">
                                <Text>{profileDetails.name}</Text>
                              </Flex>
                            )}
                          </Flex>

                          {/* Mobile Number Row */}
                          <Flex
                            justify="space-between"
                            flexDirection={"column"}
                          >
                            <Flex align="center">
                              <Text>Mobile number</Text>
                              <IconButton
                                aria-label={
                                  fieldBeingEdited === "mobile"
                                    ? "Save mobile number"
                                    : "Edit mobile number"
                                }
                                icon={
                                  fieldBeingEdited === "mobile" ? (
                                    <TbEditOff />
                                  ) : (
                                    <TbEdit />
                                  )
                                } // Conditionally render icon
                                size="sm"
                                ml={2}
                                variant="ghost"
                                onClick={() => handleEditToggle("mobile")}
                              />
                            </Flex>
                            {fieldBeingEdited === "mobile" ? (
                              <Flex align="center">
                                <Input
                                  value={editedDetails.mobile}
                                  onChange={(e) =>
                                    handleInputChange(e, "mobile")
                                  }
                                  width={`${Math.max(
                                    5 + editedDetails.mobile.length
                                  )}ch`} // Adjust width dynamically
                                />
                                {mobileChanged && (
                                  <Button
                                    variant={"text"}
                                    color="green"
                                    fontSize="xs  "
                                    ml={0}
                                    cursor={"pointer"}
                                    onClick={() => handleVerifyClick("mobile")}
                                  >
                                    Verify
                                  </Button>
                                )}
                              </Flex>
                            ) : (
                              <Flex align="center">
                                <Text>{profileDetails.mobile}</Text>
                              </Flex>
                            )}
                          </Flex>

                          {/* Email Row */}
                          <Flex
                            justify="space-between"
                            flexDirection={"column"}
                          >
                            <Flex align="center">
                              <Text>Email</Text>
                              {/* <IconButton
                          aria-label={
                            fieldBeingEdited === "email"
                              ? "Save email"
                              : "Edit email"
                          }
                          icon={
                            fieldBeingEdited === "email" ? (
                              <TbEditOff />
                            ) : (
                              <TbEdit />
                            )
                          } // Conditionally render icon
                          size="sm"
                          ml={2}
                          variant="ghost"
                          onClick={() => handleEditToggle("email")}
                        /> */}
                            </Flex>
                            {fieldBeingEdited === "email" ? (
                              <Flex align="center">
                                <Input
                                  value={editedDetails.email}
                                  onChange={(e) =>
                                    handleInputChange(e, "email")
                                  }
                                  width={`${
                                    Math.max(editedDetails.email.length) + 5
                                  }ch`} // Adjust width dynamically
                                />
                                {emailChanged && (
                                  <Text color="green" fontSize="sm" ml={1}>
                                    Verify
                                  </Text>
                                )}
                              </Flex>
                            ) : (
                              <Flex align="center">
                                <Text>{profileDetails.email}</Text>
                              </Flex>
                            )}
                          </Flex>
                        </Flex>

                        {/* Action Buttons */}
                        <Flex
                          justify="flex-start"
                          mt={6}
                          borderTop="1px solid"
                          borderColor="gray.200"
                          pt={4}
                        >
                          <Button colorScheme="red" variant="link">
                            Delete Account
                          </Button>
                          <IconButton
                            aria-label="More info"
                            icon={<InfoIcon />}
                            size="sm"
                            ml={2}
                            variant="ghost"
                          />
                        </Flex>
                      </>
                    )}
                  </VStack>
                </TabPanel>

                {/* Other Tabs */}
                <TabPanel>
                  <p>Access and security content</p>
                </TabPanel>
                <TabPanel>
                  <p>Notification and email content</p>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>

          {/* <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Save Changes
            </Button>
          </ModalFooter> */}
        </ModalContent>
      </Modal>

      <Modal isOpen={!!verifyModalField} onClose={closeVerifyModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Verify {verifyModalField === "mobile" ? "Mobile Number" : "Email"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Enter the verification code sent to your{" "}
              {verifyModalField === "mobile" ? "mobile number" : "email"}:
            </Text>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Verification Code"
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={() => handleMobileOtpSubmit()}>
              Submit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default MyProfile;
