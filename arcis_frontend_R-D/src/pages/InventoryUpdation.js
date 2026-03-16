import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box as ChakraBox, Box,
    Table, Thead, Tbody, Tr, Th, Td,
    HStack, Button, Select, Input, Flex, Text, Spinner,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    useDisclosure, FormControl, FormLabel, useColorModeValue, RadioGroup, Radio, Grid
} from '@chakra-ui/react';
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaEdit, FaPlus } from 'react-icons/fa';
import * as XLSX from "xlsx";
import Swal from "sweetalert2";


import {
    getdistrictwiseAccess,
    getDistrictNameByAssemblyName
} from "../actions/cameraActions";


const getYourCamerasAPI = async (userEmail) => {
    try {
        const API_URL = `${process.env.REACT_APP_URL}/api/camera/getinventory`;
        const response = await axios.post(API_URL, { email: userEmail });

        if (response.data && response.data.success) {
            const { districts, inventory } = response.data;
            const rawData = inventory || [];

            const formattedInventory = rawData.map(item => ({
             
                id: item._id, 
                district: item.dist_name || "",
                assembly: item.accName || "",
                vehicleNo: item.vehicleNo || "",
                cameraId: item.cameraId || item.CameraId || "", 
                material: item.material || "",
                status: item.status || "",
                remarks: item.remarks || "",
                actionTaken: item.actionTaken || "",
                startDate: item.startDate ? item.startDate.split('T')[0] : "",
                endDate: item.endDate ? item.endDate.split('T')[0] : "",
                oldSerialNumber: item.oldSerialNumber || "",
                newSerialNumber: item.newSerialNumber || "",
                districtAssemblyCode: item.districtAssemblyCode || ""
            }));

            return { districts: districts || [], cameras: formattedInventory };
        } else {
            return { districts: [], cameras: [] };
        }
    } catch (error) {
        console.error("Error fetching inventory data:", error);
        return { districts: [], cameras: [] };
    }
};

const getVehiclesByAssemblyAPI = async (districtAssemblyCode) => {
    try {
        const API_URL = `${process.env.REACT_APP_URL}/api/gps/getVehiclesByAssembly`;
        const response = await axios.post(API_URL, { districtAssemblyCode });
        if (response.data && response.data.success) {
            return response.data.vehicles; 
        }
        return [];
    } catch (error) {
        console.error("Error fetching vehicles by assembly:", error);
        return [];
    }
};


const tableHeaderRowStyle = { position: "sticky", top: 0, zIndex: 1, borderRadius: "5px" };
const tableHeaderStyle = { padding: "8px 10px", verticalAlign: "middle", textAlign: "center", position: "relative", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const tableDataStyle = { padding: "8px 10px", verticalAlign: "middle", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", position: "relative", borderBottom: "1px solid #6c8aa5ff" };
const tableContainerStyle = {
  border: "1px solid #b3b8d6ff",
  borderRadius: "5px",
  maxHeight: "calc(180vh - 500px)",
  overflowY: "auto",
  overflowX: "auto"
};

const VerticalLine = () => (
    <span style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", height: "60%", width: "2px", backgroundColor: "#3F77A5" }}></span>
);

const Boxes = () => {
    const [allFetchedCameras, setAllFetchedCameras] = useState([]);
    const [displayedCameras, setDisplayedCameras] = useState([]);
    

    const [totalFilteredRecords, setTotalFilteredRecords] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);
    
    const [districtsList, setDistrictsList] = useState([]);
    const [assembliesList, setAssembliesList] = useState([]); 
    
    const [selectedDistrictName, setSelectedDistrictName] = useState("");
    const [selectedAssemblyValue, setSelectedAssemblyValue] = useState("");
    
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingAssemblies, setLoadingAssemblies] = useState(false);

    const [modalAssembliesList, setModalAssembliesList] = useState([]); 
    const [modalVehicleList, setModalVehicleList] = useState([]); 
    const [isVehicleLoading, setIsVehicleLoading] = useState(false);
    const [allDistrictAssemblyPairs, setAllDistrictAssemblyPairs] = useState([]); 

    const { isOpen: isModalOpen, onOpen, onClose } = useDisclosure();
    const [currentModalData, setCurrentModalData] = useState(null);
    const [modalMode, setModalMode] = useState('add'); 
    
    const [reportFormat, setReportFormat] = useState("csv");
    
    const buttonGradientColor = useColorModeValue("linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)", "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)");
    const textColor = useColorModeValue('gray.500', 'gray.400');
    const filterBgColor = useColorModeValue("#bfd8ea", "#2D3748");
    const radioButtonColor = useColorModeValue("#9CBAD2", "#CDDEEB");

    const buttonGradient = useColorModeValue(
        "linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)",
        "linear-gradient(93.5deg, #4A5568 0.56%, #4A5568 50.58%)"
    );

    useEffect(() => {
        const emailFromStorage = localStorage.getItem("email");
        if (emailFromStorage) setUserEmail(emailFromStorage);
    }, []);

    useEffect(() => {
        if (!userEmail) return;
        const fetchDistricts = async () => {
            setLoadingDistricts(true);
            try {
                const response = await getdistrictwiseAccess(userEmail);
                if (response?.success && Array.isArray(response.matchedDistricts)) {
                    const distinctDistricts = [];
                    const seenNames = new Set();
                    response.matchedDistricts.forEach(d => {
                        if (d.dist_name && !seenNames.has(d.dist_name)) {
                            distinctDistricts.push(d.dist_name);
                            seenNames.add(d.dist_name);
                        }
                    });
                    setDistrictsList(distinctDistricts.sort());
                } else {
                    setDistrictsList([]);
                }
            } catch (err) {
                console.error("Error fetching districts:", err);
                setDistrictsList([]);
            } finally {
                setLoadingDistricts(false);
            }
        };
        fetchDistricts();
    }, [userEmail]);

    useEffect(() => {
        if (userEmail && selectedDistrictName) {
            const fetchAssemblies = async () => {
                setLoadingAssemblies(true);
                setAssembliesList([]); 
                try {
                    const response = await getDistrictNameByAssemblyName(userEmail, selectedDistrictName);
                    if (response.success && Array.isArray(response.districts)) {
                        const sortedAssemblies = response.districts
                            .map(a => a.accName || a.name)
                            .filter(Boolean)
                            .sort((a, b) => a.localeCompare(b));
                        setAssembliesList(sortedAssemblies);
                    } else {
                        setAssembliesList([]);
                    }
                } catch (error) {
                    console.error("Error fetching assemblies:", error);
                    setAssembliesList([]);
                } finally {
                    setLoadingAssemblies(false);
                }
            };
            fetchAssemblies();
        } else {
            setAssembliesList([]);
        }
    }, [userEmail, selectedDistrictName]);

    const fetchCamerasByFilters = useCallback(async () => {
        if (!userEmail) return;
        setLoading(true);
        try {
            const { districts, cameras } = await getYourCamerasAPI(userEmail);
            setAllFetchedCameras(cameras);
            setAllDistrictAssemblyPairs(districts || []); 
        } catch (err) {
            console.error(err);
            setAllFetchedCameras([]);
            setAllDistrictAssemblyPairs([]);
        } finally {
            setLoading(false);
        }
    }, [userEmail]);

    useEffect(() => { fetchCamerasByFilters(); }, [userEmail, fetchCamerasByFilters]);


    useEffect(() => {
        let filteredData = [...allFetchedCameras];
        if (selectedDistrictName) filteredData = filteredData.filter(c => c.district === selectedDistrictName);
        if (selectedAssemblyValue) filteredData = filteredData.filter(c => c.assembly === selectedAssemblyValue);
        
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filteredData = filteredData.filter(c =>
                (c.vehicleNo && String(c.vehicleNo).toLowerCase().includes(lowercasedFilter)) ||
                (c.material && c.material.toLowerCase().includes(lowercasedFilter)) ||
                (c.status && c.status.toLowerCase().includes(lowercasedFilter)) ||
                (c.cameraId && String(c.cameraId).toLowerCase().includes(lowercasedFilter))
            );
        }
        
 
        setTotalFilteredRecords(filteredData.length);

        const startIndex = (currentPage - 1) * itemsPerPage;
        setDisplayedCameras(filteredData.slice(startIndex, startIndex + itemsPerPage));
    }, [allFetchedCameras, searchTerm, currentPage, itemsPerPage, selectedDistrictName, selectedAssemblyValue]);

    const handlePageChange = (page) => { setCurrentPage(page); };
    
    const handleDistrictChange = (e) => { 
        setSelectedDistrictName(e.target.value); 
        setSelectedAssemblyValue(''); 
        setCurrentPage(1); 
    };
    
    const handleAssemblyChange = (e) => { setSelectedAssemblyValue(e.target.value); setCurrentPage(1); };
    const handleSearchTermChange = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

    const handleOpenAddModal = () => {
        setModalMode('add');
        setCurrentModalData({ 
            district: '', assembly: '', vehicleNo: '', cameraId: '', material: '', 
            status: '', remarks: '', startDate: new Date().toISOString().split('T')[0], 
            endDate: '', oldSerialNumber: '', newSerialNumber: '', actionTaken: ''
        });
        setModalAssembliesList([]);
        setModalVehicleList([]); 
        onOpen();
    };

const handleOpenEditModal = async (item) => {
    setModalMode('edit');

    setCurrentModalData({ 
        ...item, 
        oldCameraIdForLookup: item.cameraId 
    }); 
    
    if (userEmail && item.district) {
        try {
            const response = await getDistrictNameByAssemblyName(userEmail, item.district);
            if (response.success && Array.isArray(response.districts)) {
                const sorted = response.districts.map(a => a.accName || a.name).sort();
                setModalAssembliesList(sorted);
            }
        } catch (e) { console.error(e); }
    }
    onOpen();
};

    const onCloseModal = () => {
        onClose();
        setCurrentModalData(null);
    };

    const handleModalInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentModalData(prev => ({ ...prev, [name]: value }));
    };

    const handleModalDistrictChange = async (e) => {
        const newDistrict = e.target.value;
        setCurrentModalData(prev => ({ ...prev, district: newDistrict, assembly: '', vehicleNo: '', cameraId: '' }));
        setModalAssembliesList([]);
        setModalVehicleList([]); 

        if (userEmail && newDistrict) {
            try {
                const response = await getDistrictNameByAssemblyName(userEmail, newDistrict);
                if (response.success && Array.isArray(response.districts)) {
                     const sorted = response.districts.map(a => a.accName || a.name).sort();
                     setModalAssembliesList(sorted);
                }
            } catch (error) { console.error(error); }
        }
    };

    const handleModalAssemblyChange = async (e) => {
        const newAssembly = e.target.value;
        const matchingPair = allDistrictAssemblyPairs.find(
            pair => pair.dist_name === currentModalData.district && pair.accName === newAssembly
        );

        setCurrentModalData(prev => ({ ...prev, assembly: newAssembly, vehicleNo: '', cameraId: '' }));
        setModalVehicleList([]);

        if (matchingPair && matchingPair.districtAssemblyCode) {
            setIsVehicleLoading(true);
            const vehicles = await getVehiclesByAssemblyAPI(matchingPair.districtAssemblyCode);
            setModalVehicleList(vehicles);
            setIsVehicleLoading(false);
        }
    };

    const handleModalVehicleChange = (e) => {
        const selectedVehicle = e.target.value;
        const vehicleObj = modalVehicleList.find(v => v.vehicleNo === selectedVehicle);
        setCurrentModalData(prev => ({
            ...prev,
            vehicleNo: selectedVehicle,
            cameraId: vehicleObj ? vehicleObj.cameraId : prev.cameraId 
        }));
    };

    const handleSave = async () => {
        if (!currentModalData) return;
        const { vehicleNo, cameraId, district, assembly, material, status, startDate, oldSerialNumber, newSerialNumber, remarks, endDate } = currentModalData;

        if (!vehicleNo || !district || !assembly || !material || !startDate || !status || !cameraId) {
            Swal.fire({ title: 'Validation Error', text: 'Please fill all required fields.', icon: 'warning', confirmButtonText: 'OK' });
            return;
        }

        const selectedPair = allDistrictAssemblyPairs.find(p => p.dist_name === district && p.accName === assembly);
        
        const payload = {
            dist_name: district,
            accName: assembly,
            vehicleNo, cameraId, material, status, remarks, startDate, endDate, oldSerialNumber, newSerialNumber,
            districtAssemblyCode: selectedPair ? selectedPair.districtAssemblyCode : "" 
        };

        try {
            const API_URL = `${process.env.REACT_APP_URL}/api/camera/addinventory`;
            const response = await axios.post(API_URL, payload);
            if (response.data && response.data.success) {
                Swal.fire({ title: 'Success', text: 'Inventory added successfully.', icon: 'success', timer: 2000, showConfirmButton: false });
                onCloseModal();
                fetchCamerasByFilters();
            } else { throw new Error(response.data.message || 'Operation failed.'); }
        } catch (error) {
            Swal.fire({ title: 'API Error', text: error.response?.data?.message || error.message, icon: 'error' });
        }
    };

const handleUpdate = async () => {
    if (!currentModalData) return;

    if (!currentModalData.cameraId) {
        Swal.fire({ title: 'Error', text: 'Camera ID is missing.', icon: 'error' });
        return;
    }

    const result = await Swal.fire({
        title: 'Are you sure?', 
        text: "Do you want to update this inventory item?", 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#3085d6', 
        cancelButtonColor: '#d33', 
        confirmButtonText: 'Yes, Update it!'
    });

    if (!result.isConfirmed) return;

    const payload = {
   
        oldCameraId: currentModalData.oldCameraIdForLookup, 
        cameraId: currentModalData.cameraId,              
        vehicleNo: currentModalData.vehicleNo,
        material: currentModalData.material,
        status: currentModalData.status,
        remarks: currentModalData.remarks,
        startDate: currentModalData.startDate,
        endDate: currentModalData.endDate,
        newSerialNumber: currentModalData.newSerialNumber,
        oldSerialNumber: currentModalData.oldSerialNumber,
        actionTaken: currentModalData.actionTaken
    };

    try {
        const API_URL = `${process.env.REACT_APP_URL}/api/camera/updateinventory`; 
        const response = await axios.put(API_URL, payload); 

        if (response.data && response.data.success) {
            Swal.fire({ title: 'Success', text: 'Inventory updated.', icon: 'success', timer: 2000, showConfirmButton: false });
            onCloseModal();
            setTimeout(() => { fetchCamerasByFilters(); }, 500);
        } else { throw new Error(response.data.message || 'Update failed.'); }
    } catch (error) {
        Swal.fire({ title: 'Error', text: error.response?.data?.message || error.message, icon: 'error' });
    }
};

    const handleDownloadReport = useCallback(() => {
        let data = [...allFetchedCameras];
        if (selectedDistrictName) data = data.filter((c) => c.district === selectedDistrictName);
        if (selectedAssemblyValue) data = data.filter((c) => c.assembly === selectedAssemblyValue);
        
        if (data.length === 0) { Swal.fire('Info', 'No data to export.', 'info'); return; }

        const exportData = data.map(item => ({
            "District": item.district, "Assembly": item.assembly, "Vehicle No": item.vehicleNo, "Camera ID": item.cameraId,
            "Material": item.material, "Status": item.status, "Start Date": item.startDate, "End Date": item.endDate, "Remarks": item.remarks
        }));

        if (reportFormat === "csv") {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Inventory");
            XLSX.writeFile(wb, "Inventory.xlsx");
        } else {
            const doc = new jsPDF();
            const columns = Object.keys(exportData[0]);
            const rows = exportData.map(Object.values);
            doc.autoTable({ head: [columns], body: rows, startY: 20, styles: { fontSize: 8 } });
            doc.save("Inventory.pdf");
        }
    }, [reportFormat, allFetchedCameras, selectedDistrictName, selectedAssemblyValue]);

    // Calculate total pages for display
    const totalPages = Math.ceil(totalFilteredRecords / itemsPerPage);

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <style>
                {`
                    .swal2-container {
                        z-index: 10000 !important;
                    }
                `}
            </style>
            <ChakraBox borderRadius="lg" h={"fit-content"} flexDirection="column" gap={4} display="flex">

                <Text fontWeight={400} fontSize="26px" color={textColor}>Inventory Updation</Text>

                <Flex w="full" alignItems="center" justifyContent="flex-start" gap={4} mb={5} flexWrap="wrap">
                    <Select placeholder={loadingDistricts ? "Loading..." : "Select District"} borderRadius={"12px"} bg={buttonGradientColor} value={selectedDistrictName} onChange={handleDistrictChange} width={"145px"} height={"34px"} fontSize={"12px"} isDisabled={loadingDistricts || districtsList.length === 0} icon={loadingDistricts ? <Spinner size="xs" /> : undefined}>
                        {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>
                    <Select placeholder={loadingAssemblies ? "Loading..." : "Select Assembly"} bg={buttonGradientColor} borderRadius={"12px"} value={selectedAssemblyValue} onChange={handleAssemblyChange} width={"135px"} height={"34px"} fontSize={"12px"} isDisabled={loadingAssemblies || !selectedDistrictName || assembliesList.length === 0} icon={loadingAssemblies ? <Spinner size="xs" /> : undefined}>
                        {assembliesList.map(a => <option key={a} value={a}>{a}</option>)}
                    </Select>
                    <HStack spacing={2}>
                        <Text fontSize="12px" fontWeight="500">Search:</Text>
                        <Input type="text" placeholder="Vehicle Number" value={searchTerm} onChange={handleSearchTermChange} width={"180px"} height={"34px"} fontSize={"12px"} borderRadius="12px" bg={filterBgColor} />
                    </HStack>
                    <Button leftIcon={<FaPlus />} onClick={handleOpenAddModal} height={"34px"} fontSize={"12px"} bg={filterBgColor} borderRadius="12px">Add Inventory</Button>
                    <RadioGroup onChange={setReportFormat} value={reportFormat}>
                        <Grid templateColumns="max-content max-content" alignItems="center" gap={3}>
                            <Flex justifyContent={"space-between"} alignItems={"center"}>
                                <Radio value="csv" colorScheme="blackAlpha" _checked={{ borderColor: useColorModeValue("black", "white"), bg: radioButtonColor, _before: { bg: useColorModeValue("black", "white") }}} color={useColorModeValue("black", "white")} width={"60px"} height={"34px"} fontSize={"12px"}>CSV</Radio>
                                <Box w="1px" h="14px" ml={2} bg={useColorModeValue("black", "white")} />
                            </Flex>
                            <Radio value="pdf" colorScheme="blackAlpha" _checked={{ borderColor: useColorModeValue("black", "white"), bg: radioButtonColor, _before: { bg: useColorModeValue("black", "white") }}} color={useColorModeValue("black", "white")} width={"60px"} height={"34px"} fontSize={"12px"}>PDF</Radio>
                        </Grid>
                    </RadioGroup>
                    <Button bg={buttonGradientColor} borderRadius={"12px"} onClick={handleDownloadReport} width={"100px"} height={"34px"} fontSize={"12px"}>Download</Button>
                </Flex>

                {loading ? <Flex justify="center" p={10}><Spinner size="xl" /></Flex> : (
                    <>
                        <div style={tableContainerStyle}>
                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr style={tableHeaderRowStyle} bg={buttonGradientColor}>
                                        <Th style={tableHeaderStyle}>Sr No <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>District <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Assembly <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Vehicle No <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Camera ID <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Material <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Status <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Remarks <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Start Date <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>End Date <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>New Serial Number <VerticalLine /></Th>
                                         <Th style={tableHeaderStyle}>Old Serial Number <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Action</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {displayedCameras.length > 0 ? (
                                        displayedCameras.map((item, index) => (
                                            <Tr key={item.id || index}>
                                                <Td style={tableDataStyle}>{(currentPage - 1) * itemsPerPage + index + 1} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.district} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.assembly} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.vehicleNo} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.cameraId} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.material} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.status} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.remarks} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.startDate} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.endDate} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.oldSerialNumber} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{item.newSerialNumber} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>
                                                    <Button size="xs" colorScheme="teal" onClick={() => handleOpenEditModal(item)}><FaEdit /></Button>
                                                </Td>
                                            </Tr>
                                        ))
                                    ) : (
                                        <Tr><Td colSpan="13" textAlign="center" py={5} style={tableDataStyle}>No records found.</Td></Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </div>
                        
                  
                        {totalFilteredRecords > itemsPerPage && (
                             <Flex justifyContent="center" mt={4} alignItems="center">
                                <Button onClick={() => handlePageChange(currentPage - 1)} isDisabled={currentPage === 1} mr={2} size="sm">Previous</Button>
                                <Text fontSize="sm">Page {currentPage} of {totalPages}</Text>
                                <Button onClick={() => handlePageChange(currentPage + 1)} isDisabled={currentPage >= totalPages} ml={2} size="sm">Next</Button>
                            </Flex>
                        )}
                    </>
                )}
            </ChakraBox>

            {currentModalData && (
                <Modal isOpen={isModalOpen} onClose={onCloseModal} isCentered size="2xl">
                    <ModalOverlay />
                    <ModalContent bg={buttonGradient} color={buttonGradient} borderRadius="md">
                        <ModalHeader borderBottom="1px solid white" fontSize="lg" py={3}>
                            {modalMode === 'add' ? 'Add Inventory' : 'Update Inventory'}
                        </ModalHeader>
                        <ModalCloseButton color="white" />
                        <ModalBody py={4}>
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">District</FormLabel>
                                    <Select 
                                        size="sm" bg={buttonGradient} color={buttonGradient} 
                                        name="district" 
                                        value={currentModalData.district} 
                                        onChange={handleModalDistrictChange} 
                                        placeholder="Select District" 
                                        isDisabled={modalMode === 'edit'}
                                    >
                                        {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                                    </Select>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Assembly</FormLabel>
                                    <Select 
                                        size="sm" bg={buttonGradient} color={buttonGradient} 
                                        name="assembly" 
                                        value={currentModalData.assembly} 
                                        onChange={modalMode === 'add' ? handleModalAssemblyChange : handleModalInputChange} 
                                        placeholder="Select Assembly" 
                                        isDisabled={!currentModalData.district || modalMode === 'edit'}
                                    >
                                        {modalAssembliesList.map(a => <option key={a} value={a}>{a}</option>)}
                                    </Select>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">
                                        Vehicle No {isVehicleLoading && <Spinner size="xs" color="blue.300" />}
                                    </FormLabel>
                                    {modalMode === 'add' ? (
                                        <Select
                                            size="sm" 
                                            name="vehicleNo"
                                            value={currentModalData.vehicleNo}
                                            onChange={handleModalVehicleChange}
                                            placeholder="Select Vehicle"
                                            isDisabled={!currentModalData.assembly || isVehicleLoading}
                                        >
                                            {modalVehicleList.map(v => <option key={v.vehicleNo} value={v.vehicleNo}>{v.vehicleNo}</option>)}
                                        </Select>
                                    ) : (
                                        <Input size="sm"  bg={buttonGradient} color={buttonGradient}  value={currentModalData.vehicleNo} isReadOnly />
                                    )}
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Camera ID</FormLabel>
                                    <Input 
                                        size="sm" bg={buttonGradient} color={buttonGradient}
                                        name="cameraId" 
                                        value={currentModalData.cameraId} 
                                        onChange={handleModalInputChange} 
                                        placeholder="Enter Camera ID" 
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Material</FormLabel>
                                    <Select size="sm" bg={buttonGradient} color={buttonGradient} name="material" value={currentModalData.material} onChange={handleModalInputChange} placeholder="Select Material">
                                        <option value="PTZ Camera">PTZ Camera</option>
                                        <option value="Vehicle">Vehicle</option>
                                        <option value="GPS Module">GPS Module</option>
                                        <option value="SIM Card">SIM Card</option>
                                        <option value="Router">Router</option>
                                        <option value="Power Supply">Power Supply</option>
                                        <option value="NVR">NVR</option>
                                        <option value="LCD">LCD</option>
                                    </Select>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Status</FormLabel>
                                    <Select size="sm" bg={buttonGradient} color={buttonGradient} name="status" value={currentModalData.status} onChange={handleModalInputChange} placeholder="Select Status">
                                        <option value="Repaired">Repaired</option>
                                        <option value="Replaced">Replaced</option>
                                    </Select>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Start Date</FormLabel>
                                    <Input size="sm" bg={buttonGradient} color={buttonGradient} type="date" name="startDate" value={currentModalData.startDate} onChange={handleModalInputChange} sx={{ "::-webkit-calendar-picker-indicator": { filter: "invert(1)" } }} />
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">End Date</FormLabel>
                                    <Input size="sm" bg={buttonGradient} color={buttonGradient} type="date" name="endDate" value={currentModalData.endDate} onChange={handleModalInputChange} sx={{ "::-webkit-calendar-picker-indicator": { filter: "invert(1)" } }} />
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">Old Serial No</FormLabel>
                                    <Input size="sm" bg={buttonGradient} color={buttonGradient} name="oldSerialNumber" value={currentModalData.oldSerialNumber} onChange={handleModalInputChange} />
                                </FormControl>

                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">New Serial No</FormLabel>
                                    <Input size="sm" bg={buttonGradient} color={buttonGradient} name="newSerialNumber" value={currentModalData.newSerialNumber} onChange={handleModalInputChange} />
                                </FormControl>

                                <FormControl gridColumn="span 2">
                                    <FormLabel fontSize="sm" fontWeight="bold">Remarks</FormLabel>
                                    <Input size="sm" bg={buttonGradient} color={buttonGradient} name="remarks" value={currentModalData.remarks} onChange={handleModalInputChange} />
                                </FormControl>

                            </Grid>
                        </ModalBody>
                        <ModalFooter bg={buttonGradient} color={buttonGradient} borderTop="1px solid white" py={3}>
                            <Button size="sm" colorScheme="blue" mr={3} onClick={modalMode === 'add' ? handleSave : handleUpdate}>
                                {modalMode === 'add' ? 'Save' : 'Update'}
                            </Button>
                            <Button size="sm" onClick={onCloseModal} bg="white" color="black" _hover={{ bg: "gray.200" }}>Cancel</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </div>
    );
};


export default Boxes;

