import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  Image,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  theme,
  Tr,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import CustomCard from "../components/CustomCard";
import { BsCurrencyDollar } from "react-icons/bs";
import BarChartComponent from "../components/BarChartComponent";
import PieChartComponent from "../components/PieChartComponent";
import CameraStatusChart from "../components/CameraStatusChart";
import { SiOpenai } from "react-icons/si";
import { dashboardData } from "../actions/cameraActions";
import { getUserCameraStats } from "../actions/cameraActions";
import MobileHeader from "../components/MobileHeader";
import { getFutureEvents } from "../actions/aiActions";
import { useNavigate } from "react-router-dom";
import Dropdown from 'react-bootstrap/Dropdown';
import { getdistrictwiseAccess } from "../actions/cameraActions";
import { getDistrictCameraStats } from "../actions/cameraActions";


const Dashboard = () => {
  const barChartOptions = {
    chart: {
      type: "bar",
      height: "100%",
      background: "transparent",
      stacked: false,
      // toolbar: {
      //   show: false
      // }
    },
    colors: [theme.colors.blue[500], theme.colors.green[500]],

    // title is sent separately...

    // title: {
    //   text: 'Monthly Sales Data Comparison',
    //   align: 'left',
    // },
    fill: {
      opacity: 1,
      type: "solid",
    },
    grid: {
      strokeDashArray: 1,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
      ],
    },
    legend: {
      position: "top",
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "30px",
      },
    },
  };
  const barChartTitle = "Monthly Sales Data Comparison";
  const barChartSeries = [
    {
      name: "Sales 2023",
      data: [65, 59, 80, 81, 56, 55, 65],
    },
    // ,
    // {
    //   name: 'Sales 2024',
    //   data: [75, 69, 70, 91, 66, 65],
    // },
  ];

  const pieChartOptions = {
    chart: {
      type: "pie",
      height: "100%",
    },
    // colors: ['#775DD0', '#3F51B5'],
    colors: [theme.colors.blue[500], theme.colors.purple[500]],
    labels: ["green", "purple"],
    title: {
      text: "Votes Distribution",
      align: "left",
    },
    legend: {
      position: "top",
    },
    dataLabels: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
      },
    },
    tooltip: {
      fillSeriesColor: false,
    },
    states: {
      active: {
        filter: {
          type: "none",
        },
      },
      hover: {
        filter: {
          type: "none",
        },
      },
    },
  };

  const pieChartSeries = [12, 19];

  const [totalCameras, setTotalCameras] = useState(0);
  const [onlineCameras, setOnlineCameras] = useState(0);
  const [offlineCameras, setOfflineCameras] = useState(0);
  const [sharedCamera, setSharedCamera] = useState(0);
  const [aiCamera, setAiCamera] = useState(0);
  const [futureEvents, setFutureEvents] = useState([]);
  const [isLiveCountValue, setIsLiveCountValue] = useState(0);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const repsonse = await dashboardData();
      // setTotalCameras(repsonse.data.totalCamera);
      // setOnlineCamera(repsonse.data.totalOnlineCameras);
      // setOfflineCamera(repsonse.data.totalOfflineCameras);
      setSharedCamera(repsonse.data.totalSharedCameras);
      setAiCamera(repsonse.data.totalAiCamera);
      console.log("dashboardData", repsonse);
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchUserCameraStats = async (email) => {
    try {
      if (!email) {
        console.error("User email not found for fetching camera stats.");
        return;
      }
      console.log("Fetching user camera stats for email:", email);
      const response = await getUserCameraStats(email); // Call the action
      console.log("getUserCameraStats response:", response); // Log the raw response

      // --- Adapt to the new response structure ---
      if (response.success && response.cameraStats) { // Check for success and the cameraStats object
        const stats = response.cameraStats; // Use the nested object

        setTotalCameras(stats.totalCameras || 0);
        setOnlineCameras(stats.onlineCameras || 0);
        setOfflineCameras(stats.offlineCameras || 0);

        // Set the isLiveCount state from the new field name
        const liveCount = stats.isLiveCount;
        setIsLiveCountValue(liveCount !== undefined && liveCount !== null ? liveCount : 0); // Set state, handle null/undefined
        console.log("Fetched and set isLiveCount value:", liveCount);

        // You can also access the device ID arrays if needed:
        // const onlineDevices = stats.onlineDeviceIds || [];
        // const offlineDevices = stats.offlineDeviceIds || [];
        // console.log("Online Devices:", onlineDevices);
        // console.log("Offline Devices:", offlineDevices);

      } else {
        console.error("Failed to get user camera stats or data structure incorrect:", response?.message || "Unknown error");
        // Reset state on failure or incorrect structure
        setTotalCameras(0);
        setOnlineCameras(0);
        setOfflineCameras(0);
        setIsLiveCountValue(0); // Reset isLiveCount on failure
      }
      // --- End adaptation ---

    } catch (error) {
      console.error("An unexpected error occurred while fetching camera stats:", error);
      // Reset state on unexpected error
      setTotalCameras(0);
      setOnlineCameras(0);
      setOfflineCameras(0);
      setIsLiveCountValue(0); // Reset isLiveCount on failure
    }
  };
  const handleFetchFuture = async () => {
    try {
      const response = await getFutureEvents();
      console.log("fetchFutureAlerts", response.data);
      setFutureEvents(response.data);
    } catch (error) {
      console.log("error", error);
    }
  };

const handleDistrictSelect = async (district) => {
  setSelectedDistrict(district);

  if (!district) {
    // If 'All Districts' selected, fetch overall user stats
    const email = localStorage.getItem("email");
    fetchUserCameraStats(email); // Re-fetch user stats
    return;
  }

  try {
    const response = await getDistrictCameraStats(district.districtAssemblyCode);
    console.log("District stats response:", response);

    if (response.success && response.data) {
      setTotalCameras(response.data.totalCamera || 0);
      setOnlineCameras(response.data.onlineCamera || 0);
      setOfflineCameras(response.data.offlineCamera || 0);
      setIsLiveCountValue(response.data.isLiveCount || 0);
    } else {
      setTotalCameras(0);
      setOnlineCameras(0);
      setOfflineCameras(0);
      setIsLiveCountValue(0);
    }
  } catch (error) {
    console.error("Error while setting district stats:", error);
    setTotalCameras(0);
    setOnlineCameras(0);
    setOfflineCameras(0);
    setIsLiveCountValue(0);
  }
};


  useEffect(() => {
    const email = localStorage.getItem("email");

    fetchDashboardData();
    fetchUserCameraStats(email);
    handleFetchFuture();
    fetchDistricts(email);
  }, []);

  const fetchDistricts = async (email) => {
    try {
      const response = await getdistrictwiseAccess(email);
      if (response.success) {
        setDistricts(response.matchedDistricts);
      } else {
        console.error("Failed to fetch districts:", response.message);
      }
    } catch (error) {
      console.error("Error while fetching districts:", error);
    }
  };


  const data = [
    {
      cameraName: "Basement gate no. 4",
      deviceId: "41515-5151-515",
      date: "24/10/2024",
    },
  ];

  const bgColor = useColorModeValue("custom.primary", "custom.darkModePrimary");

  const navigate = useNavigate();

  const handleSubscription = () => {
    navigate("/subscription");
  };

  return (
    <Box p={3} maxW="1440px" mx="auto" mb={{ base: "20", md: "5" }}>
      {/* Mobile Header */}
      <MobileHeader title="Dashboard" />
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexDirection={{ base: "column", md: "row" }}
        gap={{ base: 4, md: 6 }}
        mt={{ base: "12", md: "0" }}
        mb={2}
      >
        <Text
          display={{ base: "none", md: "block" }}
          fontSize={{ base: "lg", md: "2xl" }}
          fontWeight="bold"
          textAlign={{ base: "center", md: "left" }}
        >
          Dashboard
        </Text>

      </Box>

      <Grid
        width="100%"
        templateColumns={{
          base: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
          xl: "repeat(4, 1fr)",
        }}
        gap={6}
        margin="0% 0% 2%"
      >
        <CustomCard
          title="Total Cameras"
          value={totalCameras}
          sanand="55539"
          color="black"
          bcolor="white"
          IconComponent={BsCurrencyDollar}
        />
        <CustomCard
          title="Online Cameras"
          value={onlineCameras}
          sanand="55539"
          color="#7BC111"
          bcolor="white"
          IconComponent={BsCurrencyDollar}
        />
        <CustomCard
          title="Offline Cameras"
          value={offlineCameras}
          sanand="55539"
          color="#EF4343"
          bcolor="white"
          IconComponent={BsCurrencyDollar}
        />
        <CustomCard
          title="Connected camera"
          value={isLiveCountValue}
          sanand="55539"
          color="purple.500"
          bcolor="white"
          IconComponent={BsCurrencyDollar}
        />
      </Grid>

      <Grid
        width="100%"
        templateColumns={{
          base: "repeat(1, 1fr)",
          sm: "repeat(1, 1fr)",
          md: "repeat(2, 1fr)",
          lg: "repeat(2, 1fr)",
          xl: "repeat(2, 1fr)",
        }}
        gap={6}
      // padding="0% 2%"
      // height="500px"
      >
        <Box height="100%" display="flex" flexDirection="column">
          <Box flex="1">
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                colorScheme="teal"
                width="250px"   // Set fixed width
                textAlign="left" // Align text inside the button
              >
                {selectedDistrict ? selectedDistrict.dist_name : "Select District"}
              </MenuButton>

              <MenuList width="250px"> {/* Match the width of the button */}
                <MenuItem
                  key="all-districts"
                  onClick={() => handleDistrictSelect(null)}
                >
                  All Districts
                </MenuItem>
                {districts.map((district) => (
                  <MenuItem
                    key={district._id}
                    onClick={() => handleDistrictSelect(district)}
                  >
                    {district.dist_name}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

          </Box>
        </Box>

        <Box height="100%" display="flex" flexDirection="column">
          <Box flex="1">
            {/* <PieChartComponent
              options={pieChartOptions}
              series={pieChartSeries}
            /> */}
            <CameraStatusChart
              onlineCamera={onlineCameras}
              offlineCamera={offlineCameras}
              connectedCamera={isLiveCountValue}
            />

          </Box>
        </Box>
      </Grid>

     

      {/* <Box position="relative" margin="2% 0%" height="auto" width="100%">
        <Image
          src={"./images/DashboardBanner.png"}
          alt="Dashboard"
          width="100%"
        />
      </Box> */}
    </Box>
  );
};

export default Dashboard;