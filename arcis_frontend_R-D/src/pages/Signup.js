import {
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Heading,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  // Link,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { signup } from "../actions/userActions";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { BsQuestionCircle } from "react-icons/bs";
import theme from "../theme";
import TermsOfService from "../components/TermsOfService";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOTP] = useState(["", "", "", "", "", ""]);
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);
  const bgColor = useColorModeValue("custom.primary", "custom.darkModePrimary");
  const [nameError, setNameError] = useState(false);
  const [mobileError, setMobileError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [nameValid, setNameValid] = useState(true);
  const [mobileValid, setMobileValid] = useState(true);
  const [emailValid, setEmailValid] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const textColor = useColorModeValue(
    "custom.lightModeText",
    "custom.darkModeText"
  );

  const toast = useToast();
  const showToast = (msg, status1) => {
    toast({
      description: msg,
      status: status1,
      duration: 2000,
      position: "bottom-left",
      isClosable: false,
    });
  };
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);

  const handleNameChange = (e) => {
    setName(e.target.value);
    if (validateName(e.target.value)) {
      setNameValid(true);
    } else {
      setNameValid(false);
    }
  };

  const handleMobileChange = (e) => {
    setMobile(e.target.value);
    if (validateMobile(e.target.value)) {
      setMobileValid(true);
    } else {
      setMobileValid(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (validateEmail(e.target.value)) {
      setEmailValid(true);
    } else {
      setEmailValid(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (validatePassword(e.target.value)) {
      setPasswordValid(true);
    } else {
      setPasswordValid(false);
    }
  };

  // Validate Name
  const validateName = (name) => {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
  };

  // Validate Mobile
  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  // Validate Email
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Validate Password
  const validatePassword = (password) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleSendOtp = async (event) => {
    let isValid = true;
    let errorMessages = {}; // To store error messages for each field
    if (!name || !mobile || !email || !password) {
      setErrorMessage("Please enter all required fields.");
      return;
    }
    // Validate Name
    if (!validateName(name)) {
      setNameError(true);
      errorMessages.name = "Name should only contain letters and spaces.";
      isValid = false;
    } else {
      setNameError(false);
    }

    // Validate Mobile
    if (!validateMobile(mobile)) {
      setMobileError(true);
      errorMessages.mobile = "Mobile number should be 10 digits.";
      isValid = false;
    } else {
      setMobileError(false);
    }

    // Validate Email
    if (!validateEmail(email)) {
      setEmailError(true);
      errorMessages.email = "Please enter a valid email address.";
      isValid = false;
    } else {
      setEmailError(false);
    }

    // Validate Password
    if (!validatePassword(password)) {
      setPasswordError(true);
      errorMessages.password =
        "Password must be at least 8 characters & strong.";
      // errorMessages.password = "Password must be at least 8 characters & strong, with at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9), and one special character (@/$!%*?&).";
      isValid = false;
    } else {
      setPasswordError(false);
    }

    // Show error messages if any validation fails
    if (!isValid) {
      event.preventDefault();
      setErrorMessage(errorMessages); // Set all error messages at once
      return;
    }

    // Prevent form submission
    if (rememberMe) {
      localStorage.setItem("rememberMe", true);
      localStorage.setItem("email", email);
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("email");
    }
    try {
      setErrorMessage("");
      setIsLoading(true); // Show the loader

      // Call the signup function and pass the email and password
      const signupResult = await signup(name, mobile, email, password);
      // Store email and password in localStorage (this might have security implications, consider alternatives)
      localStorage.setItem("email", email);
      if (signupResult.success) {
        // setModalOpen(true)
        // setIsLoading(false);
        showToast(signupResult.data);
        setName("");
        setEmail("");
        setPassword("");
        setMobile("");
        navigate("/otp");
      } else {
        setIsLoading(false);
        setErrorMessage(signupResult.message.data);
      }
    } catch (error) {
      setIsLoading(false);
      setErrorMessage("Failed to sign up"); // Handle generic error message
      // console.log('signupresult', error);
      console.error("Error:", error);
    }
  };

  const openModal = () => {
    onOpen();
  };

  const closeModal = () => {
    onClose();
  };

  return (
    <>
      {" "}
      <Grid
        h="100vh"
        templateColumns={{ base: "1fr", md: "1fr 1fr" }} // Single column on mobile, two columns on desktop
      >
        {/* Image section - only visible on md (tablet) and larger */}
        <Box
          display={{ base: "none", md: "flex" }} // Hide image section on mobile
          // justifyContent={'center'}
          alignItems={"center"}
          h="100%"
          bg={useColorModeValue("white", "#231F1F")}
          color={useColorModeValue("black", "white")}
        >
          <Image
            src={"./images/sideImage2.png"}
            alt="Login Image"
            objectFit="contain"
            h="80vh"
          />
        </Box>

        {/* Form section */}
        <Flex
          justify="center"
          align="center"
          // bg="white"
          p={8}
          bg={useColorModeValue("white", "#231F1F")}
        >
          <Box
            w="100%"
            maxW="400px"
            bg={useColorModeValue("white", "#231F1F")}
            color={useColorModeValue("black", "white")}
          >
            <Box
              mb={1}
              display={{ base: "flex", md: "none" }}
              justifyContent={"space-between"}
              alignItems={"center"}
              width={"100%"}
            >
              <Box flex="0 0 65%" display="flex" justifyContent="center">
                <Image
                  src="/images/ArcisAiLogo.png"
                  alt="Arcis Logo"
                  boxSize={"120px"}
                  margin={"0 0 0 auto"}
                  objectFit={"contain"}
                />
              </Box>
              <IconButton
                icon={<BsQuestionCircle size="26px" opacity={0.5} />}
                aria-label="Help"
                variant="plain" // Navigate back in browser history
                display={{ base: "block", md: "none" }}
              />
            </Box>

            <Flex
              justifyContent={{ base: "center", md: "space-between" }}
              alignItems={"center"}
              mb={3}
            >
              <Heading
                as="h2"
                size="lg"
                textAlign={{ base: "center", md: "left" }}
              >
                Get Started
              </Heading>
              <IconButton
                icon={<BsQuestionCircle size="26px" opacity={0.5} />}
                aria-label="Help"
                variant="plain" // Navigate back in browser history
                display={{ base: "none", md: "block" }}
              />
            </Flex>
            <Text
              mb={4}
              textAlign={{ base: "center", md: "left" }}
              color={"#65758B"}
            >
              Create your ArcisAI account to continue.
            </Text>
            {/* Form */}
            <Box as="form">
              <Text color={nameValid ? textColor : "red.500"}>Name</Text>
              <Input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameValid(validateName(e.target.value)); // Validate and set validity
                }}
                placeholder="Enter your full name"
                mb={4}
                borderColor={nameValid ? "gray.300" : "red.500"} // Border color change based on validity
                color={nameValid ? textColor : "red.500"} // Text color change based on validity
                _focus={{
                  borderColor: nameValid
                    ? theme.colors.custom.primary
                    : "red.500", // Keep border color red for invalid only
                  boxShadow: nameValid
                    ? ` 0 0 0 1px ${theme.colors.custom.primary}`
                    : "0 0 0 1px red", // No box shadow for valid
                }}
              />

              <Text color={mobileValid ? textColor : "red.500"}>Mobile</Text>
              <Input
                type="text"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setMobileValid(validateMobile(e.target.value)); // Validate and set validity
                }}
                placeholder="Enter your mobile number"
                mb={4}
                borderColor={mobileValid ? "gray.300" : "red.500"} // Border color change based on validity
                color={mobileValid ? textColor : "red.500"} // Text color change based on validity
                _focus={{
                  borderColor: mobileValid
                    ? theme.colors.custom.primary
                    : "red.500", // Keep border color red for invalid only
                  boxShadow: mobileValid
                    ? ` 0 0 0 1px ${theme.colors.custom.primary}`
                    : "0 0 0 1px red", // No box shadow for valid
                }}
              />

              <Text color={emailValid ? textColor : "red.500"}>Email</Text>
              <Input
                type="text"
                value={email}
                onChange={(e) => {
                  const formattedEmail = e.target.value.toLowerCase().trim(); // Convert to lowercase and trim whitespace
                  setEmail(formattedEmail);
                  setEmailValid(validateEmail(formattedEmail)); // Validate and set validity
                }}
                placeholder="Enter your email"
                mb={4}
                borderColor={emailValid ? "gray.300" : "red.500"} // Border color change based on validity
                color={emailValid ? textColor : "red.500"} // Text color change based on validity
                _focus={{
                  borderColor: emailValid
                    ? theme.colors.custom.primary
                    : "red.500", // Keep border color red for invalid only
                  boxShadow: emailValid
                    ? ` 0 0 0 1px ${theme.colors.custom.primary}`
                    : "0 0 0 1px red", // No box shadow for valid
                }}
              />

              <Text color={passwordValid ? textColor : "red.500"}>
                Password
              </Text>
              <InputGroup mb={1}>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordValid(validatePassword(e.target.value)); // Validate and set validity
                  }}
                  mb={1}
                  borderColor={passwordValid ? "gray.300" : "red.500"} // Border color change based on validity
                  color={passwordValid ? textColor : "red.500"} // Text color change based on validity
                  _focus={{
                    borderColor: passwordValid
                      ? theme.colors.custom.primary
                      : "red.500", // Keep border color red for invalid only
                    boxShadow: passwordValid
                      ? ` 0 0 0 1px ${theme.colors.custom.primary}`
                      : "0 0 0 1px red", // No box shadow for valid
                  }}
                />
                <InputRightElement>
                  <IconButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    icon={showPassword ? <ViewIcon /> : <ViewOffIcon />}
                    onClick={() => setShowPassword(!showPassword)}
                    size={"sm"}
                    variant={"plain"}
                  />
                </InputRightElement>
              </InputGroup>

              <Text textAlign="start" mt={2}>
                <Checkbox
                  sx={{
                    "& .chakra-checkbox__control": {
                      _checked: {
                        bg: "#C8D6E5", // Background color when checked
                        borderColor: "#C8D6E5", // Border color when checked
                        color: "black",
                      },
                    },
                  }}
                >
                  <Text fontSize={"14px"}>
                    {" "}
                    I have read and I accept ArcisAI terms of use:
                  </Text>
                </Checkbox>
                <Link
                  style={{ color: "#65758B", fontWeight: "bolder" }}
                  onClick={openModal}
                >
                  &nbsp;T&C.
                </Link>
              </Text>

              <Text mb={4} color={"red.500"}>
                {typeof errorMessage === "string" && (
                  <Text>{errorMessage}</Text>
                )}
              </Text>

              <Text mb={6} color="red.600">
                {errorMessage?.name && <div>{errorMessage.name}</div>}
                {errorMessage?.mobile && <div>{errorMessage.mobile}</div>}
                {errorMessage?.email && <div>{errorMessage.email}</div>}
                {errorMessage?.password && <div>{errorMessage.password}</div>}
              </Text>

              <Button
                bg={bgColor}
                color={textColor}
                size="lg"
                w="100%"
                mb={4}
                onClick={handleSendOtp}
              >
                Register
              </Button>

              <Text textAlign="center" mb={2}>
                Already have an account?
                <Link
                  to="/login"
                  style={{ color: "#65758B", fontWeight: "bolder" }}
                >
                  &nbsp;Login
                </Link>
              </Text>
              {/* <Box textAlign="center">OR</Box>
              <Button
                w="100%"
                variant={"ghost"}
                colorScheme="gray"
                leftIcon={
                  <Image src="https://img.icons8.com/color/16/000000/google-logo.png" />
                }
              >
                Sign in with Google
              </Button> */}
            </Box>
          </Box>
        </Flex>
      </Grid>
      <Modal onClose={onClose} isOpen={isOpen} isCentered size={"2xl"}>
        <ModalOverlay />
        <ModalContent
          bg={useColorModeValue("white", theme.colors.custom.darkModeBg)}
          color={textColor}
        >
          <ModalHeader
            textAlign={"center"}
            p={1}
            mt={4}
            color={useColorModeValue(
              theme.colors.custom.lightModeText,
              theme.colors.custom.darkModeText
            )}
          >
            Terms and Conditions
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <>
              <TermsOfService headingHide={true} />
            </>
          </ModalBody>

          {/* <ModalFooter marginRight={"10px"} justifyContent={"space-evenly"}>
            <Button
              onClick={closeModal}
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
              onClick={() => handleShareCamera()}
              w="150px"
              background={useColorModeValue(
                theme.colors.custom.primary,
                theme.colors.custom.darkModePrimary
              )}
              color={useColorModeValue(
                theme.colors.custom.lightModeText,
                theme.colors.custom.darkModeText
              )}
              fontWeight={"normal"}
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
            >
              Share Camera
            </Button>
          </ModalFooter> */}
        </ModalContent>
      </Modal>
    </>
  );
};

export default Signup;
