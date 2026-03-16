import {
    Box,
    Button,
    Flex,
    Heading,
    Image,
    Input,
    Text,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import { logout, updatePassword } from "../actions/userActions";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { registerPushNotifications } from '../actions/notification';
// import io from 'socket.io-client';

const ChangePassword = () => {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const toast = useToast();
    const navigate = useNavigate();
    const bgColor = useColorModeValue("custom.primary", "custom.darkModePrimary");

    const handleChangePassword = async () => {
        try {
            const response = await updatePassword(oldPassword, newPassword, confirmPassword);
            // if (response.status === 200) {
            console.log("responseee", response);
            // toast({
            //     description: "Password updated successfully",
            //     status: "success",
            //     duration: 5000,
            //     isClosable: true,
            // });
            await logout();
            navigate("/login");
            console.log("Password updated successfully");
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <>
            {/* Form section */}
            < Flex
                justify="center"
                align="center"
                p={8}
                bg={useColorModeValue("white", "#231F1F")}
                height="100vh" // Make the container fill the entire viewport height
            >
                <Box w="100%" maxW="400px">
                    {/* Add Image Above the Heading */}
                    <Box
                        mb={1}
                        display={{ base: "flex", md: "none" }}
                        justifyContent="center"
                        alignItems="center"
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
                        mb={6}
                        textAlign={{ base: "center", md: "left" }} // Center text on mobile, left align on md and larger screens
                    >
                        Change Password
                    </Heading>

                    <Text mb={4} textAlign={{ base: "center", md: "left" }}>
                        Please enter your old and new password.
                    </Text>

                    {/* Form */}
                    <Box as="form">
                        <Text>Old Password</Text>
                        <Input
                            type="text"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="Enter your email or mobile number"
                            mb={4}
                        />
                        <Text>New Password</Text>
                        <Input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter your email or mobile number"
                            mb={4}
                        />
                        <Text>Confirm New Password</Text>
                        <Input
                            type="text"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Enter your email or mobile number"
                            mb={4}
                        />

                        <Box>
                            <Button
                                bg={bgColor}
                                color="custom.lightModeText" // Optional: Set the text color
                                loadingText="Sending OTP..."
                                width="100%"
                                onClick={handleChangePassword}
                            >
                                Submit
                            </Button>
                        </Box>

                    </Box>

                </Box>
            </Flex >
        </>

    );
};

export default ChangePassword;

