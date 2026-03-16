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
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { forgotPassword, login, sendOtp, verifyOtp } from "../actions/userActions";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { verifytok } from "../actions/userActions";
import theme from "../theme";
// import { registerPushNotifications } from '../actions/notification';
// import io from 'socket.io-client';

const ForgotPassword = () => {
  const [email, setEmail] = useState(""); // Unified field for email or mobile
  const toast = useToast();
  const navigate = useNavigate();
  const bgColor = useColorModeValue("custom.primary", "custom.darkModePrimary");
  const textColor = useColorModeValue(
    "custom.lightModeText",
    "custom.darkModeText"
  );
  const handleForgotPassword = async () => {
    try {
      const forgot = await forgotPassword(email); // Assuming the sendOtp function exists
      console.log(forgot);
      if (forgot.success) {
        toast({
          title: "Link Sent",
          description: "Link sent to your email.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Error",
          description: "Invalid Email ID.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
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
        navigate('/dashboard');
      }
    };

    checkLoginStatus();
    // Check for small screen based on window height
    function handleResize() {
      setIsSmallScreen(window.innerHeight < 676);
    }

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Initial check
    handleResize();

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Grid
      h="100vh"
      templateColumns={{ base: "1fr", md: "1fr 1fr" }} // Single column on mobile, two columns on desktop
      bg={useColorModeValue("white", "#231F1F")}
    >
      {/* Image section - only visible on md (tablet) and larger */}
      <Box
        // display={{ base: "none", md: "block" }} // Hide image section on mobile
        // bg="gray.100"
        display={{ base: "none", md: "flex" }}
        // justifyContent={'center'}
        alignItems={"center"}
        bg={useColorModeValue("white", "#231F1F")}
        h="100%"
      >
        <Image
          src={"./images/sideImage2.png"}
          alt="Login Image"
          objectFit="contain"
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
          h="80vh"
          // w="100%"
        />
      </Box>

      {/* Form section */}
      <Flex
        justify="center"
        align="center"
        p={8}
        bg={useColorModeValue("white", "#231F1F")}
      >
        <Box w="100%" maxW="400px">
          {/* Add Image Above the Heading */}
          <Box
            mb={1}
            display={{ base: "flex", md: "none" }}
            justifyContent="center"
            alignItems="flex-end"
          >
            <Image
              src="./images/ArcisAi.png" // Replace with your image path
              alt="Your Logo"
              boxSize="120px" // Adjust the size of the image
              objectFit="contain"
            />
          </Box>

          <Heading
            as="h2"
            size="lg"
            mb={2}
            textAlign={{ base: "center", md: "left" }} // Center text on mobile, left align on md and larger screens
          >
            Forgot Password
          </Heading>

          <Text mb={8} textAlign={{ base: "center", md: "left" }}>
            We will send a recovery link to your email so that you can reset
            your password and access your account.
          </Text>

          {/* Form */}
          <Box as="form">
            <Text>Email</Text>
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email ID"
              mb={3}
              _focus={{
                borderColor: theme.colors.custom.primary, // Custom purple border color on focus
                boxShadow:` 0 0 0 1px ${theme.colors.custom.primary}`, // Custom purple box shadow
              }}
            />

            <Box>
              <Button
                bg={bgColor}
                color={textColor} // Optional: Set the text color
                loadingText="Sending OTP..."
                width="100%"
                onClick={handleForgotPassword}
              >
                Send Link
              </Button>
            </Box>
          </Box>
          <Text textAlign="center" mb={2} mt={2}>
            Don’t have an account?{" "}
            <Link
              style={{ color: "#65758B", fontWeight: "bolder" }}
              to="/signup"
            >
              Get started
            </Link>
          </Text>
        </Box>
      </Flex>
    </Grid>
  );
};

export default ForgotPassword;

