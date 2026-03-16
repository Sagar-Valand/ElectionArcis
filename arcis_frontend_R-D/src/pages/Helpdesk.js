import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box as ChakraBox, Box,
    Table, Thead, Tbody, Tr, Th, Td,
    HStack, Button, Select, Input, Flex, Text, Spinner,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    useDisclosure, FormControl, FormLabel, useToast, useColorModeValue, RadioGroup, Radio, Grid
} from '@chakra-ui/react';
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaEdit, FaPlus } from 'react-icons/fa';
import * as XLSX from "xlsx";
import Swal from 'sweetalert2';


import {
    getdistrictwiseAccess,
    getDistrictNameByAssemblyName
} from "../actions/cameraActions";



const getYourCamerasAPI = async (userEmail) => {
    try {
        const API_URL = `${process.env.REACT_APP_URL}/api/camera/getHelpdeskdata`;
        const response = await axios.post(API_URL, { email: userEmail });

        if (response.data && response.data.success) {
            const { districts, cameras } = response.data;
            const formattedCameras = cameras.map(cam => ({
                district: cam.district || cam.dist_name || "",
                assembly: cam.assembly || cam.accName || "",
                vehicleNo: cam.vehicleNo || "",
                cameraId: cam.cameraId || "",
                activity: cam.activity || "",
                dateTime: cam.dateTime || ""
            }));
            return { districts, cameras: formattedCameras };
        } else {
            return { districts: [], cameras: [] };
        }
    } catch (error) {
        console.error("Error fetching helpdesk data:", error);
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


const headingStyle = { textAlign: 'left', fontSize: '25px', fontWeight: '650', marginBottom: '20px' };
const filterLabelStyle = { marginRight: '10px', fontWeight: 'bold', fontSize: '16px', whiteSpace: 'nowrap' };
const tableHeaderRowStyle = {
    position: "sticky",
    top: 0,
    zIndex: 1,
    borderRadius: "5px"
};
const tableHeaderStyle = {
    padding: "8px 10px",
    verticalAlign: "middle",
    textAlign: "center",
    position: "relative",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
};
const tableDataStyle = {
    padding: "8px 10px",
    verticalAlign: "middle",
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    position: "relative",
    borderBottom: "1px solid #6c8aa5ff"
};
const tableContainerStyle = {
    border: "1px solid #b3b8d6ff",
    borderRadius: "5px",
    maxHeight: "calc(180vh - 500px)",
    overflowY: "auto",
    overflowX: "auto"
};
const filterContainerStyle = { display: 'flex', alignItems: 'center', gap: '10px' };
const inputStyle = {
    borderColor: "transparent",
    width: "125px",
    height: "34px",
    fontSize: "12px",
    borderRadius: "12px"
};

const VerticalLine = () => (
    <span style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", height: "60%", width: "2px", backgroundColor: "#3F77A5" }}></span>
);


const Boxes = () => {

    const [allFetchedCameras, setAllFetchedCameras] = useState([]);
    const [displayedCameras, setDisplayedCameras] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(50);
    const [loading, setLoading] = useState(false);


    const [districtsList, setDistrictsList] = useState([]);
    const [assembliesList, setAssembliesList] = useState([]);
    const [selectedDistrictName, setSelectedDistrictName] = useState("");
    const [selectedAssemblyValue, setSelectedAssemblyValue] = useState("");

 
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingAssemblies, setLoadingAssemblies] = useState(false);

    const [districtError, setDistrictError] = useState("");
  
    const [assemblyError, setAssemblyError] = useState("");


    const { isOpen: isModalOpen, onOpen, onClose } = useDisclosure();
    const [currentModalData, setCurrentModalData] = useState(null);
    const [modalMode, setModalMode] = useState('add');

    
    const [modalVehicleList, setModalVehicleList] = useState([]);
    const [isVehicleLoading, setIsVehicleLoading] = useState(false);

    
    const [allDistrictAssemblyPairs, setAllDistrictAssemblyPairs] = useState([]);
    const [modalAssembliesList, setModalAssembliesList] = useState([]);

    const [reportFormat, setReportFormat] = useState("csv");
    const [selectedLocationType, setSelectedLocationType] = useState("all");
    const toast = useToast();


    useEffect(() => {
        const emailFromStorage = localStorage.getItem("email");
        if (emailFromStorage) setUserEmail(emailFromStorage);
    }, []);


    const fetchCamerasByFilters = useCallback(async () => {
        if (!userEmail) return;
        setLoading(true);
        try {
            const { districts, cameras } = await getYourCamerasAPI(userEmail);
            const cameraData = Array.isArray(cameras) ? cameras : [];

            setAllFetchedCameras(cameraData);
            setAllDistrictAssemblyPairs(districts || []);

        } catch (err) {
            setAllFetchedCameras([]);
            setAllDistrictAssemblyPairs([]);
        } finally {
            setLoading(false);
        }
    }, [userEmail]);

    useEffect(() => { fetchCamerasByFilters(); }, [userEmail, fetchCamerasByFilters]);


    useEffect(() => {
        if (!userEmail) {
            setDistrictsList([]);
            return;
        }
        const fetchDistricts = async () => {
            setLoadingDistricts(true);
            setDistrictError("");
            try {
                const response = await getdistrictwiseAccess(userEmail);
                if (response?.success && Array.isArray(response.matchedDistricts)) {
                    const distinctDistrictsData = [];
                    const seenNames = new Set();
                    response.matchedDistricts.forEach(d => {
                        if (d.dist_name && !seenNames.has(d.dist_name)) {
                            distinctDistrictsData.push(d.dist_name);
                            seenNames.add(d.dist_name);
                        }
                    });
                    setDistrictsList(distinctDistrictsData.sort((a, b) => a.localeCompare(b)));
                } else {
                    setDistrictsList([]);
                    setDistrictError(response?.message || "No districts found.");
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
            const fetchAssembliesForDistrict = async () => {
                setLoadingAssemblies(true);
                setAssemblyError("");
                try {
                    const response = await getDistrictNameByAssemblyName(userEmail, selectedDistrictName);
                    if (response.success && Array.isArray(response.districts)) {
                        const assemblyNames = response.districts
                            .map(a => a.accName || a.name)
                            .filter(Boolean)
                            .sort((a, b) => a.localeCompare(b));
                        setAssembliesList(assemblyNames);
                    } else {
                        setAssemblyError(response.message || "Failed to fetch assemblies.");
                        setAssembliesList([]);
                    }
                } catch (error) {
                    console.error("API Error fetching assemblies:", error);
                    setAssembliesList([]);
                } finally {
                    setLoadingAssemblies(false);
                }
            };
            fetchAssembliesForDistrict();
        } else {
            setAssembliesList([]);
        }
    }, [userEmail, selectedDistrictName]);

  
    useEffect(() => {
        let filteredData = [...allFetchedCameras];

        if (selectedDistrictName) {
            filteredData = filteredData.filter(camera => camera.district === selectedDistrictName);
        }
        if (selectedAssemblyValue) {
            filteredData = filteredData.filter(camera => camera.assembly === selectedAssemblyValue);
        }
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filteredData = filteredData.filter(camera =>
                (camera.cameraId && camera.cameraId.toLowerCase().includes(lowercasedFilter)) ||
                (camera.vehicleNo && String(camera.vehicleNo).toLowerCase().includes(lowercasedFilter))
            );
        }
        setDisplayedCameras(filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
    }, [allFetchedCameras, searchTerm, currentPage, itemsPerPage, selectedDistrictName, selectedAssemblyValue]);




    const handleOpenAddModal = () => {
        setModalMode('add');
        setCurrentModalData({ district: '', assembly: '', vehicleNo: '', cameraId: '', activity: '' });
        setModalAssembliesList([]);
        setModalVehicleList([]); 
        onOpen();
    };

    const handleOpenEditModal = (camera) => {
        setModalMode('edit');
        setCurrentModalData({ ...camera });


        const assemblies = allDistrictAssemblyPairs
            .filter(pair => pair.dist_name === camera.district)
            .map(pair => pair.accName);
        setModalAssembliesList([...new Set(assemblies)].sort());

        onOpen();
    };

    const onCloseModal = () => {
        onClose();
        setCurrentModalData(null);
    };


    const handleSave = async () => {
        if (!currentModalData) return;
        const { vehicleNo, cameraId, district, assembly, activity } = currentModalData;

      
        if (!vehicleNo || !cameraId || !district || !assembly) {
            Swal.fire({
                title: 'Missing Information',
                text: 'Please fill all required fields.',
                icon: 'warning',
                confirmButtonColor: '#3182ce'
            });
            return;
        }

        const selectedPair = allDistrictAssemblyPairs.find(p => p.dist_name === district && p.accName === assembly);
        if (!selectedPair) {
            Swal.fire({
                title: 'Data Error',
                text: 'Could not find assembly code for the selected location.',
                icon: 'error',
                confirmButtonColor: '#e53e3e'
            });
            return;
        }

        const payload = {
            dist_name: district,
            accName: assembly,
            vehicleNo: vehicleNo,
            cameraId: cameraId,
            activity: activity,
            dateTime: new Date().toISOString(),
            districtAssemblyCode: selectedPair.districtAssemblyCode
        };

        try {
            const API_URL = `${process.env.REACT_APP_URL}/api/camera/addhelpdesk`;
            const response = await axios.post(API_URL, payload);
            if (response.data && response.data.success) {
        
                Swal.fire({
                    title: 'Event Logged!',
                    text: 'New event has been saved successfully.',
                    icon: 'success',
                    confirmButtonColor: '#38a169',
                    timer: 2000,
                    showConfirmButton: false
                });
                onCloseModal();
                fetchCamerasByFilters(); 
            } else {
                throw new Error(response.data.message || 'Backend operation failed.');
            }
        } catch (error) {
     
            Swal.fire({
                title: 'Submission Failed',
                text: error.response?.data?.message || error.message || 'Could not log event.',
                icon: 'error',
                confirmButtonColor: '#e53e3e'
            });
        }
    };


    const handleUpdate = async () => {
        if (!currentModalData) return;

        const payload = {
            cameraId: currentModalData.cameraId,
            activity: currentModalData.activity,
            dateTime: new Date(currentModalData.dateTime).toISOString(),
        };

        try {
            const API_URL = `${process.env.REACT_APP_URL}/api/camera/updateActivity`;
            const response = await axios.put(API_URL, payload);

            if (response.data && response.data.success) {
       
                Swal.fire({
                    title: 'Updated!',
                    text: 'Event activity has been updated successfully.',
                    icon: 'success',
                    confirmButtonColor: '#38a169',
                    timer: 2000,
                    showConfirmButton: false
                });
                onCloseModal();
                fetchCamerasByFilters();
            } else {
                throw new Error(response.data.message || 'Backend update failed.');
            }
        } catch (error) {

            Swal.fire({
                title: 'Update Failed',
                text: error.response?.data?.message || error.message || 'Could not update event.',
                icon: 'error',
                confirmButtonColor: '#e53e3e'
            });
        }
    };

    const handleModalInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentModalData(prev => ({ ...prev, [name]: value }));
    };

    const handleModalDistrictChange = (e) => {
        const newDistrict = e.target.value;
        setCurrentModalData(prev => ({
            ...prev,
            district: newDistrict,
            assembly: '',
            vehicleNo: '',
            cameraId: ''
        }));
        setModalVehicleList([]); 

        
        const relevantPairs = allDistrictAssemblyPairs.filter(pair => pair.dist_name === newDistrict);
        const assemblies = [...new Set(relevantPairs.map(pair => pair.accName).filter(Boolean))];
        setModalAssembliesList(assemblies.sort());
    };

  
    const handleModalAssemblyChange = async (e) => {
        const newAssembly = e.target.value;

     
        const matchingPair = allDistrictAssemblyPairs.find(
            pair => pair.dist_name === currentModalData.district && pair.accName === newAssembly
        );

        setCurrentModalData(prev => ({
            ...prev,
            assembly: newAssembly,
            vehicleNo: '',
            cameraId: ''
        }));
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
            cameraId: vehicleObj ? vehicleObj.cameraId : ''
        }));
    };

    const handleSearchTermChange = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };
    const handlePageChange = (page) => { setCurrentPage(page); };

    const handleDistrictChange = (e) => {
        setSelectedDistrictName(e.target.value);
        setSelectedAssemblyValue('');
        setAssembliesList([]);
        setCurrentPage(1);
    };

    const handleAssemblyChange = (e) => { setSelectedAssemblyValue(e.target.value); setCurrentPage(1); };


    const totalItemsAfterFilters = allFetchedCameras.filter(c => {
        const districtMatch = !selectedDistrictName || c.district === selectedDistrictName;
        const assemblyMatch = !selectedAssemblyValue || c.assembly === selectedAssemblyValue;
        const searchMatch = !searchTerm ||
            (c.cameraId && c.cameraId.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.vehicleNo && String(c.vehicleNo).toLowerCase().includes(searchTerm.toLowerCase()));
        return districtMatch && assemblyMatch && searchMatch;
    }).length;

    const buttonGradientColor = useColorModeValue(
        "linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)",
        "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)"
    );

    const getFilteredDataForExportAndCount = () => {
        let data = [...allFetchedCameras];
        if (selectedDistrictName) data = data.filter((c) => c.district === selectedDistrictName);
        if (selectedAssemblyValue) data = data.filter((c) => c.assembly === selectedAssemblyValue);
        // eslint-disable-next-line
        if (selectedLocationType !== "all") {
        
        }
        return data;
    };

    const handlePDFExport = useCallback(() => {
        const dataToExport = getFilteredDataForExportAndCount().map((camera) => ({
            "District": camera.district,
            "Assembly": camera.assembly,
            "Vehicle No": camera.vehicleNo,
            "Camera Id": camera.cameraId,
            "Activity": camera.activity,
            "Date Time": new Date(camera.dateTime).toLocaleString()
        }));

        if (dataToExport.length === 0) { alert("No data to export."); return; }

        const doc = new jsPDF();
        const columns = Object.keys(dataToExport[0]);
        const rows = dataToExport.map((item) => Object.values(item));

        doc.autoTable({
            head: [columns],
            body: rows,
            startY: 20,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 160, 133] },
        });
        doc.save("helpdesk_data.pdf");
    }, [getFilteredDataForExportAndCount]);

    const handleCSVExport = useCallback(() => {
        const dataToExport = getFilteredDataForExportAndCount().map((camera) => ({
            "District": camera.district,
            "Assembly": camera.assembly,
            "Vehicle No": camera.vehicleNo,
            "Camera Id": camera.cameraId,
            "Activity": camera.activity,
            "Date Time": new Date(camera.dateTime).toLocaleString()
        }));

        if (dataToExport.length === 0) { alert("No data to export."); return; }

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Helpdesk Data");
        XLSX.writeFile(wb, "helpdesk_data.xlsx");
    }, [getFilteredDataForExportAndCount]);

    const handleDownloadReport = useCallback(() => {
        if (reportFormat === "csv") handleCSVExport();
        else if (reportFormat === "pdf") handlePDFExport();
        else alert("Please select a report format.");
    }, [reportFormat, handleCSVExport, handlePDFExport]);

    const textColor = useColorModeValue('gray.500', 'gray.400');
    const radioButtonColor = useColorModeValue("#9CBAD2", "#CDDEEB");

    const buttonGradient = useColorModeValue(
        "linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)",
        "linear-gradient(93.5deg, #4A5568 0.56%, #4A5568 50.58%)"
    );

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <ChakraBox>

                <Text fontWeight={400} fontSize="26px" color={textColor} mb={4}>
                    Helpdesk Report
                </Text>

               
                <HStack spacing={4} mb={5} justifyContent="flex-start" flexWrap="wrap">
                    <div style={filterContainerStyle}>
                        <Select
                            placeholder={loadingDistricts ? "Loading..." : "Select Districts"}
                            borderRadius={"12px"}
                            bg={buttonGradientColor}
                            value={selectedDistrictName}
                            onChange={handleDistrictChange}
                            color={useColorModeValue("black", "white")}
                            sx={{ "> option": { bg: useColorModeValue("white", "gray.700"), color: useColorModeValue("black", "white") } }}
                            width={"145px"} height={"34px"} fontSize={"12px"}
                            isDisabled={loadingDistricts || districtsList.length === 0}
                            icon={loadingDistricts ? <Spinner size="xs" /> : undefined}
                        >
                            {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                        </Select>
                    </div>
                    <div style={filterContainerStyle}>
                        <Select
                            placeholder={loadingAssemblies ? "Loading..." : "Select Assemblies"}
                            bg={buttonGradientColor}
                            borderRadius={"12px"}
                            value={selectedAssemblyValue}
                            onChange={handleAssemblyChange}
                            color={useColorModeValue("black", "white")}
                            sx={{ "> option": { bg: useColorModeValue("white", "gray.700"), color: useColorModeValue("black", "white") } }}
                            width={"125px"} height={"34px"} fontSize={"12px"}
                            isDisabled={!selectedDistrictName || loadingAssemblies || assembliesList.length === 0}
                            icon={loadingAssemblies ? <Spinner size="xs" /> : undefined}
                        >
                            {assembliesList.map(a => <option key={a} value={a}>{a}</option>)}
                        </Select>
                    </div>

                    <div style={filterContainerStyle}>
                        <Text as="label" style={filterLabelStyle}>Search:</Text>
                        <Input type="text" placeholder="Enter ID or Vehicle" value={searchTerm} onChange={handleSearchTermChange} style={inputStyle}
                            width={"125px"} height={"34px"} fontSize={"12px"}
                            color={useColorModeValue("black", "white")}
                            _placeholder={{ color: useColorModeValue("gray.600", "gray.400") }} />
                    </div>
                    <Button leftIcon={<FaPlus />} onClick={handleOpenAddModal} size="sm" height="34px">Add Event</Button>

                    <RadioGroup onChange={setReportFormat} value={reportFormat} >
                        <Grid templateColumns="1fr 1fr" alignItems="center" gap={2}>
                            <Flex justifyContent={"space-between"} alignItems={"center"}>
                                <Radio value="csv" colorScheme="blackAlpha"
                                    _checked={{ borderColor: useColorModeValue("black", "white"), bg: radioButtonColor, _before: { bg: useColorModeValue("black", "white") } }}
                                    color={useColorModeValue("black", "white")} width={"60px"} height={"34px"} fontSize={"12px"}>CSV</Radio>
                                <Box w="1px" h="14px" bg={useColorModeValue("black", "white")} />
                            </Flex>
                            <Radio value="pdf" colorScheme="blackAlpha"
                                _checked={{ borderColor: useColorModeValue("black", "white"), bg: radioButtonColor, _before: { bg: useColorModeValue("black", "white") } }}
                                color={useColorModeValue("black", "white")} width={"60px"} height={"34px"} fontSize={"12px"}>PDF</Radio>
                        </Grid>
                    </RadioGroup>

                    <Button bg={buttonGradientColor} color={useColorModeValue("black", "white")}
                        _hover={{ bg: useColorModeValue("linear-gradient(93.5deg, #8EABC5 , #C4D7E7 94.58%)", "linear-gradient(93.5deg, #1F1F1F 0.56%, #010307 50.58%)") }}
                        borderRadius={"12px"} size="sm" onClick={handleDownloadReport} width={"125px"} height={"34px"} fontSize={"12px"}>
                        Download
                    </Button>
                </HStack>

              
                {loading ? <Flex justifyContent="center" alignItems="center" height="200px"><Spinner size="xl" /></Flex> : (
                    <>
                        <div style={tableContainerStyle}>
                            <Table variant="simple" size="sm">
                                <Thead><Tr style={tableHeaderRowStyle}>
                                    <Th style={tableHeaderStyle}>Sr No. <VerticalLine /></Th>
                                    <Th style={tableHeaderStyle}>District <VerticalLine /></Th>
                                    <Th style={tableHeaderStyle}>Assembly <VerticalLine /></Th>
                                    <Th style={tableHeaderStyle}>Vehicle No <VerticalLine /></Th>
                                    <Th style={tableHeaderStyle}>Activity <VerticalLine /></Th>
                                    <Th style={tableHeaderStyle}>Edit </Th>
                                </Tr></Thead>
                                <Tbody>
                                    {displayedCameras.length > 0 ? (
                                        displayedCameras.map((camera, index) => (
                                            <Tr key={`${camera.cameraId}-${camera.dateTime}` || index}>
                                                <Td style={tableDataStyle}>{(currentPage - 1) * itemsPerPage + index + 1} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{camera.district || 'N/A'} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{camera.assembly || 'N/A'} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{camera.vehicleNo || 'N/A'} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>{camera.activity || 'N/A'} <VerticalLine /></Td>
                                                <Td style={tableDataStyle}>
                                                    <Button size="sm" colorScheme="blue" onClick={() => handleOpenEditModal(camera)}><FaEdit /></Button>
                                                </Td>
                                            </Tr>
                                        ))
                                    ) : (
                                        <Tr><Td colSpan="6" textAlign="center" style={tableDataStyle} p={5}>No Records found.</Td></Tr>
                                    )}
                                </Tbody>
                            </Table>
                        </div>
                        {totalItemsAfterFilters > itemsPerPage && (
                            <Flex justifyContent="center" mt={4} alignItems="center">
                                <Button onClick={() => handlePageChange(currentPage - 1)} isDisabled={currentPage === 1} mr={2} size="sm">Previous</Button>
                                <Text fontSize="sm">Page {currentPage} of {Math.ceil(totalItemsAfterFilters / itemsPerPage) || 1}</Text>
                                <Button onClick={() => handlePageChange(currentPage + 1)} isDisabled={currentPage * itemsPerPage >= totalItemsAfterFilters} ml={2} size="sm">Next</Button>
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
                            {modalMode === 'add' ? 'Add New Activity' : 'Edit Activity'}
                        </ModalHeader>
                        <ModalCloseButton color="white" />

                        <ModalBody py={4}>
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>

                             
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">District</FormLabel>
                                    {modalMode === 'add' ? (
                                        <Select
                                            size="sm" bg={buttonGradient} color={buttonGradient}
                                            name="district"
                                            value={currentModalData.district}
                                            onChange={handleModalDistrictChange}
                                            placeholder="Select District"
                                        >
                                            {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                                        </Select>
                                    ) : (
                                        <Input size="sm" bg={buttonGradient} color={buttonGradient} value={currentModalData.district} isReadOnly />
                                    )}
                                </FormControl>

                              
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">Assembly</FormLabel>
                                    {modalMode === 'add' ? (
                                        <Select
                                            size="sm" 
                                            name="assembly"
                                            value={currentModalData.assembly}
                                            onChange={handleModalAssemblyChange}
                                            placeholder="Select Assembly"
                                            isDisabled={!currentModalData.district}
                                        >
                                            {modalAssembliesList.map(a => <option key={a} value={a}>{a}</option>)}
                                        </Select>
                                    ) : (
                                        <Input size="sm" bg={buttonGradient} color={buttonGradient} value={currentModalData.assembly} isReadOnly />
                                    )}
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel fontSize="sm" fontWeight="bold">
                                        Vehicle No {isVehicleLoading && <Spinner size="xs" color="blue.300" />}
                                    </FormLabel>
                                    {modalMode === 'add' ? (
                                        <Select
                                            size="sm" bg={buttonGradient} color={buttonGradient}
                                            name="vehicleNo"
                                            value={currentModalData.vehicleNo || ''}
                                            onChange={handleModalVehicleChange}
                                            placeholder={isVehicleLoading ? "Loading..." : "Select Vehicle"}
                                            isDisabled={!currentModalData.assembly || isVehicleLoading}
                                        >
                                            {modalVehicleList.map(v => <option key={v.vehicleNo} value={v.vehicleNo}>{v.vehicleNo}</option>)}
                                        </Select>
                                    ) : (
                                        <Input size="sm" bg={buttonGradient} color={buttonGradient} value={currentModalData.vehicleNo} isReadOnly />
                                    )}
                                </FormControl>

                             
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">Activity</FormLabel>
                                    <Input
                                        size="sm" bg={buttonGradient} color={buttonGradient}
                                        name="activity"
                                        value={currentModalData.activity || ''}
                                        onChange={handleModalInputChange}
                                        placeholder="e.g., Device Disconnected"
                                    />
                                </FormControl>

                            </Grid>
                        </ModalBody>

                        <ModalFooter bg={buttonGradient} color={buttonGradient} borderTop="1px solid white" py={3}>
                            <Button size="sm" colorScheme="blue" mr={3} onClick={modalMode === 'add' ? handleSave : handleUpdate}>
                                {modalMode === 'add' ? 'Add' : 'Update Activity'}
                            </Button>
                            <Button size="sm" onClick={onCloseModal} bg="white" color="black" _hover={{ bg: "gray.200" }}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </div>
    );
};

export default Boxes;
