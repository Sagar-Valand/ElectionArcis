import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Button, Box, Text, Flex, FormControl, FormLabel, Select } from '@chakra-ui/react';
import { Base64 } from 'js-base64';

const CustomerCanvas = ({ isOpen, onClose, onCanvasData, existingCoordinates, existingDirection, deviceId }) => {
    const [canvasElement, setCanvasElement] = useState(null);
    const imgRef = useRef(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [drawing, setDrawing] = useState(false);
    const [line, setLine] = useState(null);
    const [points, setPoints] = useState({ x1: null, y1: null, x2: null, y2: null });
    const [drawPointNum, setDrawPointNum] = useState(0);
    const [startPoint, setStartPoint] = useState(null);
    const [endPoint, setEndPoint] = useState(null);

    const g_usr = 'admin';
    const g_pwd = '';
    const imgAuth = Base64.encode(`${g_usr}:${g_pwd}`);

    const setCanvasRef = useCallback((element) => {
        setCanvasElement(element);
    }, []);

    useEffect(() => {
        if (canvasElement) {
            const ctx = canvasElement.getContext('2d');
            const img = new Image();
            imgRef.current = img;
            const imgUrl = `https://${deviceId}.torqueverse.dev/snapshot?r=${Math.random()}&auth=${imgAuth}`;

            img.src = imgUrl;
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvasElement.width, canvasElement.height);
                setImgLoaded(true);
                if (existingCoordinates && existingCoordinates.length === 2) {
                    const canvasWidth = canvasElement.width;
                    const canvasHeight = canvasElement.height;
                    const actualWidth = 10000; // Replace with the actual image width
                    const actualHeight = 10000; // Replace with the actual image height

                    const startX = existingCoordinates[0][0] / actualWidth * canvasWidth;
                    const startY = existingCoordinates[0][1] / actualHeight * canvasHeight;
                    const endX = existingCoordinates[1][0] / actualWidth * canvasWidth;
                    const endY = existingCoordinates[1][1] / actualHeight * canvasHeight;

                    setStartPoint({ x: startX, y: startY });
                    setEndPoint({ x: endX, y: endY });
                    setDrawPointNum(2);

                    drawLine(ctx, { x: startX, y: startY }, { x: endX, y: endY });
                }
            };
        }
    }, [canvasElement, imgAuth, existingCoordinates]);

    const drawLine = (ctx, start, end) => {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const redraw = () => {
        const ctx = canvasElement.getContext('2d');
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        if (imgRef.current) {
            ctx.drawImage(imgRef.current, 0, 0, canvasElement.width, canvasElement.height);
        }
        if (startPoint && endPoint) {
            drawLine(ctx, startPoint, endPoint);
        }
    };

    const handleMouseDown = (e) => {
        const rect = canvasElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setDrawPointNum((prev) => prev + 1);

        if (drawPointNum === 0) {
            setStartPoint({ x, y });
        } else if (drawPointNum === 1) {
            setEndPoint({ x, y });

            const canvasWidth = canvasElement.width;
            const canvasHeight = canvasElement.height;
            const actualWidth = 10000; // Replace with the actual image width
            const actualHeight = 10000; // Replace with the actual image height

            const detectLine = [
                [startPoint.x / canvasWidth * actualWidth, startPoint.y / canvasHeight * actualHeight],
                [x / canvasWidth * actualWidth, y / canvasHeight * actualHeight]
            ];
            onCanvasData(detectLine, direction);
            //   console.log('DetectLine:', detectLine);
        }
    };

    const handleMouseMove = (e) => {
        if (drawPointNum === 1) {
            const rect = canvasElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            setEndPoint({ x, y });
            redraw();
        }
    };

    const handleClearPaint = () => {
        setDrawPointNum(0);
        setStartPoint(null);
        setEndPoint(null);
        redraw();
    };

    const [direction, setDirection] = useState('');
    const handleDirectionChange = (event) => {
        setDirection(event.target.value);
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="full">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Draw Properly CustomerCanvas</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Flex direction="row" align="center" gap={4}>
                        <FormControl display="flex" alignItems="center">
                            <FormLabel marginBottom="0">Direction</FormLabel>
                            <Select width="auto" value={direction} onChange={handleDirectionChange}>
                                <option value="A->B">A-B</option>
                                <option value="A<-B">B-A</option>
                                {/* <option value="Both">Both</option> */}
                            </Select>
                        </FormControl>
                    </Flex>
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

export default CustomerCanvas;
