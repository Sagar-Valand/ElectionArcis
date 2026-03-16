import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Button, Box, Text, Flex, FormControl, FormLabel, Select } from '@chakra-ui/react';
import { Base64 } from 'js-base64';

const UAOCanvas = ({ isOpen, onClose, onCanvasData, existingCoordinates, existingDirection, existingAction, deviceId }) => {

    const [canvasElement, setCanvasElement] = useState(null);
    const imgRef = useRef(null);
    const imgLoadedRef = useRef(false);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [points, setPoints] = useState([]);
    const [drawPointNum, setDrawPointNum] = useState(0);

    const g_usr = 'admin';
    const g_pwd = '';
    const imgAuth = Base64.encode(`${g_usr}:${g_pwd}`);

    const setCanvasRef = useCallback((element) => {
        setCanvasElement(element);
    }, []);

    // Function to map API values to Select options
    const mapAction = (action) => {
        const actionMap = {
            'Inside': 'Inside',
            'EnterOrExit': 'EnterOrExit'
        };
        return actionMap[action] || 'Inside'; // Default to 'Inside'
    };

    const mapDirection = (direction) => {
        const directionMap = {
            'Enter': 'Enter',
            'Exit': 'Exit',
            'EnterOrExit': 'EnterOrExit'
        };
        return directionMap[direction] || 'Enter'; // Default to 'Enter'
    };

    const [direction, setDirection] = useState(mapDirection(existingDirection));
    const [action, setAction] = useState(mapAction(existingAction));

    useEffect(() => {
        setDirection(mapDirection(existingDirection));
        setAction(mapAction(existingAction));
    }, [existingDirection, existingAction]);

    useEffect(() => {
        if (canvasElement && !imgLoadedRef.current) {
            const ctx = canvasElement.getContext('2d');
            const img = new Image();
            imgRef.current = img;
            const imgUrl = `https://${deviceId}.torqueverse.dev/snapshot?r=${Math.random()}&auth=${imgAuth}`;

            img.src = imgUrl;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);
                setImgLoaded(true);
                imgLoadedRef.current = true; // Mark image as loaded

                if (existingCoordinates && existingCoordinates.length === 4) {
                    const canvasWidth = canvasElement.width;
                    const canvasHeight = canvasElement.height;
                    const actualWidth = 10000; // Replace with the actual image width
                    const actualHeight = 10000; // Replace with the actual image height

                    const scaledPoints = existingCoordinates.map(([x, y]) => ({
                        x: (x / actualWidth) * canvasWidth,
                        y: (y / actualHeight) * canvasHeight,
                    }));

                    setPoints(scaledPoints);
                    setDrawPointNum(4);

                    drawPolygon(ctx, scaledPoints);
                }
            };
        } else if (canvasElement && imgLoadedRef.current) {
            const ctx = canvasElement.getContext('2d');
            ctx.drawImage(imgRef.current, 0, 0, canvasElement.width, canvasElement.height);
            if (existingCoordinates && existingCoordinates.length === 4) {
                const canvasWidth = canvasElement.width;
                const canvasHeight = canvasElement.height;
                const actualWidth = 10000; // Replace with the actual image width
                const actualHeight = 10000; // Replace with the actual image height

                const scaledPoints = existingCoordinates.map(([x, y]) => ({
                    x: (x / actualWidth) * canvasWidth,
                    y: (y / actualHeight) * canvasHeight,
                }));

                setPoints(scaledPoints);
                setDrawPointNum(4);

                drawPolygon(ctx, scaledPoints);
            }
        }
    }, [canvasElement, imgAuth, existingCoordinates]);

    const drawPolygon = (ctx, points) => {
        if (points.length > 1) {
            ctx.beginPath();
            points.forEach((point, index) => {
                if (index === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.closePath();
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    };

    const redraw = () => {
        const ctx = canvasElement.getContext('2d');
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        if (imgRef.current) {
            ctx.drawImage(imgRef.current, 0, 0, canvasElement.width, canvasElement.height);
        }
        if (points.length === 4) {
            drawPolygon(ctx, points);
        }
    };

    const handleMouseDown = (e) => {
        const rect = canvasElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setPoints((prevPoints) => [...prevPoints, { x, y }]);
        setDrawPointNum((prev) => prev + 1);

        if (drawPointNum === 3) {
            const canvasWidth = canvasElement.width;
            const canvasHeight = canvasElement.height;
            const actualWidth = 10000; // Replace with the actual image width
            const actualHeight = 10000; // Replace with the actual image height

            const detectLine = [...points, { x, y }].map((point) => [
                (point.x / canvasWidth) * actualWidth,
                (point.y / canvasHeight) * actualHeight,
            ]);

            setPoints((prevPoints) => [...prevPoints, { x, y }]);
            setDrawPointNum(4);
            onCanvasData(detectLine, direction);
        }
    };

    const handleMouseMove = (e) => {
        if (drawPointNum < 4) {
            const rect = canvasElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const currentPoints = [...points, { x, y }];
            redraw();
            const ctx = canvasElement.getContext('2d');
            drawPolygon(ctx, currentPoints);
        }
    };

    const handleClearPaint = () => {
        setDrawPointNum(0);
        setPoints([]);
        redraw();
    };

    const handleDirectionChange = (event) => {
        setDirection(event.target.value);
    };

    const handleActionChange = (event) => {
        setAction(event.target.value);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Draw Properly UAO Detection</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <canvas
                        id="Lcd_image"
                        ref={setCanvasRef}
                        width="1280"
                        height="720"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        style={{ position: 'absolute', top: '20%', left: '15%', border: '1px solid black' }}
                    />
                    {!imgLoaded && <Box mt={4}><Text>Loading image...</Text></Box>}
                    <Box mt={4}>
                        <Button colorScheme="red" onClick={handleClearPaint}>
                            Clear Paint Area
                        </Button>
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default UAOCanvas;
