import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Flex,
  Tabs,
  TabList,
  Tab,
  HStack,
  IconButton,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Button,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  background,
  useBreakpointValue,
  Divider,
  MenuDivider,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {
  FaVolumeUp,
  FaVolumeMute,
  FaEllipsisV,
  FaCircle,
  FaSquare,
  FaPlay,
  FaPause,
  FaSearchPlus,
  FaSearchMinus,
} from "react-icons/fa";
import { FiZoomIn, FiZoomOut } from "react-icons/fi";
import { RiForward5Line } from "react-icons/ri";
import { MdControlCamera } from "react-icons/md";
import { BsArrowsFullscreen } from "react-icons/bs";
import { TbCapture } from "react-icons/tb";
import { LuBrainCog } from "react-icons/lu";
import CloudTimeline from "cloud-timeline-component";
import EdgeTimeline from "edge-timeline-component";
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { SlCalender } from "react-icons/sl";
import theme from "../theme";
import AudioRecorder from "./AudioRecorder";

const PlayerControls = ({
  device,
  // play,
  // pause,
  handlePlayPause,
  isPlaying,
  isRecording,
  onRecording,
  onFullscreen,
  // onVolumeToggle,
  // isMuted,
  onScreenshot,
  handleSegmentation,
  url: initialUrl,
  onUrlChange,
  status,
  toggleCameraPTZ,
  zoomIn,
  zoomOut,
  handleVolumeChange,
  toggleMute,
  volume,
  isMuted,
  // handleGoLive,
}) => {
  const [selectedDate, setSelectedDate] = useState(getCurrentISTDate());
  const [url, setUrl] = useState(initialUrl);
  const datePickerRef = useRef(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingModalOpen, setIsSettingModalOpen] = useState(false);

  function getCurrentISTDate() {
    const now = new Date();
    const options = {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const formattedDate = now.toLocaleDateString("en-IN", options);
    return formattedDate.split("/").reverse().join("-"); // Convert DD/MM/YYYY to YYYY-MM-DD
  }
  const handleDateChange = (date) => {
    // Ensure date is a valid Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    if (!isNaN(dateObj.getTime())) {
      // Convert to IST and format date to YYYY-MM-DD
      const options = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      const formattedDate = dateObj.toLocaleDateString("en-IN", options);
      setSelectedDate(formattedDate.split("/").reverse().join("-"));
    } else {
      console.error("Invalid date:", date);
    }
  };
  const updateUrl = (newUrl) => {
    console.log(newUrl);
    setUrl(newUrl);
    if (onUrlChange) {
      onUrlChange(newUrl); // Notify the parent component
    }
  };

  useEffect(() => {
    setUrl(initialUrl); // Update local URL state if initialUrl changes
  }, [initialUrl]);

  const handlePtzControlClick = () => {
    const ptzElement = document.querySelector(".jessibuca-ptz-controls");
    if (ptzElement) {
      ptzElement.classList.toggle("jessibuca-ptz-controls-show");
    }
  };

  // const togglePlayPause = () => {
  //   if (isPlaying) {
  //     pause();
  //   } else {
  //     play();
  //   }
  // };

  const toggleCalendar = () => {
    setCalendarOpen(!calendarOpen);
  };

  const [showTimelIne, setShowTimeLine] = useState("cloud");
  const [isOn, setIsOn] = useState(false);

  // const toggle = () => {
  //   setIsOn(!isOn);
  // };

  const toggle = (tabName) => {
    if (showTimelIne !== tabName) {
      setIsOn(!isOn);
      setShowTimeLine(tabName);
    }
  };
  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate); // Convert to Date
    if (!isNaN(currentDate.getTime())) {
      currentDate.setDate(currentDate.getDate() - 1); // Go to the previous day
      handleDateChange(currentDate); // Update selected date
    } else {
      console.error("Invalid selected date:", selectedDate);
    }
  };

  const handleNextDay = () => {
    const currentDate = new Date(selectedDate); // Convert to Date
    if (!isNaN(currentDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time on today's date
      if (currentDate < today) {
        currentDate.setDate(currentDate.getDate() + 1); // Go to the next day
        handleDateChange(currentDate); // Update selected date
      }
    } else {
      console.error("Invalid selected date:", selectedDate);
    }
  };

  const events = [
    { label: "Motion Detection", shortLabel: "MD", color: "#A689FA" },
    { label: "Human Detection", shortLabel: "HD", color: "#E87BF9" },
    { label: "Face Detection", shortLabel: "FD", color: "#FDDF49" },
    { label: "Linecross Detection", shortLabel: "LD", color: "#E7B008" },
    { label: "Region-Enter Detection", shortLabel: "RE", color: "#FF6262" },
    { label: "Region-Exit Detection", shortLabel: "RX", color: "#FF6262" },
    { label: "Unattended Detection", shortLabel: "UD", color: "#FDBA72" },
    { label: "MissingObject Detection", shortLabel: "MO", color: "#7ED4FC" },
  ];

  const labelType = useBreakpointValue({ base: "shortLabel", md: "label" });
  // const direction = useBreakpointValue({ base: "column", sm: "row" });

  const tabActiveColor = useColorModeValue("#1A1A1A", "#FFFFFF");
  const tabInactiveColor = useColorModeValue("#65758B", "#94A3B8");
  const bgColor = useColorModeValue("#C8D6E5", "#54637A");
  const textColor = useColorModeValue("#1A1A1A", "#FFFFFF");
  const selectedTab = useColorModeValue("#C8D6E5", "#54637A");

  const [totalData, setTotalData] = useState(0);

  const handleTotalDataChange = (data) => {
    setTotalData(data);
  };

  return (
    <>
      <style jsx>
        {`
          .dateInput {
            background-color: unset;
            width: 93px;
          }

          .react-datepicker__day--selected {
            background-color: ${bgColor} !important; /* Green background */
            color: ${textColor} !important; /* White text */
            border-radius: 20%; /* Circular design */
          }
        `}
      </style>

      <Box
        // p={3}
        borderRadius="lg"
        // boxShadow="md"
        width="100%"
        mx="auto"
        pt={2}
        color={useColorModeValue(
          "theme.colors.custom.lightModeText",
          "theme.colors.custom.darkModeText"
        )}
      // bg={useColorModeValue("gray.100", "custom.darkModeBg")}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          alignItems={{ base: "flex-start", md: "center" }}
          justifyContent="space-between"
          flexWrap="wrap"
        >
          {/* First Part (Tabs and Date Navigation) */}
          <Box width={{ base: "100%", md: "auto" }} mb={{ base: 2, md: 0 }}>
            <Flex alignItems="center">
              <Tabs
                variant="filled"
                borderRadius="10px"
                boxShadow="1px 1px 10px 0px rgba(0, 0, 0, 0.13) inset"
                w={{ base: "50%", md: "auto" }}
                size="sm"
              // mr={2}
              >
                <TabList>
                  <Tab
                    _selected={{
                      bg: selectedTab, // Active background color
                      color: tabActiveColor, // Active text color
                      borderRadius: "10px",
                      fontWeight: "bold",
                    }}
                    px={{ base: 1, md: 6 }} // Padding adjustment for mobile and desktop
                    // py={2}
                    borderRadius="full"
                    w={{ base: "50%", md: "auto" }} // Full width on mobile
                    textAlign="center"
                    color={tabInactiveColor}
                    fontSize={{ base: "sm", md: "sm" }}
                    onClick={() => toggle("cloud")}
                  >
                    Cloud
                    {/* <Text
                      fontSize="small"
                      display={{ base: "none", md: "flex" }}
                    >
                      -({totalData})
                    </Text> */}
                  </Tab>
                  {status === "online" && (
                    <Tab
                      _selected={{
                        bg: selectedTab, // Active background color
                        color: tabActiveColor, // Active text color
                        borderRadius: "10px",
                        fontWeight: "bold",
                      }}
                      px={{ base: 1, md: 6 }} // Padding adjustment for mobile and desktop
                      // py={2}
                      borderRadius="full"
                      w={{ base: "50%", md: "auto" }} // Full width on mobile
                      textAlign="center"
                      color={tabInactiveColor}
                      fontSize={{ base: "sm", md: "sm" }}
                      onClick={() => toggle("SD Card")}
                    >
                      SD Card
                    </Tab>
                  )}
                </TabList>
              </Tabs>
              <HStack spacing={"0"}>
                <Tooltip label="Previous Day" aria-label="Previous Day Tooltip">
                  <IconButton
                    icon={<ChevronLeftIcon />}
                    aria-label="Previous Day"
                    variant="unstyled"
                    size="sm"
                    onClick={handlePreviousDay}
                  />
                </Tooltip>
                {/* <Text fontSize="sm" fontWeight="semibold">
                {selectedDate} */}
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="yyyy-MM-dd"
                  className="dateInput"
                  disabled
                  ref={datePickerRef}
                  open={calendarOpen}
                  onClickOutside={() => setCalendarOpen(false)}
                  maxDate={new Date()} // This prevents selecting any future date
                />

                {/* <SlCalender onClick={toggleCalendar} /> */}
                <IconButton
                  icon={<SlCalender />}
                  aria-label="Select Date"
                  variant="transparent"
                  size="sm"
                  onClick={toggleCalendar}
                />
                {/* </Text> */}
                <Tooltip label="Next Day" aria-label="Next Day Tooltip">
                  <IconButton
                    icon={<ChevronRightIcon />}
                    aria-label="Next Day"
                    variant="unstyled"
                    size="sm"
                    onClick={handleNextDay}
                  />
                </Tooltip>
              </HStack>
            </Flex>
          </Box>

          {/* Second Part (Playback Controls and Options) */}
          <Flex
            alignItems="center"
            justifyContent={{ base: "space-between", md: "flex-start" }}
            gap={{ base: 2, md: 4 }}
            w={{ base: "100%", md: "auto" }}
            mb={{ base: 2, md: 0 }}
          >
            <HStack
              spacing={{ base: 2, md: 3 }}
              gap={1}
              mx={{ base: 2, md: 4 }}
              justifyContent={{ base: "space-between", md: "flex-start" }}
              w={{ base: "100%", md: "auto" }}
            >
              {/* Play/Pause and Navigation */}
              {/* <Tooltip
                label="Rewind 5 seconds"
                aria-label="Rewind 5 seconds Tooltip"
              >
                <IconButton
                  icon={<RiForward5Line size="25px" />}
                  aria-label="Backward 5 seconds"
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log("Rewind 5 seconds")}
                />
              </Tooltip> */}
              <Tooltip
                label={isPlaying ? "Pause" : "Play"}
                aria-label="Play/Pause Tooltip"
              >
                <IconButton
                  icon={
                    isPlaying ? (
                      <FaPause size={"16px"} />
                    ) : (
                      <FaPlay size={"16px"} />
                    )
                  }
                  aria-label="Play/Pause"
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                  borderRadius="50%"
                  bg={useColorModeValue(
                    "custom.primary",
                    "custom.darkModePrimary"
                  )}
                  display={{ base: "flex", md: "flex" }}
                />
              </Tooltip>
              {/* <Tooltip
                label="Forward 5 seconds"
                aria-label="Forward 5 seconds Tooltip"
              >
                <IconButton
                  icon={<RiForward5Line size="25px" />}
                  aria-label="Forward 5 seconds"
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log("Forward 5 seconds")}
                />
              </Tooltip> */}
              {/* </HStack> */}

              {/* <HStack
              spacing={{ base: 2, md: 3 }}
              justifyContent={{ base: "flex-start", md: "flex-start" }}
              w={{ base: "100%", md: "auto" }}
            > */}
              {/* <Menu>
                <MenuButton
                  as={Button}
                  size="sm"
                  fontSize="12px"
                  bg={useColorModeValue(
                    "custom.primary",
                    "custom.darkModePrimary"
                  )}
                >
                  1x ▼
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => console.log("Set speed to 0.5x")}>
                    0.5x
                  </MenuItem>
                  <MenuItem onClick={() => console.log("Set speed to 1x")}>
                    1x
                  </MenuItem>
                  <MenuItem onClick={() => console.log("Set speed to 1.5x")}>
                    1.5x
                  </MenuItem>
                  <MenuItem onClick={() => console.log("Set speed to 2x")}>
                    2x
                  </MenuItem>
                </MenuList>
              </Menu> */}
              <Box display={"flex"} gap={2}>
                <Tooltip
                  label={isMuted ? "Unmute" : "Mute"}
                  aria-label="Mute Tooltip"
                >
                  <IconButton
                    icon={
                      isMuted ? (
                        <FaVolumeMute size="16px" />
                      ) : (
                        <FaVolumeUp size="16px" />
                      )
                    }
                    aria-label="Volume"
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                  />
                </Tooltip>
                <Slider
                  value={isMuted ? 0 : volume}
                  min={0}
                  max={100}
                  step={1}
                  size="sm"
                  width="80px"
                  color="custom.primary"
                  onChange={handleVolumeChange}
                  display={"block"}
                >
                  <SliderTrack
                    bg={useColorModeValue(
                      "custom.primary",
                      "custom.darkModePrimary"
                    )}
                  >
                    <SliderFilledTrack
                      bg={useColorModeValue(
                        "custom.primary",
                        "custom.darkModePrimary"
                      )}
                    />
                  </SliderTrack>
                  <Tooltip
                    label={isMuted ? "0" : `${volume}`}
                    aria-label="Volume tooltip"
                    placement="top"
                    hasArrow
                  >
                    <SliderThumb
                      boxSize={3}
                      bg={useColorModeValue(
                        "custom.primary",
                        "custom.darkModePrimary"
                      )}
                    />
                  </Tooltip>
                </Slider>
              </Box>

              {/* Recodring button for Mobile View */}
              <Tooltip
                label={isRecording ? "Stop Recording" : "Start Recording"}
                aria-label="Recording Tooltip"
              >
                <Button
                  onClick={onRecording}
                  size="sm"
                  variant="outline"
                  colorScheme={isRecording ? "green" : "red"}
                  // display="flex"
                  alignItems="center"
                  gap={2}
                  display={{ base: "flex", md: "none" }}
                >
                  <Text fontSize="sm">Rec</Text>
                  {isRecording ? (
                    <FaSquare size="10px" />
                  ) : (
                    <FaCircle size="10px" />
                  )}
                </Button>
              </Tooltip>

              {/* Go Live Button For Mobile View */}
              {/* <Tooltip label="Go Live" aria-label="Go Live Tooltip">
                <Button
                  variant={"outline"}
                  size="sm"
                  colorScheme="red"
                  gap={1}
                  display={{ base: "flex", md: "none" }}
                  onClick={handleGoLive}
                >
                  <FaCircle size="10px" mr={3} />
                  <Text fontSize="sm">Go Live</Text>
                </Button>
              </Tooltip> */}
            </HStack>
          </Flex>

          {/* Third Part  Other Controls */}

          <Flex
            alignItems="center"
            justifyContent={{ base: "space-between", md: "flex-end" }}
            w={{ base: "100%", md: "auto" }}
            gap={{ base: 2, md: 4 }}
          >
            <HStack
              spacing={3}
              mt={{ base: 0, md: 0 }}
              justifyContent={{ base: "space-between", md: "flex-start" }}
              w={{ base: "100%", md: "auto" }}
            >
              {/* <Tooltip
                label={isPlaying ? "Pause" : "Play"}
                aria-label="Play/Pause Tooltip"
              >
                <IconButton
                  icon={isPlaying ? <FaPause /> : <FaPlay />}
                  aria-label="Play/Pause"
                  variant="outline"
                  size="sm"
                  onClick={handlePlayPause}
                  borderRadius="50%"
                  bg={useColorModeValue(
                    "custom.primary",
                    "custom.darkModePrimary"
                  )}
                  display={{ base: "none", md: "none" }}
                />
              </Tooltip> */}

              {/* <Tooltip label="TalkBack" aria-label="TalkBack Tooltip">
                <AudioRecorder
                  key={device.deviceId}
                  deviceId={device.deviceId}
                />
              </Tooltip>

              <Tooltip label="Fullscreen" aria-label="Fullscreen Tooltip">
                <IconButton
                  icon={<BsArrowsFullscreen size="16px" />}
                  aria-label="Fullscreen"
                  variant="ghost"
                  size="sm"
                  onClick={onFullscreen}
                />
              </Tooltip> */}

              {/* <Tooltip label="Screenshot" aria-label="Screenshot Tooltip">
                <IconButton
                  icon={<TbCapture size="22px" />}
                  aria-label="Screenshot"
                  variant="ghost"
                  size="sm"
                  onClick={onScreenshot}
                />
              </Tooltip> */}

              {/*
              <Tooltip label="PTZ Controls" aria-label="PTZ Controls Tooltip">
                <IconButton
                  icon={<MdControlCamera size="22px" />}
                  aria-label="Ptz Controls"
                  variant="ghost"
                  size="sm"
                  onClick={toggleCameraPTZ}
                />
              </Tooltip>
              */}

              <Tooltip label="Fullscreen" aria-label="Fullscreen Tooltip">
                <IconButton
                  icon={<BsArrowsFullscreen size="16px" />}
                  aria-label="Fullscreen"
                  variant="ghost"
                  size="sm"
                  onClick={onFullscreen}
                />
              </Tooltip>

              <Tooltip label="Zoom In" aria-label="Zoom In Tooltip">
                <IconButton
                  icon={<FiZoomIn size="22px" />}
                  aria-label="Ptz Controls"
                  variant="ghost"
                  size="sm"
                  onClick={zoomIn}
                  fontWeight={"1000"}
                />
              </Tooltip>

              <Tooltip label="Zoom Out" aria-label="Zoom Out Tooltip">
                <IconButton
                  icon={<FiZoomOut size="22px" />}
                  aria-label="Ptz Controls"
                  variant="ghost"
                  size="sm"
                  onClick={zoomOut}
                />
              </Tooltip>

              {/* <Tooltip
                label="Image Segmentation"
                aria-label="PTZ Controls Tooltip"
              >
                <IconButton
                  icon={<LuBrainCog size="22px" />}
                  aria-label="Image Segmentation"
                  variant="ghost"
                  size="sm"
                  onClick={handleSegmentation}
                />
              </Tooltip> */}

              {/* <Tooltip
                label={isRecording ? "Stop Recording" : "Start Recording"}
                aria-label="Recording Tooltip"
              >
                <Button
                  onClick={onRecording}
                  size="sm"
                  variant="outline"
                  colorScheme={isRecording ? "green" : "red"}
                  // display="flex"
                  alignItems="center"
                  gap={2}
                  display={{ base: "none", md: "flex" }}
                >
                  <Text fontSize="sm">Rec</Text>
                  {isRecording ? (
                    <FaSquare size="10px" />
                  ) : (
                    <FaCircle size="10px" />
                  )}
                </Button>
              </Tooltip> */}

              {/* <Tooltip label="Go Live" aria-label="Go Live Tooltip">
                <Button
                  variant={"outline"}
                  size="sm"
                  colorScheme="red"
                  gap={1}
                  display={{ base: "none", md: "flex" }}
                  onClick={handleGoLive}
                >
                  <FaCircle size="10px" mr={3} />
                  <Text fontSize="sm">Go Live</Text>
                </Button>
              </Tooltip> */}
              <Tooltip
                label="More Options"
                aria-label="More Options Tooltip"
                hasArrow
              >
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FaEllipsisV size="16px" />}
                    aria-label="More Options"
                    variant="unstyled"
                    size="sm"
                  // _hover={{ bg: "gray.100" }}
                  // _active={{ bg: "gray.200" }}
                  />
                  <MenuList minW="200px" p="2">
                    {/* Disabled Item - Styled to look more subtle */}
                    <MenuItem
                      isDisabled
                      _disabled={{ opacity: 0.6, cursor: "default" }}
                    >
                      <Flex align="center" gap="2" flexWrap={"wrap"}>
                        <Text fontSize="sm">Data Consumed:</Text>
                        <Text fontSize="sm" fontWeight="bold" color="red.500">
                          ({totalData})
                        </Text>
                      </Flex>
                    </MenuItem>

                    <MenuDivider />

                    {/* Actionable Items */}

                    <MenuItem onClick={handleSegmentation}>
                      <IconButton
                        icon={<LuBrainCog size="22px" />}
                        aria-label="Image Segmentation"
                        variant="ghost"
                        size="sm"
                      />
                      <Text ml={2}>Image Segmentation</Text>
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Tooltip>
            </HStack>
          </Flex>
        </Flex>
        {/* Timeline Section - Moved out of the Flex container to take full width */}
        <Box mt={2}>
          {isOn ? (
            <>
              <EdgeTimeline
                date={selectedDate}
                plan={device.plan}
                deviceid={device.deviceId}
                onUrlChange={updateUrl}
                p2porigin={device.p2purl}
              ></EdgeTimeline>

              <HStack
                align="start"
                spacing={4}
                wrap="wrap" // Ensures proper wrapping if needed
                mt={2}
              >
                {events.map((event, index) => (
                  <HStack key={index} spacing={2} align="center">
                    <Box
                      w={3}
                      h={3}
                      borderRadius="full"
                      bg={event.color}
                      display="inline-block"
                    />
                    <Text fontSize="xs">{event[labelType]}</Text>
                  </HStack>
                ))}
              </HStack>
            </>
          ) : (
            <CloudTimeline
              media={"zmedia.arcisai.io"}
              date={selectedDate}
              plan="DVR"
              deviceid={device.deviceId}
              onUrlChange={updateUrl}
              onTotalDataChange={handleTotalDataChange}
            ></CloudTimeline>
          )}
        </Box>
      </Box>
    </>
  );
};

export default PlayerControls;
