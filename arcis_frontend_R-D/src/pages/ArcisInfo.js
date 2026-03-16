import React, { useState } from "react";
import {
  Box,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorModeValue,
  VStack,
  Collapse,
  Flex,
  Text,
  Icon,
  useBreakpointValue,
  Image,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons";
import theme from "../theme";
import TermsOfService from "../components/TermsOfService";
import WarrantyPolicy from "../components/WarrantyPolicy";
import PrivacyPolicy from "../components/PrivacyPolicy";
import WarrantyService from "../components/WarrantyService";
import About from "../components/About";
import MobileHeader from "../components/MobileHeader";

const ArcisInfo = () => {
  const [openTab, setOpenTab] = useState(""); // Default open tab for mobile
  const isMobile = useBreakpointValue({ base: true, md: false });
  const activeColor = useColorModeValue("blue.500", "blue.300");
  const inactiveColor = useColorModeValue("gray.600", "gray.400");

  const selectedTab = useColorModeValue(
    "custom.primary",
    "custom.darkModePrimary"
  );

  const tabActiveColor = useColorModeValue(
    "custom.lightModeText",
    "custom.darkModeText"
  );
  const tabInactiveColor = useColorModeValue("#65758B", "custom.tabDarkMode");
  const bgColor = useColorModeValue(
    "custom.tabInactiveLightBg",
    "custom.tabInactiveDarkBg"
  );
  const contentBgColor = useColorModeValue("white", "custom.darModeBg");

  const tabs = [
    { label: "About Us", component: <About /> },
    { label: "Privacy Policy", component: <PrivacyPolicy /> },
    {
      label: "Terms Of Services",
      component: <TermsOfService headingHide={false} />,
    },
    { label: "Warranty Service", component: <WarrantyService /> },
    { label: "Warranty Policy", component: <WarrantyPolicy /> },
  ];

  const toggleTab = (label) => {
    setOpenTab((prev) => (prev === label ? null : label));
  };

  return (
    <Box maxW="1440px" mx="auto" px={4} py={6} mb={{ base: "20", md: "5" }}>
      {/* Mobile View */}
      <MobileHeader title="About ArcisAI" />
      {isMobile ? (
        <VStack spacing={4} mt={{ base: "12", md: "0" }}>
          {tabs.map((tab) => (
            <Box key={tab.label} w="100%">
              {/* Tab Header */}
              <Flex
                justify="space-between"
                align="center"
                cursor="pointer"
                p={3}
                borderRadius="md"
                border="1px solid"
                onClick={() => toggleTab(tab.label)}
              >
                <Text
                  fontWeight={openTab === tab.label ? "bold" : "medium"}
                  color={openTab === tab.label ? activeColor : inactiveColor}
                >
                  {tab.label}
                </Text>
                <Icon
                  as={
                    openTab === tab.label ? ChevronDownIcon : ChevronRightIcon
                  }
                  color={openTab === tab.label ? activeColor : inactiveColor}
                />
              </Flex>

              {/* Tab Content */}
              <Collapse in={openTab === tab.label} animateOpacity>
                <Box mt={3} p={3} bg={contentBgColor} borderRadius="md">
                  {tab.component}
                </Box>
              </Collapse>
            </Box>
          ))}
        </VStack>
      ) : (
        // Desktop View
        <Tabs variant="filled" borderRadius="10px" mx="auto" defaultIndex={0}>
          {/* Restrict the width of the TabList */}
          <Flex justify="center" align="center">
            <Box
              bg={bgColor} // Background color for TabList container
              borderRadius="10px"
              display="inline-block" // Ensure the width adjusts to the content
            >
              <TabList
                justifyContent="center"
                display="flex"
                borderRadius="10px"
              >
                {tabs.map((tab, index) => (
                  <Tab
                    _selected={{
                      bg: selectedTab,
                      color: tabActiveColor,
                      borderRadius: "10px",
                      fontWeight: "bold",
                    }}
                    px={{ base: 0, md: 6 }}
                    py={1.5}
                    borderRadius="full"
                    color={tabInactiveColor}
                    h="full" // Ensure full height for consistency
                    w={{ base: "50%", md: "auto" }} // Full width on mobile
                    key={index}
                  >
                    {tab.label}
                  </Tab>
                ))}
              </TabList>
            </Box>
          </Flex>

          {/* TabPanels without affecting the width */}
          <TabPanels p={0}>
            {tabs.map((tab, index) => (
              <TabPanel key={index} p={0} mt={4}>
                {tab.label === "About Us" && (
                  <Image
                    src="/images/DashboardBanner.png"
                    alt="About Us"
                    mb={6}
                    borderRadius="lg"
                    width={"100%"}
                  />
                )}
                {tab.component}
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
};

export default ArcisInfo;
