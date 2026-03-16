import React, { useRef, useEffect, useState } from 'react';
import {
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, Center, Text, useToast, VStack, HStack, Spinner
} from '@chakra-ui/react';
import Player from '../components/Player'; // Ensure this path is correct

const DrawingModal = ({ isOpen, onClose, onSave, deviceId, moduleKey, initialParams, streamUrl }) => {
    const playerWrapperRef = useRef(null);
    const canvasRef = useRef(null);
    const toast = useToast();

    const [viewMode, setViewMode] = useState('live');
    const [base64Screenshot, setBase64Screenshot] = useState(null);
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [shapes, setShapes] = useState([]);

    useEffect(() => {
        if (isOpen) {
            setViewMode('live');
            const existingScreenshot = initialParams?.screenshot;
            const existingParamsForModule = initialParams ? (initialParams[`${moduleKey}_params`] || []) : [];
            setBase64Screenshot(existingScreenshot || null);
            setShapes(existingParamsForModule);
            if (existingScreenshot) {
                setViewMode('drawing');
            }
        }
    }, [isOpen, initialParams, moduleKey]);

    useEffect(() => {
        if (viewMode !== 'drawing' || !base64Screenshot || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bgImage = new Image();
        bgImage.onload = () => {
            canvas.width = bgImage.naturalWidth;
            canvas.height = bgImage.naturalHeight;
            redrawCanvas(ctx, bgImage, shapes, moduleKey);
        };
        bgImage.src = base64Screenshot;
    }, [viewMode, base64Screenshot, shapes, moduleKey]);
    
    const handleCaptureClick = () => {
        const videoElement = playerWrapperRef.current?.querySelector('video');
        if (!videoElement || videoElement.videoWidth === 0) {
            toast({ title: "Player not ready.", status: "warning" });
            return;
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoElement.videoWidth;
        tempCanvas.height = videoElement.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
        const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.9);
        setBase64Screenshot(dataUrl);
        setViewMode('drawing');
    };

    const handleReturnToLive = () => setViewMode('live');

    const redrawCanvas = (ctx, bgImage, currentShapes, key) => {
        if (!ctx || !bgImage.src) return;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(bgImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
        drawAllShapes(ctx, currentShapes, key);
    };

    const getMousePos = (canvas, evt) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: Math.round((evt.clientX - rect.left) * (canvas.width / rect.width)),
            y: Math.round((evt.clientY - rect.top) * (canvas.height / rect.height))
        };
    };

    const handleMouseDown = (e) => {
        if (viewMode !== 'drawing') return;
        setStartPoint(getMousePos(canvasRef.current, e));
        setIsDrawing(true);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || viewMode !== 'drawing') return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bgImage = new Image(); bgImage.src = base64Screenshot;
        redrawCanvas(ctx, bgImage, shapes, moduleKey);
        
        const currentPos = getMousePos(canvas, e);
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (moduleKey === 'line_crossing_detection') {
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(currentPos.x, currentPos.y);
        } else if (moduleKey === 'idle_time_detection') {
            ctx.rect(startPoint.x, startPoint.y, currentPos.x - startPoint.x, currentPos.y - startPoint.y);
        }
        ctx.stroke();
    };

    // ===================================================================
    // === THIS FUNCTION CONTAINS THE FIX                            ===
    // ===================================================================
    const handleMouseUp = (e) => {
        if (!isDrawing || viewMode !== 'drawing') return;
        setIsDrawing(false);
        const endPoint = getMousePos(canvasRef.current, e);

        if (moduleKey === 'line_crossing_detection') {
            // FIX: Store the line as an array of arrays: [[x1, y1], [x2, y2]]
            const startCoords = [startPoint.x, startPoint.y];
            const endCoords = [endPoint.x, endPoint.y];
            // The final shape is an array containing ONE line.
            setShapes([[startCoords, endCoords]]);
        } else if (moduleKey === 'idle_time_detection') {
            // This format is already correct for ROIs
            const roi = { id: Date.now(), x1: Math.min(startPoint.x, endPoint.x), y1: Math.min(startPoint.y, endPoint.y), x2: Math.max(startPoint.x, endPoint.x), y2: Math.max(startPoint.y, endPoint.y) };
            setShapes(prev => [...prev, roi]);
        }
    };

    const handleSaveClick = () => {
        const dataToSave = {
            [`${moduleKey}_params`]: shapes,
            screenshot: base64Screenshot
        };
        onSave(dataToSave);
        onClose();
    };
    
    const handleClear = () => {
        setShapes([]);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const bgImage = new Image(); bgImage.src = base64Screenshot;
        redrawCanvas(ctx, bgImage, [], moduleKey);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="3xl" isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Configure Zone: {moduleKey.replace(/_/g, ' ')}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Center w="100%" h="auto" minH="500px" bg="gray.800" borderRadius="md" position="relative">
                        <div ref={playerWrapperRef} style={{ display: viewMode === 'live' ? 'block' : 'none', width: '100%' }}>
                            <Player key={streamUrl} playUrl={streamUrl} />
                        </div>
                        <div style={{ display: viewMode === 'drawing' ? 'block' : 'none', width: '100%' }}>
                            <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', borderRadius: 'md', cursor: 'crosshair' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={() => setIsDrawing(false)} />
                        </div>
                    </Center>
                </ModalBody>
                <ModalFooter>
                    <HStack w="100%" justify="space-between">
                        <HStack>
                            {viewMode === 'drawing' && (
                                <>
                                    <Button onClick={handleReturnToLive}>Back to Live</Button>
                                    <Button colorScheme="red" onClick={handleClear} isDisabled={shapes.length === 0}>Clear Shapes</Button>
                                </>
                            )}
                        </HStack>
                        <HStack>
                           {viewMode === 'live' && <Button colorScheme="teal" onClick={handleCaptureClick}>Capture Frame to Draw</Button>}
                           <Button variant="ghost" onClick={onClose}>Cancel</Button>
                           <Button colorScheme="blue" onClick={handleSaveClick} isDisabled={viewMode === 'live' && (!initialParams || shapes.length === 0)}>Confirm Zones</Button>
                        </HStack>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

// ===================================================================
// === THIS FUNCTION CONTAINS THE CORRESPONDING FIX              ===
// ===================================================================
// Helper function to draw shapes, now expecting the new line format
function drawAllShapes(ctx, shapes, moduleKey) {
    if (!ctx || !shapes || shapes.length === 0) return;
    
    ctx.strokeStyle = '#FF00FF';
    ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
    ctx.lineWidth = 2;
    
    if (moduleKey === 'line_crossing_detection' && shapes[0]) {
        // FIX: The line is now at shapes[0] and is an array of two points [p1, p2]
        const line = shapes[0];
        // The points p1 and p2 are arrays [x, y]
        if (line && line.length === 2) {
            ctx.beginPath();
            ctx.moveTo(line[0][0], line[0][1]); // Access coordinates with line[point_index][coordinate_index]
            ctx.lineTo(line[1][0], line[1][1]);
            ctx.stroke();
        }
    } else if (moduleKey === 'idle_time_detection') {
        // This logic remains the same
        shapes.forEach(shape => {
            if (shape && shape.x1 !== undefined) {
                ctx.beginPath();
                ctx.rect(shape.x1, shape.y1, shape.x2 - shape.x1, shape.y2 - shape.y1);
                ctx.stroke();
                ctx.fill();
            }
        });
    }
}

export default DrawingModal;