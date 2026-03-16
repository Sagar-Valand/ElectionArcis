import React, { useState } from "react";
import { Box, Button, Icon, Tooltip, useToast, VStack } from "@chakra-ui/react";
import { FaMicrophone } from "react-icons/fa"; // Import the microphone icon
import { talkToCamera } from "../actions/settingsActions";

const AudioRecorder = ({ deviceId }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const toast = useToast();

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const localAudioChunks = []; // Local variable to store audio chunks

            recorder.ondataavailable = (event) => {
                localAudioChunks.push(event.data); // Push chunks to local array
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(localAudioChunks, { type: "audio/mp3" }); // Use local array
                const formData = new FormData();
                formData.append("audio", audioBlob);
                formData.append("deviceId", deviceId);

                try {
                    const response = await talkToCamera(formData);
                    console.log('responseeeeej', response)
                    if (response.success) {
                        toast({
                            title: "Audio Sent Successfully.",
                            // description: "Check the server for the converted file.",
                            status: "success",
                            duration: 5000,
                            isClosable: true,
                        });
                    } else {
                        toast({
                            title: "Conversion failed.",
                            description: "Please try again later.",
                            status: "error",
                            duration: 5000,
                            isClosable: true,
                        });
                    }
                } catch (error) {
                    toast({
                        title: "Network error.",
                        description: "Could not connect to the server.",
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (error) {
            toast({
                title: "Error accessing microphone.",
                description: "Please check your microphone permissions.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    return (
        <Box >
            <VStack spacing={4} align="center">
                <Tooltip label="Press & Hold to Record" aria-label="Previous Day Tooltip">
                    <Button
                        variant="ghost"
                        color={isRecording ? "red" : "blue"}
                        onMouseDown={handleStartRecording}
                        onMouseUp={handleStopRecording}
                        onTouchStart={handleStartRecording}
                        onTouchEnd={handleStopRecording}
                        // w="40px"
                        // h="40px"
                        borderRadius="50%"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    // boxShadow="md"
                    >
                        <Icon as={FaMicrophone}  size='16px' color={isRecording ? "red.500" : "blue.500"} />
                    </Button>
                </Tooltip>
            </VStack>
        </Box>
    );
};

export default AudioRecorder;
