import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box as ChakraBox, Box,
    Table, Thead, Tbody, Tr, Th, Td,
    HStack, Button, Select, Input, Flex, Text, Spinner,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    useDisclosure, FormControl, FormLabel, useColorModeValue, RadioGroup, Radio, Grid, Textarea
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

const getIncidenceAPI = async (userEmail) => {
    try {
        const API_URL = `${process.env.REACT_APP_URL}/api/camera/getincidence`;
        const response = await axios.post(API_URL, { email: userEmail });

        if (response.data && response.data.success) {
            const { incidences, vehicles, districts } = response.data;
            const rawData = incidences || [];

            const formattedIncidences = rawData.map(item => ({
                _id: item._id,
                district: item.dist_name || "",
                assembly: item.accName || "",
                vechical: item.vehicleNo || "",
                streamId: item.cameraId || item.streamId || "",
                driverName: item.driverName || "",
                driverContact: item.driverContact || "",
                incidenceDetails: item.incidentDetails || item.incidenceDetails || "",
                incidentDateTime: item.incidentDateTime ? item.incidentDateTime.split('.')[0] : "",
                accode: item.accode || item.districtAssemblyCode || ""
            }));

            return { 
                incidences: formattedIncidences, 
                vehicles: vehicles || [],
                districts: districts || [] 
            };
        }
        return { incidences: [], vehicles: [], districts: [] };
    } catch (error) {
        console.error("Error fetching incidence data:", error);
        return { incidences: [], vehicles: [], districts: [] };
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
const tableContainerStyle = { border: "1px solid #b3b8d6ff", borderRadius: "5px", maxHeight: "calc(100vh - 250px)", overflowY: "auto", overflowX: "auto" };
const VerticalLine = () => (<span style={{ position: "absolute", right: "0", top: "50%", transform: "translateY(-50%)", height: "60%", width: "2px", backgroundColor: "#3F77A5", }} ></span>);

const IncidenceMaster = () => {

    const [allFetchedIncidences, setAllFetchedIncidences] = useState([]);
    const [allDistrictAssemblyPairs, setAllDistrictAssemblyPairs] = useState([]);
    const [displayedIncidences, setDisplayedIncidences] = useState([]);
    const [totalFilteredRecords, setTotalFilteredRecords] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [loading, setLoading] = useState(false);

    const [districtsList, setDistrictsList] = useState([]);
    const [selectedDistrictName, setSelectedDistrictName] = useState("");
    const [assembliesList, setAssembliesList] = useState([]);
    const [selectedAssemblyValue, setSelectedAssemblyValue] = useState("");

    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingAssemblies, setLoadingAssemblies] = useState(false);

    const [modalAssembliesList, setModalAssembliesList] = useState([]);
    const [modalVehiclesList, setModalVehiclesList] = useState([]);
    const [isVehicleLoading, setIsVehicleLoading] = useState(false);

    const { isOpen: isModalOpen, onOpen, onClose } = useDisclosure();
    const [currentModalData, setCurrentModalData] = useState(null);
    const [modalMode, setModalMode] = useState('add');
    const [reportFormat, setReportFormat] = useState("csv");

    const buttonGradientColor = useColorModeValue("linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)", "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)");
    const textColor = useColorModeValue('gray.500', 'gray.400');
    const filterBgColor = useColorModeValue("#bfd8ea", "#2D3748");
    const radioButtonColor = useColorModeValue("#9CBAD2", "#CDDEEB");
    const buttonGradient = useColorModeValue("linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)", "linear-gradient(93.5deg, #4A5568 0.56%, #4A5568 50.58%)");

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
                    const distinctNames = [...new Set(response.matchedDistricts.map(d => d.dist_name))].filter(Boolean);
                    setDistrictsList(distinctNames.sort());
                }
            } catch (err) { console.error(err); } finally { setLoadingDistricts(false); }
        };
        fetchDistricts();
    }, [userEmail]);

    useEffect(() => {
        if (userEmail && selectedDistrictName) {
            const fetchAssemblies = async () => {
                setLoadingAssemblies(true);
                try {
                    const response = await getDistrictNameByAssemblyName(userEmail, selectedDistrictName);
                    if (response.success && Array.isArray(response.districts)) {
                        const names = response.districts.map(a => a.accName || a.name).filter(Boolean);
                        setAssembliesList(names.sort());
                    }
                } catch (error) { console.error(error); } finally { setLoadingAssemblies(false); }
            };
            fetchAssemblies();
        } else { setAssembliesList([]); }
    }, [userEmail, selectedDistrictName]);

    const fetchIncidences = useCallback(async () => {
        if (!userEmail) return;
        setLoading(true);
        try {
            const { incidences, districts } = await getIncidenceAPI(userEmail);
            setAllFetchedIncidences(incidences);
            setAllDistrictAssemblyPairs(districts || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [userEmail]);

    useEffect(() => { fetchIncidences(); }, [userEmail, fetchIncidences]);

    useEffect(() => {
        let filteredData = allFetchedIncidences.filter(i => 
            (!selectedDistrictName || i.district === selectedDistrictName) &&
            (!selectedAssemblyValue || i.assembly === selectedAssemblyValue) &&
            (!searchTerm || JSON.stringify(i).toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setTotalFilteredRecords(filteredData.length);
        setDisplayedIncidences(filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
    }, [allFetchedIncidences, searchTerm, currentPage, itemsPerPage, selectedDistrictName, selectedAssemblyValue]);

    const handlePageChange = (page) => { setCurrentPage(page); };
    const handleDistrictChange = (e) => { setSelectedDistrictName(e.target.value); setSelectedAssemblyValue(""); setCurrentPage(1); };
    const handleAssemblyChange = (e) => { setSelectedAssemblyValue(e.target.value); setCurrentPage(1); };
    const handleSearchTermChange = (e) => { setSearchTerm(e.target.value); setCurrentPage(1); };

    const handleOpenAddModal = () => {
        setModalMode('add');
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setCurrentModalData({
            district: '', assembly: '', vechical: '', streamId: '', incidenceDetails: '',
            driverName: '', driverContact: '', incidentDateTime: now.toISOString().slice(0, 16), accode: ''
        });
        setModalAssembliesList([]);
        setModalVehiclesList([]);
        onOpen();
    };

    const handleOpenEditModal = async (item) => {
        setModalMode('edit');
        let formattedDate = item.incidentDateTime ? new Date(item.incidentDateTime).toISOString().slice(0, 16) : '';
        setCurrentModalData({ ...item, originalCameraId: item.streamId, incidentDateTime: formattedDate });
        if (userEmail && item.district) {
            const response = await getDistrictNameByAssemblyName(userEmail, item.district);
            if (response.success) setModalAssembliesList(response.districts.map(a => a.accName || a.name).sort());
        }
        onOpen();
    };

    const onCloseModal = () => { onClose(); setCurrentModalData(null); };

    const handleModalInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentModalData(prev => ({ ...prev, [name]: value }));
    };

    const handleModalDistrictChange = async (e) => {
        const newDistrict = e.target.value;
        setCurrentModalData(prev => ({ ...prev, district: newDistrict, assembly: '', vechical: '', streamId: '', accode: '' }));
        setModalAssembliesList([]);
        setModalVehiclesList([]);

        if (userEmail && newDistrict) {
            const response = await getDistrictNameByAssemblyName(userEmail, newDistrict);
            if (response.success) setModalAssembliesList(response.districts.map(a => a.accName || a.name).sort());
        }
    };

    const handleModalAssemblyChange = async (e) => {
        const newAssembly = e.target.value;
        
      
        const matchingPair = allDistrictAssemblyPairs.find(
            pair => pair.dist_name === currentModalData.district && (pair.accName === newAssembly || pair.name === newAssembly)
        );

        setCurrentModalData(prev => ({ ...prev, assembly: newAssembly, vechical: '', streamId: '', accode: matchingPair ? matchingPair.districtAssemblyCode : '' }));
        setModalVehiclesList([]);

        if (matchingPair && matchingPair.districtAssemblyCode) {
            setIsVehicleLoading(true);
            const vehicles = await getVehiclesByAssemblyAPI(matchingPair.districtAssemblyCode);
            setModalVehiclesList(vehicles);
            setIsVehicleLoading(false);
        }
    };

    const handleModalVehicleChange = (e) => {
        const selectedVehicleNo = e.target.value;
        const selectedCamera = modalVehiclesList.find(v => v.vehicleNo === selectedVehicleNo);
        setCurrentModalData(prev => ({ 
            ...prev, 
            vechical: selectedVehicleNo, 
            streamId: selectedCamera ? selectedCamera.cameraId : '' 
        }));
    };

    const handleSave = async () => {
        if (!currentModalData) return;
        const { district, assembly, vechical, streamId, incidenceDetails, driverName, driverContact, incidentDateTime, accode } = currentModalData;
        
        if (!district || !assembly || !vechical || !incidenceDetails || !streamId) {
            Swal.fire({ title: 'Validation Error', text: 'Please fill all required fields.', icon: 'warning' });
            return;
        }

        try {
            const payload = {
                dist_name: district, accName: assembly, vehicleNo: vechical, cameraId: streamId,
                driverName, driverContact, incidentDetails: incidenceDetails, 
                incidentDateTime: new Date(incidentDateTime).toISOString(),
                districtAssemblyCode: accode
            };
            const response = await axios.post(`${process.env.REACT_APP_URL}/api/camera/addincidence`, payload);
            if (response.data && response.data.success) {
                Swal.fire({ title: 'Success', text: 'Incidence added.', icon: 'success', timer: 2000, showConfirmButton: false });
                onCloseModal();
                fetchIncidences();
            }
        } catch (error) {
            Swal.fire({ title: 'API Error', text: error.response?.data?.message || error.message, icon: 'error' });
        }
    };

    const handleUpdate = async () => {
        if (!currentModalData) return;
        const payload = {
            originalCameraId: currentModalData.originalCameraId,
            cameraId: currentModalData.streamId,
            vehicleNo: currentModalData.vechical,
            driverName: currentModalData.driverName,
            driverContact: currentModalData.driverContact,
            incidentDetails: currentModalData.incidenceDetails,
            incidentDateTime: new Date(currentModalData.incidentDateTime).toISOString()
        };
        try {
            const response = await axios.put(`${process.env.REACT_APP_URL}/api/camera/updateincidence`, payload);
            if (response.data.success) {
                Swal.fire({ title: 'Success', text: 'Incidence updated.', icon: 'success', timer: 2000, showConfirmButton: false });
                onCloseModal();
                fetchIncidences();
            }
        } catch (error) { Swal.fire({ title: 'Error', text: error.response?.data?.message || error.message, icon: 'error' }); }
    };

    const handleDownloadReport = useCallback(() => {
        let data = allFetchedIncidences.filter(i => (!selectedDistrictName || i.district === selectedDistrictName) && (!selectedAssemblyValue || i.assembly === selectedAssemblyValue));
        if (data.length === 0) { Swal.fire('Info', 'No data to export.', 'info'); return; }
        const exportData = data.map(item => ({ "District": item.district, "Assembly": item.assembly, "Vehicle": item.vechical, "Camera ID": item.streamId, "Driver": item.driverName, "Details": item.incidenceDetails, "Date": new Date(item.incidentDateTime).toLocaleString() }));
        if (reportFormat === "csv") {
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Incidences");
            XLSX.writeFile(wb, "Incidences.xlsx");
        } else {
            const doc = new jsPDF();
            doc.text("Incidence Report", 14, 15);
            doc.autoTable({ head: [["District", "Assembly", "Vehicle", "Driver", "Details", "Date"]], body: data.map(i => [i.district, i.assembly, i.vechical, i.driverName, i.incidenceDetails, new Date(i.incidentDateTime).toLocaleDateString()]), startY: 20, styles: { fontSize: 8 } });
            doc.save("Incidence_Report.pdf");
        }
    }, [reportFormat, allFetchedIncidences, selectedDistrictName, selectedAssemblyValue]);

    const totalPages = Math.ceil(totalFilteredRecords / itemsPerPage);

    return (
        <div style={{ fontFamily: 'Arial, sans-serif' }}>
            <style>{`.swal2-container { z-index: 10000 !important; }`}</style>
            <ChakraBox borderRadius="lg" h={"fit-content"} flexDirection="column" gap={4} display="flex">
                <Text fontWeight={400} fontSize="26px" color={textColor}>Incidence Master</Text>
                <Flex w="full" alignItems="center" gap={4} mb={5} flexWrap="wrap">
                    <Select placeholder={loadingDistricts ? "Loading..." : "Select District"} borderRadius="12px" bg={buttonGradientColor} value={selectedDistrictName} onChange={handleDistrictChange} width="145px" height="34px" fontSize="12px">
                        {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>
                    <Select placeholder={loadingAssemblies ? "Loading..." : "Select Assembly"} bg={buttonGradientColor} borderRadius="12px" value={selectedAssemblyValue} onChange={handleAssemblyChange} width="135px" height="34px" fontSize="12px" isDisabled={!selectedDistrictName}>
                        {assembliesList.map(a => <option key={a} value={a}>{a}</option>)}
                    </Select>
                    <HStack spacing={2}>
                        <Text fontSize="12px" fontWeight="500">Search:</Text>
                        <Input placeholder="Vehicle Number" value={searchTerm} onChange={handleSearchTermChange} width="180px" height="34px" fontSize="12px" borderRadius="12px" bg={filterBgColor}/>
                    </HStack>
                    <Button leftIcon={<FaPlus />} onClick={handleOpenAddModal} height="34px" fontSize="12px" bg={filterBgColor} borderRadius="12px">Add Incidence</Button>
                    <RadioGroup onChange={setReportFormat} value={reportFormat}>
                        <HStack gap={3}><Radio value="csv" fontSize="12px">CSV</Radio><Radio value="pdf" fontSize="12px">PDF</Radio></HStack>
                    </RadioGroup>
                    <Button bg={buttonGradientColor} borderRadius="12px" onClick={handleDownloadReport} width="100px" height="34px" fontSize="12px">Download</Button>
                </Flex>

                {loading ? <Flex justify="center" p={10}><Spinner size="xl" /></Flex> : (
                    <>
                        <div style={tableContainerStyle}>
                            <Table variant="simple" size="sm">
                                <Thead bg={buttonGradientColor}>
                                    <Tr style={tableHeaderRowStyle}>
                                        <Th style={tableHeaderStyle}>Sr No <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>District <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Assembly <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Vehicle No <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Camera ID <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Driver Name <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Driver Contact <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Incidence Details <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>IncidentDateTime <VerticalLine /></Th>
                                        <Th style={tableHeaderStyle}>Action</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {displayedIncidences.map((item, index) => (
                                        <Tr key={index}>
                                            <Td style={tableDataStyle}>{(currentPage - 1) * itemsPerPage + index + 1} <VerticalLine /></Td>
                                            <Td style={tableDataStyle}>{item.district} <VerticalLine /></Td>
                                            <Td style={tableDataStyle}>{item.assembly} <VerticalLine /></Td>
                                            <Td style={tableDataStyle}>{item.vechical} <VerticalLine /></Td>
                                            <Td style={tableDataStyle}>{item.streamId} <VerticalLine /></Td>
                                            <Td style={tableDataStyle}>{item.driverName} <VerticalLine /></Td>
                                            <Td style={tableDataStyle}>{item.driverContact} <VerticalLine /></Td>
                                            <Td style={tableDataStyle}>{item.incidenceDetails?.substring(0, 15)}... <VerticalLine /></Td>
                                            <Td style={tableDataStyle}>{new Date(item.incidentDateTime).toLocaleString()} <VerticalLine /></Td>
                                            <Td style={tableDataStyle}><Button size="xs" colorScheme="teal" onClick={() => handleOpenEditModal(item)}><FaEdit /></Button></Td>
                                        </Tr>
                                    ))}
                                </Tbody>
                            </Table>
                        </div>
                        {totalFilteredRecords > itemsPerPage && (
                            <Flex justifyContent="center" mt={4} alignItems="center">
                                <Button onClick={() => handlePageChange(currentPage - 1)} isDisabled={currentPage === 1} size="sm">Prev</Button>
                                <Text mx={4} fontSize="sm">Page {currentPage} of {totalPages}</Text>
                                <Button onClick={() => handlePageChange(currentPage + 1)} isDisabled={currentPage >= totalPages} size="sm">Next</Button>
                            </Flex>
                        )}
                    </>
                )}
            </ChakraBox>

            {currentModalData && (
                <Modal isOpen={isModalOpen} onClose={onCloseModal} isCentered size="2xl">
                    <ModalOverlay />
                    <ModalContent bg={buttonGradient} color={buttonGradient}>
                        <ModalHeader borderBottom="1px solid white">{modalMode === 'add' ? 'Add Incidence' : 'Update Incidence'}</ModalHeader>
                        <ModalCloseButton color="white" />
                        <ModalBody py={4}>
                            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                <FormControl isRequired><FormLabel fontSize="sm">District</FormLabel><Select size="sm" placeholder="Select District" value={currentModalData.district} onChange={handleModalDistrictChange} isDisabled={modalMode === 'edit'}>{districtsList.map(d => <option key={d} value={d}>{d}</option>)}</Select></FormControl>
                                <FormControl isRequired><FormLabel fontSize="sm">Assembly</FormLabel><Select size="sm" placeholder="Select Assembly" value={currentModalData.assembly} onChange={handleModalAssemblyChange} isDisabled={!currentModalData.district || modalMode === 'edit'}>{modalAssembliesList.map(a => <option key={a} value={a}>{a}</option>)}</Select></FormControl>
                                <FormControl isRequired>
                                    <FormLabel fontSize="sm">Vehicle {isVehicleLoading && <Spinner size="xs" ml={2}/>}</FormLabel>
                                    <Select size="sm" value={currentModalData.vechical} onChange={handleModalVehicleChange} placeholder="Select Vehicle" isDisabled={!currentModalData.assembly || isVehicleLoading}>
                                        {modalVehiclesList.map(v => <option key={v.vehicleNo} value={v.vehicleNo}>{v.vehicleNo}</option>)}
                                    </Select>
                                </FormControl>
                                <FormControl isRequired><FormLabel fontSize="sm">Camera ID</FormLabel><Input size="sm" name="streamId" value={currentModalData.streamId} onChange={handleModalInputChange} /></FormControl>
                                <FormControl><FormLabel fontSize="sm">Driver Name</FormLabel><Input size="sm" name="driverName" value={currentModalData.driverName} onChange={handleModalInputChange} /></FormControl>
                                <FormControl><FormLabel fontSize="sm">Driver Contact</FormLabel><Input size="sm" name="driverContact" value={currentModalData.driverContact} onChange={handleModalInputChange} /></FormControl>
                                <FormControl isRequired><FormLabel fontSize="sm">Date Time</FormLabel><Input size="sm" type="datetime-local" name="incidentDateTime" value={currentModalData.incidentDateTime} onChange={handleModalInputChange} /></FormControl>
                                <FormControl gridColumn="span 2" isRequired><FormLabel fontSize="sm">Details</FormLabel><Textarea size="sm" name="incidenceDetails" value={currentModalData.incidenceDetails} onChange={handleModalInputChange} /></FormControl>
                            </Grid>
                        </ModalBody>
                        <ModalFooter borderTop="1px solid white">
                            <Button size="sm" colorScheme="blue" mr={3} onClick={modalMode === 'add' ? handleSave : handleUpdate}>{modalMode === 'add' ? 'Save' : 'Update'}</Button>
                            <Button size="sm" onClick={onCloseModal}>Cancel</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </div>
    );
};


export default IncidenceMaster;

