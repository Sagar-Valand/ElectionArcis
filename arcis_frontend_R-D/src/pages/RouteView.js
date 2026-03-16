import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Flex,
  Select,
  Input,
  Grid,
  Heading,
  Spinner,
  Center,
  useToast,
  useColorModeValue,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Text,
  HStack
} from "@chakra-ui/react";
import { GoogleMap, useJsApiLoader, MarkerF, PolylineF } from "@react-google-maps/api";
import axios from "axios";
import { Link as RouterLink, useLocation } from "react-router-dom";

// ⚠️ WARNING: Delete this key before deploying to production!
const GOOGLE_MAPS_API_KEY = "AIzaSyD2CF3PlGBd0tQhusHwX3ngfPaad0pmJ_Q";

const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const RouteHistoryPage = () => {
  // --- Master Data State ---
  const [allCameras, setAllCameras] = useState([]);

  // --- Dropdown Data States ---
  const [districtsList, setDistrictsList] = useState([]);
  const [assembliesList, setAssembliesList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]); // Populated by your new API

  // --- Selection States ---
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedAssembly, setSelectedAssembly] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Route & Stats States ---
  const [routePath, setRoutePath] = useState([]);
  const [stats, setStats] = useState({ distance: "0.00", start: "-", end: "-" });
  const [loadingMap, setLoadingMap] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const text = useColorModeValue('gray.500', 'gray.400');

  const [map, setMap] = useState(null);
  const toast = useToast();

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  // --- Styling ---
  const headerBg = useColorModeValue("white", "gray.900");
  const buttonGradientColor = useColorModeValue(
    "linear-gradient(93.5deg,#CDDEEB ,  #9CBAD2 94.58%)",
    "linear-gradient(93.5deg, #2A2A2A 0.56%, #030711 50.58%)"
  );
  const location = useLocation();

  // --- 1. INITIAL LOAD: Fetch Master Data for Districts/Assemblies ---
  useEffect(() => {
    const fetchMasterData = async () => {
      const userEmail = localStorage.getItem("email");
      if (!userEmail) return;
      try {
        const response = await axios.post(`${process.env.REACT_APP_URL}/api/camera/getCurrentUserCameras`, {
          email: userEmail
        });
        const data = Array.isArray(response.data) ? response.data : [];
        setAllCameras(data);

        // Extract Districts immediately
        const districts = [...new Set(data.map(c => c.dist_name || c.district).filter(Boolean))];
        setDistrictsList(districts.sort());
      } catch (error) {
        console.error("Error fetching master data:", error);
      }
    };
    fetchMasterData();
  }, []);

  // --- 2. HANDLE DISTRICT CHANGE ---
  const handleDistrictChange = (e) => {
    const dist = e.target.value;
    setSelectedDistrict(dist);

    // Reset downstream filters
    setSelectedAssembly("");
    setSelectedVehicle("");
    setVehiclesList([]);
    setRoutePath([]);

    // Filter Assemblies based on selected District
    if (dist) {
      const filtered = allCameras.filter(c => (c.dist_name || c.district) === dist);
      const assemblies = [...new Set(filtered.map(c => c.accName || c.assembly).filter(Boolean))];
      setAssembliesList(assemblies.sort());
    } else {
      setAssembliesList([]);
    }
  };

  // --- 3. HANDLE ASSEMBLY CHANGE (CALL YOUR NEW API) ---
  const handleAssemblyChange = async (e) => {
    const assemblyName = e.target.value;
    setSelectedAssembly(assemblyName);
    setSelectedVehicle("");
    setRoutePath([]);

    if (!assemblyName) {
      setVehiclesList([]);
      return;
    }

    // We need the 'districtAssemblyCode' to call your API.
    // We find it from the master list using the selected Assembly Name.
    const foundCam = allCameras.find(c => (c.accName || c.assembly) === assemblyName);
    const assemblyCode = foundCam?.districtAssemblyCode || foundCam?.accCode; // Adjust key based on your DB

    if (!assemblyCode) {
      toast({ title: "Error", description: "Could not find Assembly Code for filtering.", status: "error" });
      return;
    }

    setLoadingVehicles(true);
    try {
      // CALLING YOUR API HERE
      const response = await axios.post(`${process.env.REACT_APP_URL}/api/gps/getVehiclesByAssembly`, {
        districtAssemblyCode: assemblyCode
      });

      if (response.data.success) {
        setVehiclesList(response.data.vehicles);
      } else {
        setVehiclesList([]);
        toast({ title: "No Vehicles", description: "No vehicles found for this assembly.", status: "warning" });
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast({ title: "Error", description: "Failed to fetch vehicle list.", status: "error" });
    } finally {
      setLoadingVehicles(false);
    }
  };

  // --- 4. FETCH HISTORY (Triggered by Vehicle or Date change) ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedVehicle || !selectedDate) return;

      setLoadingMap(true);
      setRoutePath([]);
      setStats({ distance: "0.00", start: "-", end: "-" });

      try {
        console.log(`Fetching history for: ${selectedVehicle} on ${selectedDate}`);

        const response = await axios.post(`${process.env.REACT_APP_URL}/api/gps/getHistory`, {
          name: selectedVehicle, // Sending vehicleNo as name
          date: selectedDate
        });

        const historyData = response.data;

        if (!historyData || historyData.length === 0) {
          toast({ title: "No Data", description: "No route history found for this date.", status: "info", duration: 3000 });
          setLoadingMap(false);
          return;
        }

        // Process Path
        const formattedPath = historyData.map(point => ({
          lat: parseFloat(point.latitude),
          lng: parseFloat(point.longitude),
          odometer: parseFloat(point.totalDistance || 0),
          time: point.createdAt || ""
        })).filter(p => !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0 && p.lng !== 0);

        setRoutePath(formattedPath);

        if (formattedPath.length > 1) {
          // Distance Calc
          const startOdo = formattedPath[0].odometer;
          const endOdo = formattedPath[formattedPath.length - 1].odometer;
          const distInKm = (Math.abs(endOdo - startOdo) / 1000).toFixed(2);

          // Time Calc
          const t1 = formattedPath[0].time;
          const t2 = formattedPath[formattedPath.length - 1].time;

          setStats({
            distance: distInKm,
            start: t1.includes(' ') ? t1.split(' ')[1] : t1,
            end: t2.includes(' ') ? t2.split(' ')[1] : t2
          });

          // Fit Map
          if (map) {
            const bounds = new window.google.maps.LatLngBounds();
            formattedPath.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
            map.fitBounds(bounds);
          }
        }

      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No Record Found.", status: "error" });
      } finally {
        setLoadingMap(false);
      }
    };

    fetchHistory();
  }, [selectedVehicle, selectedDate, map]);


  const onLoad = useCallback((mapInstance) => setMap(mapInstance), []);

  if (loadError) return <Center h="100vh">Error loading maps</Center>;
  if (!isLoaded) return <Center h="100vh"><Spinner size="xl" /></Center>;

  return (
    <Flex direction="column" h="100vh">
      {/* --- HEADER --- */}
      <Box borderBottom="1px solid" boxShadow="sm" zIndex="10" >
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontWeight={400} fontSize="26px" mb={2} color={text}>
            Historical View
          </Text>
          <HStack
            border="1px solid #868686"
            borderRadius="12px"      
            spacing={0}
            overflow="hidden"
            height="42px"            
            width="fit-content"     
            bg="white"
          >
            {/* Historical View */}
            <Box
              as={RouterLink}
              to="/RouteView"
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              px={6}                
              fontSize="14px"
              fontWeight="700"
              whiteSpace="nowrap"   
              bg={location.pathname === "/RouteView"
                ? "linear-gradient(180deg, #d4e3ef 0%, #a3bbd1 100%)"
                : "transparent"
              }
              color="#171c26"
              borderRight="1px solid #868686"
              _hover={{ textDecoration: "none" }}
            >
              Historical View
            </Box>

            {/* Map View */}
            <Box
              as={RouterLink}
              to="/Mapview"
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              px={6}
              fontSize="14px"
              fontWeight="700"
              whiteSpace="nowrap"   
              bg={location.pathname === "/Mapview"
                ? "linear-gradient(180deg, #d4e3ef 0%, #a3bbd1 100%)"
                : "transparent"
              }
              color="#171c26"
              _hover={{ textDecoration: "none" }}
            >
              Map View
            </Box>
          </HStack>
        </Flex>

        {/* Filters Grid */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(5, auto)" }} gap={4} alignItems="center">

          {/* 1. District */}
          <Select
            placeholder="Select District"
            size="sm" width="160px"
            bg={buttonGradientColor} borderRadius="8px"
            value={selectedDistrict}
            onChange={handleDistrictChange}
          >
            {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>

          {/* 2. Assembly */}
          <Select
            placeholder="Select Assembly"
            size="sm" width="160px"
            bg={buttonGradientColor} borderRadius="8px"
            value={selectedAssembly}
            onChange={handleAssemblyChange}
            isDisabled={!selectedDistrict}
          >
            {assembliesList.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>

          {/* 3. Vehicle (Fetched from API) */}
          <Select
            placeholder={loadingVehicles ? "Loading..." : "Select Vehicle"}
            size="sm" width="200px"
            bg={buttonGradientColor} borderRadius="8px" fontWeight="bold"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            isDisabled={!selectedAssembly || loadingVehicles}
          >
            {vehiclesList.map(v => (
              // Using vehicleNo as the value
              <option key={v.cameraId} value={v.vehicleNo}>{v.vehicleNo}</option>
            ))}
          </Select>

          {/* 4. Date Picker */}
          <Input
            type="date"
            size="sm" width="150px"
            bg={buttonGradientColor}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          {/* 5. Stats Display */}
          <StatGroup bg="buttonGradientColor" p={1} borderRadius="md" border="1px solid #ccc" minWidth="300px">

            <Stat textAlign="center">
              <StatLabel fontSize="10px" color="blue.500">DISTANCE</StatLabel>
              <StatNumber fontSize="lg" color="blue.600">{stats.distance} <span style={{ fontSize: '12px' }}>km</span></StatNumber>
            </Stat>
          </StatGroup>

        </Grid>
      </Box>

      {/* --- MAP --- */}
      <Box flex="1" position="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={5}
          onLoad={onLoad}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        >
          {routePath.length > 0 && (
            <>
              <PolylineF
                path={routePath}
                options={{
                  strokeColor: "#4285F4",
                  strokeOpacity: 1.0,
                  strokeWeight: 5,
                  geodesic: true,
                  icons: [{
                    icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
                    offset: "100%",
                    repeat: "80px"
                  }]
                }}
              />
              <MarkerF
                position={routePath[0]}
                label={{ text: "START", color: "Black", fontWeight: "bold", fontSize: "10px", className: "map-label-bg" }}
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
              />
              <MarkerF
                position={routePath[routePath.length - 1]}
                label={{ text: "END", color: "Black", fontWeight: "bold", fontSize: "10px", className: "map-label-bg" }}
                icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
              />
            </>
          )}

          {(!selectedVehicle || routePath.length === 0) && !loadingMap && (
            <Box position="absolute" top="10px" left="50%" transform="translateX(-50%)" bg="white" p={2} borderRadius="md" boxShadow="md">
              <Text fontSize="sm" color="gray.600">Select Assembly & Vehicle to view route.</Text>
            </Box>
          )}
        </GoogleMap>
      </Box>
    </Flex>
  );
};

export default RouteHistoryPage;
