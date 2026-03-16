import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  Icon,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  textDecoration,
  useColorMode,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { login, sendOtp, verifyOtp } from "../actions/userActions";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { verifytok } from "../actions/userActions";
import { BsQuestionCircle } from "react-icons/bs";
import theme from "../theme";
import { color } from "framer-motion";
// import { registerPushNotifications } from '../actions/notification';
// import io from 'socket.io-client';

const Login = () => {
  const [email, setEmail] = useState(""); // Unified field for email or mobile
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [isMobileNumber, setIsMobileNumber] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue("custom.primary", "custom.darkModePrimary");
  const { colorMode } = useColorMode();

  const textColor = useColorModeValue(
    "custom.lightModeText",
    "custom.darkModeText"
  );
  const showToast = (msg, status) => {
    toast({
      description: msg,
      status: status,
      duration: 3000,
      position: "bottom-left",
      isClosable: true,
    });
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setEmail(value.toLowerCase()); // Convert to lowercase

    // Check if the input is a mobile number
    const mobileRegex = /^[6-9]\d{9}$/;
    setIsMobileNumber(mobileRegex.test(value));
    setIsOtpSent(false); // Reset OTP sent status when input changes
  };

  const handleSendOtp = async () => {
    try {
      setIsLoading(true);
      const sendOtpResult = await sendOtp(email); // Assuming the sendOtp function exists
      if (sendOtpResult.success) {
        showToast("OTP sent successfully", "success");
        setIsOtpSent(true);
      } else {
        setErrorMessage("Failed to send OTP. Please try again.");
        showToast("Failed to send OTP", "error");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setErrorMessage("Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setIsLoading(true);
      console.log("Email:", email, otp);
      const verifyResult = await verifyOtp(email, otp); // Assuming the verifyOtp function exists
      if (verifyResult.success) {
        localStorage.setItem("name", verifyResult.name);
        localStorage.setItem("email", verifyResult.email);
        // Perform any login redirection logic
        navigate("/dash");
        showToast("OTP verified successfully. Logging in...", "success");
      } else {
        setErrorMessage("Invalid OTP. Please try again.");
        showToast("Invalid OTP", "error");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setErrorMessage("Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission
    console.log("Logging in with:", { email, password, isMobileNumber });
    if (!email || (!password && !isMobileNumber)) {
      setErrorMessage("Please enter all required fields.");
      return;
    }

    try {
      setErrorMessage("");
      setIsLoading(true); // Show loader during login

      const loginResult = await login(email, password);
      console.log("Login result:", loginResult);
      if (loginResult.success) {
        // localStorage.setItem('email', loginResult.user.email);
        navigate("/dash");
        showToast("Logged in Successfully", "success");
        localStorage.setItem("name", loginResult.name);
        localStorage.setItem("email", loginResult.email);
        localStorage.setItem("role", loginResult.role);
        // registerPushNotifications();
        // socket.on('notification', (data) => {
        //   setNotifications((prev) => [...prev, data]);
        // });
      } else {
        setErrorMessage(loginResult.data);
        showToast(loginResult.data, "error");
      }
    } catch (error) {
      setErrorMessage("Failed to login. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsLoading(false); // Hide loader
    }
  };

  const [loginVisible, setLoginVisible] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  useEffect(() => {
    const checkLoginStatus = async () => {
      // Verify token
      const verifyTok = await verifytok();
      // console.log(verifyTok);

      // Handle token verification result
      if (verifyTok === null) {
        setLoginVisible(true);
      } else {
        navigate("/dash");
      }
    };

    checkLoginStatus();
    // Check for small screen based on window height
    function handleResize() {
      setIsSmallScreen(window.innerHeight < 676);
    }

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Initial check
    handleResize();

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const btnBg = useColorModeValue(
    "linear-gradient(94deg, #9CBAD2 0.56%, #CDDEEB 94.58%)",
    "black"
  );

  const btnHoverBg = useColorModeValue(
    "linear-gradient(94deg, #7DA5C4 0.56%, #AFCBE0 94.58%)",
    "#1a1a1a"
  );

  const btnTextColor = useColorModeValue(
    "black",
    "white"
  );


  return (
    <Flex
      position="relative"
      h="100vh"
      w="100%"
      alignItems="center"
      justify="center"
    >

      {colorMode === "light" ? (
        <Image
          src="/images/background_img_light.png"
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          objectFit="cover"
          zIndex={0}
        />
      ) : (<Image
        src="/images/background_img.png"
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        objectFit="cover"
        zIndex={0}
      />)}

      <Flex
        maxW={"1200px"}
        maxH={"700px"}
        direction="column"
        w="fit-content"
        h="100%"
        p={10}
        borderRadius="2xl"
        bgGradient="linear(to-t, rgba(3,7,17,0.1), rgba(22,59,116,0.1))"
        backdropFilter="blur(30px)"
        align="center"
        gap={50}
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          w="100%"
          gap={0}  
        >
          <Text
            fontSize={{ base: "22px", md: "36px" }}
            fontWeight="500"
            letterSpacing="0.5px"
            mb="0"   
            lineHeight="1.2"
          >
            Welcome to VMukti VMS
          </Text>

          <Text
            fontSize={{ base: "14px", md: "20px" }}
            fontWeight="400"
            mt="0"   // ensure no top margin
            lineHeight="1.2"
          >
            Ensuring Fairness and Safety with Computer Vision in Election Systems
          </Text>
        </Flex>

        <Flex h="full" justifyContent={"space-between"} w="full" direction={{ base: "column", md: "row" }}>
          {/* Map Image */}
          <Box flex="1" justifyContent="center" alignItems="center" display={{ base: "none", md: "flex" }}>
            {
              colorMode === "light" ? (
                <Image
                  src="/images/westbengal.png"
                  alt="Login Map"
                  alignSelf={"flex-start"}
                  objectFit="contain"
                  mt="2%"
                  maxW="400px"
                />
              ) : (<Image
                src="/images/westbengal_dark.png"
                alt="Login Map"
                alignSelf={"flex-start"}
                objectFit="contain"
                mt="2%"
                maxW="400px"
              />)
            }

          </Box>

          {/* Login Form */}
          <Flex flex="1" justifyContent={"center"} gap={5} alignSelf={{ base: "center", md: "flex-start" }} direction={"column"} alignItems={"center"} h="full" maxW={"50%"}
          >
            <Text
              as="h2"
              fontWeight="400"
              fontStyle="normal"
              fontSize={{ base: "24px", md: "32px" }}
              lineHeight={{ base: "24px", md: "32px" }}
              letterSpacing="0"
              textAlign="center"
              textTransform="uppercase"
              mb={4}
            >
              LOGIN
            </Text>

            {/* bottom portion */}
            <Box maxW={"360px"} minW={"280px"} h="full" display="flex" flexDirection="column" justifyContent="space-between">
              <Box>
                {/* User ID */}
                <Input
                  placeholder="Enter your Email ID"
                  mb={4}
                  value={email}
                  onChange={handleInputChange}
                  borderRadius="12px"
                  bg="transparent"
                  border="1px solid #868686"
                  _hover={{ borderColor: "#FFFFFF" }}
                  _focus={{ borderColor: "#FFFFFF", borderImage: "none" }}
                  _blur={{ borderColor: "#868686", borderImage: "none" }}
                />

                <Input
                  placeholder="Enter your Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  borderRadius="12px"
                  bg="transparent"
                  border="1px solid #868686"
                  mb={4}
                  _hover={{ borderColor: "#FFFFFF" }}
                  _focus={{ borderColor: "#FFFFFF" }}
                  _blur={{ borderColor: "#868686" }}
                />



                {/* Sign In Button */}
                <Box p="1px" bgGradient="linear(to-br, #D6D6D6, #040811)" borderRadius="12px">
                  <Button
                    w="100%"
                    borderRadius="12px"
                    background={btnBg}
                    fontWeight="bold"
                    color={btnTextColor}
                    _ hover={{
                      background: btnHoverBg,
                    }}
                    onClick={handleLogin}
                  >
                    Continue
                  </Button>

                </Box>

              </Box>

              {/* Unauthorized Access Box at the bottom */}
              <Box alignSelf={"flex-start"} mt={4}>
                <Text
                  fontFamily="Inter"
                  fontWeight="400"
                  fontSize="16px"
                  lineHeight="100%"
                  letterSpacing="0"
                  textAlign="center"
                >
                  Unauthorized Access Prohibited.
                </Text>

                <Text
                  fontFamily="Inter"
                  fontWeight="400"
                  fontSize="10px"
                  lineHeight="100%"
                  letterSpacing="0"
                  textAlign="center"
                >
                  This website is for authorized government users only. Unauthorized access is strictly prohibited.
                </Text>
              </Box>
            </Box>

          </Flex>
        </Flex>
      </Flex>
    </Flex >

  );
};

export default Login;

