import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  Box,
  Image,
  SimpleGrid,
} from "@chakra-ui/react";

const ImageGalleryModal = ({ isOpen, onClose, img }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Image Gallery</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {img && img.length > 0 ? (
            <SimpleGrid columns={[2, 3, 4]} spacing={4}>
              {img.map((imageUrl, index) => {
                const fullUrl = `https://zmedia.arcisai.io:5080/mp4/${imageUrl.image_url}`;
                console.log(`Rendering image URL: ${fullUrl}`);
                return (
                  <Box
                    key={index}
                    border="1px solid #ccc"
                    borderRadius="md"
                    p={2}
                  >
                    <Image
                      src={fullUrl}
                      alt={`Image ${index + 1}`}
                      fallbackSrc="https://via.placeholder.com/150"
                      borderRadius="md"
                      objectFit="cover"
                      width="100%"
                    />
                  </Box>
                );
              })}
            </SimpleGrid>
          ) : (
            <Text>No images available.</Text>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ImageGalleryModal;
