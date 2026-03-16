import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ImageGalleryModal from "./ImageGalleryModal"; // Import the ImageGalleryModal

function ImageMask({ screenshotUrl, device }) {
  console.log(device);
  const imageCanvasRef = useRef(null); // Ref for the image canvas (without markers)
  const markerCanvasRef = useRef(null); // Ref for the marker canvas (with markers)
  const [ctx, setCtx] = useState(null);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [processedImages, setProcessedImages] = useState([]); // Array to hold multiple images
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  useEffect(() => {
    const imageCanvas = imageCanvasRef.current;
    const markerCanvas = markerCanvasRef.current;
    const imageContext = imageCanvas.getContext("2d");
    const markerContext = markerCanvas.getContext("2d");
    setCtx(markerContext);

    const image = new Image();
    image.src = screenshotUrl; // Load the screenshot

    image.onload = () => {
      // Set the canvas width and height based on the image aspect ratio
      const aspectRatio = image.width / image.height;
      const newWidth = markerCanvas.parentElement.offsetWidth; // Parent container width
      const newHeight = newWidth / aspectRatio; // Maintain aspect ratio

      // Set canvas sizes
      imageCanvas.width = newWidth;
      imageCanvas.height = newHeight;
      markerCanvas.width = newWidth;
      markerCanvas.height = newHeight;

      // Set CSS width and height to match the canvas size
      imageCanvas.style.width = `${newWidth}px`;
      imageCanvas.style.height = `${newHeight}px`;
      markerCanvas.style.width = `${newWidth}px`;
      markerCanvas.style.height = `${newHeight}px`;

      // Draw the image on the canvas
      imageContext.drawImage(image, 0, 0, newWidth, newHeight);
    };

    image.onerror = (err) => {
      console.error("Failed to load image:", err);
    };
  }, [screenshotUrl]);

  const handleCanvasClick = (event) => {
    const markerCanvas = markerCanvasRef.current;
    const rect = markerCanvas.getBoundingClientRect(); // Get canvas position and size
    const scaleX = markerCanvas.width / rect.width; // Scale X based on canvas size
    const scaleY = markerCanvas.height / rect.height; // Scale Y based on canvas size
    const x = (event.clientX - rect.left) * scaleX; // Adjust x position based on scale
    const y = (event.clientY - rect.top) * scaleY; // Adjust y position based on scale

    setSelectedPoints((prevPoints) => [...prevPoints, { x, y }]);

    if (ctx) {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const handleSubmitSelection = () => {
    const imageCanvas = imageCanvasRef.current; // Reference to the image canvas (without markers)
    console.log(" :: ", selectedPoints);

    // Convert the image canvas content (just the image, no markers) to base64
    const imageBase64 = imageCanvas.toDataURL("image/jpg"); // You can use 'image/png' or 'image/jpeg'

    // Send the base64 image and selected points to the backend
    axios
      .post("https://zmedia.arcisai.io:7000/process_selection", {
        image: imageBase64.split(",")[1], // Remove the "data:image/jpeg;base64," prefix
        selected_points: selectedPoints, // Send the selected points separately
        camera_id: `RTSP-${device.deviceId}`,
        dvr_plan: `DVR`,
      })
      .then((response) => {
        console.log("Processed Images:", response.data.similar_images);

        if (response.data && response.data.similar_images) {
          setProcessedImages(response.data.similar_images); // Set processed images
          setIsModalOpen(true); // Open modal if images are received
        } else {
          setProcessedImages([]); // Clear images if none
          setIsModalOpen(true); // Open modal to show no images
        }
      })
      .catch((error) => {
        console.error("Error processing the selection:", error);
      });
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProcessedImages([]); // Clear images when closing the modal
  };

  return (
    <div>
      <div style={{ position: "relative", width: "100%" }}>
        {/* Image canvas (no markers) */}
        <canvas
          ref={imageCanvasRef}
          style={{
            border: "1px solid black",
            position: "relative",
            left: 0,
            top: 0,
            zIndex: 1,
          }}
        />

        {/* Marker canvas (with markers) */}
        <canvas
          ref={markerCanvasRef}
          onClick={handleCanvasClick}
          style={{
            border: "1px solid black",
            position: "absolute",
            left: 0,
            top: 0,
            zIndex: 2,
          }}
        />

        {/* Button with higher z-index */}
        <button
          onClick={handleSubmitSelection}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3182ce",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            position: "absolute", // Position the button inside the modal
            zIndex: 3, // Ensure the button appears above other elements
            right: "10px", // Keep the button aligned to the right
            bottom: "-50px", // Align the button to the bottom of the modal
          }}
        >
          Submit Selection
        </button>
      </div>

      {/* Modal for displaying processed images or no images found */}
      {isModalOpen && (
        <ImageGalleryModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          img={processedImages}
        />
      )}
    </div>
  );
}

export default ImageMask;
