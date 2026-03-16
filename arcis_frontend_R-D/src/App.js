import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  matchPath,
  useNavigate,
} from "react-router-dom";
import {
  Box,
  Container,
  Flex,
  Image,
  useBreakpointValue,
  useColorModeValue,
} from "@chakra-ui/react";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import LoginHeader from "./components/LoginHeader";
import Signup from "./pages/Signup";
import Otp from "./pages/otp";
import Verify from "./pages/Verify";
import MobileBottomNav from "./components/MobileBottomNav"; // Import your mobile bottom navigation component
import Cameras from "./pages/Cameras";
import Listview from "./pages/Listview";
import { Scrollbars } from "react-custom-scrollbars-2";
import CameraView from "./pages/CameraView";
import MultipleView from "./pages/MultipleView";
import theme from "./theme";
import Subscription from "./pages/Subscription";
import Events from "./pages/Events";
import Others from "./pages/Others";
import WebSocketComponent from "./components/WebSocketComponent";
import { registerPushNotifications } from "./actions/notification";
import io from "socket.io-client";
import ArcisInfo from "./pages/ArcisInfo";
import { logout, verifytok } from "./actions/userActions";
import Reports from "./pages/Reports";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import DeleteAccount from "./pages/DeleteAccount";
import { UAParser } from "ua-parser-js";
import PrivacyPolicy from "./components/PrivacyPolicy";
import ConnectedonceReport from "./pages/ConnectedonceReport";
import InstallationReport from "./pages/InstallationReport";
import EditableReport from "./pages/EditableReport";
import AnalyticsImage from "./pages/AnalyticsImage";
import AiSetting from "./pages/Ai Setting/AiSetting";
import CameraStatus from "./pages/CameraStatus";
import Heatmap from "./pages/Heatmapp";
import ConnectedMap from "./pages/ConnectedHeatmap";
import Dash from "./pages/Dash";
import DowntimeReport from './pages/DowntimeReport'; 
import CameraReport from "./pages/CameraReport";
import MapView from "./pages/MapView";
import RouteView from "./pages/RouteView";
import Helpdesk from "./pages/Helpdesk";
import Inventory from "./pages/InventoryUpdation";
import Incidence from "./pages/IncidenceMaster";
import TripReport from "./pages/TripReport";
import StopReport from "./pages/StopReport";
import EventReport from "./pages/EventReport";

const socket = io("https://alert.arcisai.io:5082");

function MainApp() {
  const [isSidebarExpanded, setSidebarExpanded] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const isLoginPage =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/forgotPassword" ||
    location.pathname === "/changePassword" ||
    location.pathname === "/otp" ||
    location.pathname === "/deleteAccount" ||
    matchPath("/resetPassword/:token", location.pathname) ||
    matchPath("/verify/:id", location.pathname);

  // Use Chakra UI's `useBreakpointValue` to determine if the screen is small (tab/mobile)
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false });

  const isDeleteAccountPage = location.pathname === "/deleteAccount";

  // Collapse sidebar when the screen is tablet size
  useEffect(() => {
    if (isTablet) {
      setSidebarExpanded(false);
    }
  }, [isTablet]);

  // Access Allow and Deny based on role of user
  const getDeviceType = () => {
    const parser = new UAParser();
    const deviceType = parser.getDevice().type; // 'mobile', 'tablet', or undefined for desktop
    return deviceType || "desktop";
  };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!isLoginPage) {
      if (!isMobile) {
        const deviceType = getDeviceType();
        // if deviceType is 'mobile' or 'tablet', redirect to login page
        if (role === "app") {
          console.log("hello", deviceType);
          if (deviceType === "desktop") {
            window.location.href = "/login";
            logout();
          }
        }
      }
    }
  }, [isMobile, isTablet, isLoginPage]);

  useEffect(() => {
    const email = localStorage.getItem("email");

    if (email) {
      // Register push notifications if email exists in localStorage
      registerPushNotifications();

      // Listen for socket notifications
      socket.on("notification", (data) => {
        setNotifications((prev) => [...prev, data]);
      });
    } else {
      console.warn(
        "Email not found in localStorage. Notifications not initialized."
      );
    }

    // Cleanup to remove socket listener when the component unmounts
    return () => {
      socket.off("notification");
    };
  }, []);

  useEffect(() => {
    const changeHoverText = () => {
      const elements = document.querySelectorAll(
        ".icon-title-tips .icon-title"
      );
      elements.forEach((element) => {
        if (element.textContent === "暂停") {
          element.textContent = "Pause";
        }
        if (element.textContent === "截图") {
          element.textContent = "ScreenSort";
        }
        if (element.textContent === "录制") {
          element.textContent = "Video";
        }
        if (element.textContent === "全屏") {
          element.textContent = "FullScreen";
        }
        if (element.textContent === "退出全屏") {
          element.textContent = "Exit";
        }
        if (element.textContent === "播放") {
          element.textContent = "Play";
        }
        if (element.textContent === "停止录制") {
          element.textContent = "Stop Recording";
        }
        if (element.textContent === "操作盘激活") {
          element.textContent = "PTZ";
        }
        if (element.textContent === "操作盘") {
          element.textContent = "PTZ";
        }
        // 退出全屏
      });
    };

    // Create a MutationObserver to monitor changes in the DOM
    const observer = new MutationObserver(() => {
      changeHoverText();
    });

    // Observe the body for changes in its child elements
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial run to catch elements already in the DOM
    changeHoverText();

    // Cleanup the observer when the component is unmounted
    return () => observer.disconnect();
  }, []);

  return (
    <Container maxW="100vw" p="0" bg={useColorModeValue("white", "#231F1F")}>
      <Scrollbars
        autoHide
        autoHideTimeout={1000}
        autoHideDuration={200}
        style={{ width: "100vw", height: "100vh" }}
        renderThumbVertical={({ style, ...props }) => (
          <div
            {...props}
            style={{
              ...style,
              backgroundColor: theme.colors.custom.secondaryTextColor, // Customize scrollbar color here
              borderRadius: "6px",
              width: "7px",
              zIndex: "9999",
            }}
          />
        )}
      >
        <Box>
          <Flex
            direction="column"
            height="100vh"
           bg={useColorModeValue("white", "black")}
            backgroundSize="cover"
            backgroundPosition="center"
            bgRepeat={"no-repeat"}
            position="relative"
            className="rekhaniboombaam"
          >
            <Image src={useColorModeValue("/images/background_img_light.png","/images/background_img.png")} position="fixed" w={"full"} h="100%" top="50%" left="50%" transform="translate(-50%, -50%)" opacity="0.3" />

          
            <Box zIndex={"999"}>
              {!isMobile &&
                !isDeleteAccountPage &&
                (!isLoginPage ? (
                  <Header
                    isSidebarExpanded={isSidebarExpanded}
                    setSidebarExpanded={setSidebarExpanded}
                  />
                ) : (
                  <LoginHeader />
                ))}
            </Box>
          </Flex>
          <Flex>
            {/* Conditionally render Sidebar for larger screens and MobileBottomNav for smaller screens */}
            {!isLoginPage &&
              (isMobile ? (
                <MobileBottomNav isMobileView={isMobile} /> // Show MobileBottomNav on mobile or tablet view
              ) : (
                <Sidebar
                  isSidebarExpanded={isSidebarExpanded}
                  setSidebarExpanded={setSidebarExpanded}
                /> // Show Sidebar on desktop view
              ))}

            <Flex width="100%">
              <Box
                as="main"
                flex="1"
                position="absolute"
                left={
                  isLoginPage
                    ? "0"
                    : isMobile
                    ? "0"
                    : { md: isSidebarExpanded ? "245px" : "100px" }
                }
                top={
                  isLoginPage
                    ? isMobile
                      ? "-50px"
                      : "0"
                    : isMobile
                    ? "10px"
                    : { md: "90px" }
                }
                width={
                  isLoginPage
                    ? "100%"
                    : isMobile
                    ? "100%"
                    : {
                        lg: isSidebarExpanded
                          ? "calc(100% - 280px)"
                          : "calc(100% - 120px)",
                      }
                }
                transition="left 0.2s, width 0.2s"
                overflowY="auto"
                flexWrap="wrap"
              >
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/changePassword" element={<ChangePassword />} />
                  <Route path="/forgotPassword" element={<ForgotPassword />} />
                  <Route
                    path="/resetPassword/:token"
                    element={<ResetPassword />}
                  />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/verify/:id" element={<Verify />} />
                  <Route path="/otp" element={<Otp />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/cameras" element={<Cameras />} />
                  <Route path="/Listview" element={<Listview />} />
                  <Route path="/camera/:deviceId" element={<CameraView />} />
                  <Route path="/multiple" element={<MultipleView />} />
                  {/* <Route path="/subscription" element={<Subscription />} /> */}
                  {isMobile && <Route path="/others" element={<Others />} />}
                  <Route path="/about" element={<ArcisInfo />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/reports" element={<Reports />} />
                    <Route path="/CameraReport" element={<CameraReport/>} />
                    <Route path="/DowntimeReport" element={<DowntimeReport />} />
                   <Route path="/ConnectedonceReport" element={<ConnectedonceReport />} />
                   <Route path="/InstallationReport" element={<InstallationReport/>} />
                   <Route path="/EditableReport" element={<EditableReport/>} />
                  <Route path="/deleteAccount" element={<DeleteAccount />} />
                   <Route path="/AnalyticsImage" element={<AnalyticsImage/>} />
                    <Route path="/AiSetting" element={<AiSetting/>} />
                    <Route path="/Heatmapp" element={<Heatmap/>}/>
                   <Route path="/connectedheatmap" element={<ConnectedMap/>}/>
                    <Route path="/dash" element={<Dash />} />
                    <Route path="/MapView" element={<MapView/>} />
                    <Route path="/RouteView" element={<RouteView/>} />
                    <Route path="/helpdesk" element={<Helpdesk />} />
                    <Route path="/CameraStatus" element={<CameraStatus/>} />
                    <Route path="/helpdesk" element={<Helpdesk />} />
                     <Route path="/inventoryUpdation" element={<Inventory/>} />
                     <Route path="/incidenceMaster" element={<Incidence/>} />
                     <Route path="/TripReport" element={<TripReport/>} />
                     <Route path="/StopReport" element={<StopReport/>} />
                     <Route path="/EventReport" element={<EventReport/>} />
                  {/* Add more routes here */}
                </Routes>
              </Box>
            </Flex>
          </Flex>
          {/* </Flex> */}
        </Box>
      </Scrollbars>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <WebSocketComponent />

      <MainApp />
    </Router>
  );
}

export default App;
