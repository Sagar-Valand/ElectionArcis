import { useState, useEffect } from "react";
import { Flex, Box, Text, Image, useColorModeValue } from "@chakra-ui/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MdOutlineSpaceDashboard } from "react-icons/md";
import { TbDeviceCctv } from "react-icons/tb";
import { RiCheckboxMultipleBlankLine } from "react-icons/ri";
import { FaBars } from "react-icons/fa6";
import theme from "../theme";

const navItems = [
  { icon: <MdOutlineSpaceDashboard />, label: "Dashboard", path: "/dash" },
  { icon: <TbDeviceCctv />, label: "Camera Status", path: "/CameraStatus" },
  {
    icon: <RiCheckboxMultipleBlankLine />,
    label: "MultiScreen",
    path: "/multiple",
  },
  { icon: <FaBars />, label: "Other", path: "/others" },
];

function MobileBottomNav({ isMobileView }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Dashboard");

  useEffect(() => {
    if (isMobileView) {
      const currentPath = location.pathname;
      const matchingTab = navItems.find((item) => item.path === currentPath);
      if (matchingTab) {
        setActiveTab(matchingTab.label);
      } else if (!activeTab) {
        // Optionally navigate to /dashboard if no match and no initial tab is set
        setActiveTab("Dashboard");
        navigate("/dashboard", { replace: true });
      }
    }
  }, [location.pathname, isMobileView, navigate, activeTab]);

  const handleTabClick = (label, isLogo) => {
    setActiveTab(label);
  };

  const activeColor = useColorModeValue(
    theme.colors.custom.selectedBottomNavText,
    theme.colors.custom.darkModeText
  );
  const inactiveColor = useColorModeValue(
    theme.colors.custom.bottomNavText,
    theme.colors.custom.tabDarkMode
  );

  return (
    <Flex
      as="nav"
      justifyContent="space-around"
      alignItems="center"
      position="fixed"
      bottom="0"
      w="100%"
      h="74px"
      // bg="white"
      boxShadow="0px -1px 10px rgba(0, 0, 0, 0.1)"
      p={2}
      zIndex="1000"
      borderRadius="16px 16px"
      bg={useColorModeValue("white", "#231F1F")}
    >
      {navItems.map((item, index) => {
        const isActive = activeTab === item.label;

        if (item.isLogo) {
          return (
            <Box
              key={index}
              as="button"
              textAlign="center"
              borderRadius="50%"
              p={2}
              // transform="translateY(-25%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onClick={() => handleTabClick(item.label, item.isLogo)}
              cursor="default"
            >
              <Image
                src={item.iconSrc}
                alt={`${item.label} Icon`}
                boxSize="50px"
                filter="none"
              />
            </Box>
          );
        }

        return (
          <Link to={item.path} key={index} style={{ flex: "1" }}>
            <Box
              textAlign="center"
              borderRadius="8px"
              transition="background 0.2s ease, color 0.2s ease"
              p={1}
              display="flex"
              justifyContent="center"
              flexDirection="column"
              alignItems="center"
              onClick={() => handleTabClick(item.label, item.isLogo)}
            >
              {item.iconSrc ? (
                <Image
                  src={item.iconSrc}
                  alt={`${item.label} Icon`}
                  boxSize="24px"
                />
              ) : (
                <Box
                  fontSize="30px"
                  color={isActive ? activeColor : inactiveColor}
                >
                  {item.icon}
                </Box>
              )}
              <Text
                fontSize="10px"
                color={isActive ? activeColor : inactiveColor}
              >
                {item.label}
              </Text>
            </Box>
          </Link>
        );
      })}
    </Flex>
  );
}

export default MobileBottomNav;
