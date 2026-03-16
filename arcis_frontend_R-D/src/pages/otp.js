import {
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  Heading,
  Image,
  Input,
  PinInput,
  PinInputField,
  Text,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { login, resendOtp, verify } from "../actions/userActions";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Otp = () => {

  const [email, setEmail] = useState(''); // Unified field for email or mobile
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Assuming a 6-digit OTP
  const [fullOtp, setFullOtp] = useState(0); // For the complete OTP
  const [isMobileNumber, setIsMobileNumber] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue(
    "custom.primary",
    "custom.darkModePrimary"
  );

  const textColor = useColorModeValue(
    "custom.lightModeText",
    "custom.darkModeText"
  );

  const handleChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value.nativeEvent.data; // Set the digit at the corresponding index
    setOtp(newOtp);

    const combinedOtp = newOtp.join('');
    setFullOtp(combinedOtp);
  };

  const showToast = (msg, status) => {
    toast({
      description: msg,
      status: status,
      duration: 3000,
      position: "bottom-left",
      isClosable: true,
    });
  };

  const handleVerify = async () => {
    try {
      console.log('hello', fullOtp);
      const response = await verify(email, fullOtp);
      if (response.success) {
        setErrorMessage(response.data);
        toast({
          description: 'User Registered Successfully',
          status: "success",
          duration: 3000,
          position: "bottom-left",
          isClosable: true,
        });
        navigate("/login");
      } else {
        setErrorMessage(response.data);
        toast({
          description: 'User Registeration Failed',
          status: "error",
          duration: 3000,
          position: "bottom-left",
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error during verification:", error);
      toast({
        description: 'User Registeration API Failed',
        status: "error",
        duration: 3000,
        position: "bottom-left",
        isClosable: true,
      });
      // setErrorMessage("An error occurred during verification.");
    }
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const [timer, setTimer] = useState(59); // Set initial timer value
  const [isButtonVisible, setIsButtonVisible] = useState(false);

  useEffect(() => {
    let interval;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      setIsButtonVisible(true); // Show the button once timer reaches 0
    }

    return () => clearInterval(interval); // Cleanup on unmount
  }, [timer]);

  const handleResend = () => {
    setTimer(59); // Reset timer
    setIsButtonVisible(false); // Hide the button
    try {
      const response = resendOtp(email);
    } catch (error) {
      console.error("Error:", error);
    }
  };

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
        bg={useColorModeValue("white", "#231F1F")}
        p={8}
      >
        <Box w="100%" maxW="380px">
          <Box
            mb={1}
            display={{ base: "flex", md: "none" }}
            justifyContent={"center"}
            alignItems={"flex-end"}
          >
            <Image
              src="./images/ArcisAi.png"
              alt="Arcis Logo"
              boxSize={"120px"}
              objectFit={"contain"}
            />
          </Box>
          <Heading
            as="h2"
            size="lg"
            mb={6}
            textAlign={{ base: "center", md: "left" }}
          >
            OTP Login
          </Heading>
          <Text mb={4}>Enter 6 digit OTP share on your {email}</Text>
          {/* Form */}
          <Box as="form">
            {/* <Text>OTP</Text> */}
            <PinInput width="100%">
              {otp.map((digit, index) => (
                <PinInputField
                  // m={1}
                  key={index}
                  value={digit} // Set the value of the field to the corresponding digit in the OTP array
                  onChange={(value) => handleChange(value, index)} // Handle changes in the OTP field
                  isLast={index === 5} // Only set isLast on the last field
                  mb={3}
                  width="16%" // Set each field to take 16% of the width
                // mx={1} // Add horizontal margin between fields
                />
              ))}
            </PinInput>

            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              {!isButtonVisible ? (
                <Text textAlign="center" mb={4}>
                  Resend OTP in 00:{timer < 10 ? `0${timer}` : timer}
                </Text>
              ) : (
                <button
                  onClick={handleResend}
                  style={{
                    background: "none",
                    border: "none",
                    color: "green",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                >
                  Resend OTP
                </button>
              )}
            </div>

            <Button
              bg={bgColor}
              color={textColor}
              size="lg"
              w="100%"
              mb={4}
              onClick={handleVerify}
            >
              Verify
            </Button>
          </Box>
        </Box>
      </Flex>
    </Grid>
  );
};

export default Otp;
