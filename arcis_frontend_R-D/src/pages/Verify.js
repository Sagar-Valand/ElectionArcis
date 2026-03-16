import {
    Box,
    Button,
    Text,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import { verify } from "../actions/userActions";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Verify = () => {

    const { id } = useParams()
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handleVerify = async () => {
        try {
            const response = await verify(id);
            console.log(response);
            if (response.success) {
                setErrorMessage(response.data);
                setIsVerified(true);
            } else {
                setErrorMessage(response.message.data.data);
                setIsVerified(false);
            }
        } catch (error) {
            console.error("Error during verification:", error);
            setIsVerified(false);
            // setErrorMessage("An error occurred during verification.");
        }
    };

    useEffect(() => {
        handleVerify();
    }, []);

    return (
        <Box position={'fixed'} top={'50%'} left={'50%'} transform={'translate(-50%, -50%)'} display={'flex'} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
            <Text>
                {errorMessage}
            </Text>
            {isVerified ? (
                <Button mt={2} variant="outline" colorScheme="purple">
                    <Link to="/login">Login</Link>
                </Button>
            ) : (
                <Button mt={2} variant="outline" colorScheme="purple">
                    <Link to="/signup">Signup</Link>
                </Button>
            )}
        </Box>
    );
};

export default Verify;
