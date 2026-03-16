import {
    Box, Button, FormControl, FormLabel, Heading, Image, Input, useToast, VStack
} from "@chakra-ui/react";
import { useState } from "react";
import { deleteAccount } from "../actions/userActions";

const DeleteAccount = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const toast = useToast(); // Initialize useToast

    const handleDelete = async () => {
        console.log(email, password);
        try {
            const response = await deleteAccount(email, password);

            console.log(response);

            // Check if the response was successful
            if (response.success) {
                toast({
                    title: "Account Deletion Scheduled",
                    description: response.message || "Your account will be deleted in 24 hours.",
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Something went wrong.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.log(error);

            let errorMessage = "An unexpected error occurred. Please try again later.";

            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            }

            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Box
            height="100vh"
            bg="white"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            width="100%"
            gap={10}
        >
            
            <Image src="/images/ArcisAiLogo.png" alt="ArcisAi Logo" width="150px" margin="0 auto" />
            <Box
                p={8}
                maxWidth="500px"
                margin="0 auto"
                bg="white"
                boxShadow="lg"
                borderRadius="lg"
            >
                <Heading as="h2" size="xl" textAlign="center" mb={6} color="black">
                    Delete Account
                </Heading>
                <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                        <FormLabel htmlFor="email" color="black">
                            Email
                        </FormLabel>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            color="black"
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel htmlFor="password" color="black">
                            Password
                        </FormLabel>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            focusBorderColor="black"
                            color="black"
                        />
                    </FormControl>
                    <Button
                        colorScheme="red"
                        size="lg"
                        onClick={handleDelete}
                        width="full"
                        mt={6}
                        color="black"
                        borderColor="black"
                    >
                        Delete Account
                    </Button>
                </VStack>
            </Box>
        </Box>
    );
};

export default DeleteAccount;