import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaFilePdf, FaFileCsv, FaDownload, FaTimes } from "react-icons/fa";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody,
         ModalCloseButton, Button, useDisclosure,  Text,  useMediaQuery, Box,} from '@chakra-ui/react';
import { color } from "framer-motion";
import moment from 'moment';

const LayoutContext = createContext({
  setHeaderVisible: () => {},
  setSidebarVisible: () => {},
});

const AnalyticsImage = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firstLoadComplete, setFirstLoadComplete] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedSubEvent, setSelectedSubEvent] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");
  const [modalImage, setModalImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(25);
  const tableRef = useRef(null);
  const email = localStorage.getItem("email");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedZone, setSelectedZone] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [eventCounts, setEventCounts] = useState({});
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [genderCounts, setGenderCounts] = useState({ male: 0, female: 0 });
  const [zoneEventMap, setZoneEventMap] = useState({
    "Parking": { 3: "Fire and Smoke detection", 4: "ANPR", 5: "PPE kit detection", 15: "Smoker detection in no smoking zone", 23: "UnAuthorized Parking", 18: "Vactant Parking Counter", 22: "crowd object detection" },
    "Entry & Ticket area": { 24: "Human activity detection", 3: "Fire and Smoke detection", 15: "Smoker detection in no smoking zone", 5: "PPE kit detection", 19: "Heatmap for crowd", 20: "Head count", 21: "Person counting and Time analyisis in Tickt Kiosk", 22: "crowd object detection", 25: "Person counting and Time analysis in Ticket scanning area" },
    "Paasage Area": { 24: "Human activity detection", 3: "Fire and Smoke detection", 15: "Smoker detection in no smoking zone", 5: "PPE kit detection", 19: "Heatmap for crowd", 20: "Head count", 22: "crowd object detection" },
    "Staff Opertions": { 15: "Smoker detection in no smoking zone", 5: "PPE kit detection", 1: "Facial recognition", 16: "Unauthorized person Detection" },
    "Platform": { 24: "Human activity detection", 3: "Fire and Smoke detection", 17: "Line crossing detection", 15: "Smoker detection in no smoking zone", 5: "PPE kit detection", 19: "Heatmap for crowd", 20: "Head count", 21: "Person counting and Time analyisis in Tickt Kiosk ", 22: "crowd object detection" },
    "Tunnel": { 3: "Fire and Smoke detection", 5: "PPE kit detection", 22: "crowd object detection", 31: "Object detection (Pen,Watch,Mobile)", }
  });

  const [cameraIds, setCameraIds] = useState([]);
  const [isFilterChange, setIsFilterChange] = useState(false);

  // Calculate total event count whenever eventCounts or selectedEvent changes
  useEffect(() => {
    if (selectedEvent) {
      const total = Object.values(eventCounts).reduce((sum, dateEvents) => {
        return sum + (dateEvents[selectedEvent] || 0);
      }, 0);
      setTotalEventCount(total);
    } else {
      setTotalEventCount(0);
    }
  }, [eventCounts, selectedEvent]);

  // Use useCallback to memoize fetchData
  const fetchData = useCallback(async () => {
    if (!firstLoadComplete || isFilterChange) {
      setLoading(true);
    }
    try {
      const formattedDate = selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : moment().format('DD/MM/YYYY');
      const url = `${process.env.REACT_APP_URL || process.env.REACT_APP_LOCAL_URL}/api/Analytics/getanalyticsimages?email=${email}&date=${formattedDate}`;
      const response = await axios.get(url);

      if (response.data && response.data.data) {
        const analyticsData = response.data.data;

        if (Array.isArray(analyticsData)) {
         const validData = analyticsData.filter(
  (item) =>
    item &&
    item.imgurl &&
    item.sendtime &&
    item.cameradid &&
    item.cameraDetails?.deviceId
);
          setData(validData);

          // Update cameraIds efficiently after fetching data
          const newCameraIds = [...new Set(validData.map((item) => item.cameradid))];
          setCameraIds(newCameraIds);

        } else {
          console.warn("API returned data is not an array:", analyticsData);
          setData([]);
          setCameraIds([]); // Reset cameraIds
        }
      } else {
        console.warn("API response is missing 'data' or is malformed:", response.data);
        setData([]);
        setCameraIds([]); // Reset cameraIds
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error fetching data");
    } finally {
      if (!firstLoadComplete) {
        setLoading(false);
        setFirstLoadComplete(true);
      } else if(isFilterChange){
        setLoading(false);
        setIsFilterChange(false);
      }
    }
  }, [email, selectedDate, firstLoadComplete, isFilterChange]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 300000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData]);

   const filterData = useCallback((date, event, camera, zone, subEvent) => {
    // Centralized Timezone Configuration
    const timezone = 'UTC'; // or your preferred timezone
  
    setFilteredData((prevData) => {
      let filtered = data;
  
      // --- 1. Filter by Date ---
      if (date) {
        // Convert the input date to the specified timezone (UTC).
        const targetDate = moment.utc(date);
  
        // Filter based on the target calendar day
        filtered = filtered.filter((item) => {
          if (!item.sendtime) return false; // Skip if sendtime is missing
  
          // Convert item.sendtime to the specified timezone (UTC)
          const itemSendTime = moment.utc(item.sendtime);
  
          // Get the date strings in the specified timezone
          const itemDateString = itemSendTime.format('YYYY-MM-DD');
          const targetDateString = targetDate.format('YYYY-MM-DD');
          //Filter by date only
          return itemDateString === targetDateString;
        });
      }
  
      // --- 2. Filter by Camera ---
      if (camera) {
        filtered = filtered.filter((item) => item.cameradid === camera);
      }
  
      // --- 3. Filter by Zone ---
      if (zone) {
        const zoneEventIds = Object.keys(zoneEventMap[zone]).map(Number);
        filtered = filtered.filter((item) => zoneEventIds.includes(item.an_id));
      }
  
      // --- 4. Filter by Event ---
      if (event) {
        filtered = filtered.filter((item) => item.an_id === parseInt(event, 10));
      }
  
      // --- 5. Filter by Sub-Event (Known/Unknown) ---
      if (event === "1" && subEvent) {
        filtered = filtered.filter((item) => {
          if (subEvent === "known") {
            return item.person_name && item.person_name !== "Unknown";
          } else if (subEvent === "unknown") {
            return !item.person_name || item.person_name === "Unknown";
          }
          return true; // Include all if no subEvent is selected
        });
      }
  
      // Calculate counts by date and event
      const counts = {};
      
      // Initialize latest gender record
      let latestGenderRecord = { 
        timestamp: null, 
        male: 0, 
        female: 0 
      };
      
      filtered.forEach(item => {
        if (!item.sendtime) return;
        
        // Format the date for consistency
        const itemDate = moment.utc(item.sendtime).format('YYYY-MM-DD');
        const eventId = item.an_id.toString();
        
        // Initialize nested objects if they don't exist
        if (!counts[itemDate]) counts[itemDate] = {};
        if (!counts[itemDate][eventId]) counts[itemDate][eventId] = 0;
        
        // Increment the count
        counts[itemDate][eventId]++;
        
        // For analytics ID 30, find the latest record with gender data
        if (item.an_id === 30) {
          const itemTimestamp = moment(item.sendtime);
          // Check if this is the most recent record with gender data
          if (!latestGenderRecord.timestamp || 
              itemTimestamp.isAfter(latestGenderRecord.timestamp)) {
            latestGenderRecord = {
              timestamp: itemTimestamp,
              male: item.male_count ? parseInt(item.male_count, 10) : 0,
              female: item.female_count ? parseInt(item.female_count, 10) : 0
            };
          }
        }
      });
      
      // Set the counts state
      setEventCounts(counts);
      // Set gender counts to latest record values instead of sums
      setGenderCounts({ 
        male: latestGenderRecord.male,
        female: latestGenderRecord.female 
      });
      
      // Update State
      setFilteredData(filtered);
      setCurrentPage(1);
      return filtered;
    });
  }, [data, zoneEventMap]);

  useEffect(() => {
    if (data.length > 0) {
      filterData(selectedDate, selectedEvent, selectedCamera, selectedZone, selectedSubEvent);
    }
  }, [data, selectedDate, selectedEvent, selectedCamera, selectedZone, filterData, selectedSubEvent]);

  useEffect(() => {
    let animationFrameId;

    if (pdfLoading) {
      const animate = () => {
        setRotation((prevRotation) => (prevRotation + 10) % 360);
        animationFrameId = requestAnimationFrame(animate);
      };

      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [pdfLoading]);

         const defaultEventMap = {
  //   1: "Facial recognition",
  // 3: "Fire & Smoke Detection",
  // 5: "PPE kit Violation",
  // 32:"Fall Detection",
  // 35:"Tampered Detection",
  37: "Mobile Detetction",                
  36: "Handwash Violation",
  31: "Object detection (Pen,Watch,Mobile)",
  38: "Gloves Violation",
  3: "Fire & Smoke Detection",
  5: "PPE kit detection",
  28: "EVM Violation",
  40: "Max Person",
  4:"ANPR"
};

const countEmailEventMap = {
  33: "Sack Loading",
  34:"Sack Unloading"
};

 const countEmails = ["count@vmukti.com", "maheshwara@gmail.com", "Lakshmi@gmail.com", "roopa@gmail.com"];
const fullZoneEventMap = {
  default: countEmails.includes(email) ? countEmailEventMap : defaultEventMap
};
const currentEventMap = selectedZone ? zoneEventMap[selectedZone] : fullZoneEventMap.default;

  // const currentEventMap = selectedZone ? zoneEventMap[selectedZone] : {
  //   // 1: "Facial recognition", 2: "Human Detection", 3: "Fire & Smoke Detection", 4: "Automatic Number Plate Recognition",
  //   // 5: "PPE kit Violation", 6: "Object Detection", 7: "Detecting phone usage while driving", 8: "Monitoring head movements",
  //   // 9: "Eyes closing", 10: "Yawning while driving", 11: "No Seatbelt usage", 12: "Identifying conversations with passengers",
  //   // 13: "Emotion detection", 14: "No_Uniform", 15: "Smoking Detection", 16: "Unauthorized Entry detection",
  //   // 17: "Line Crossing", 18: "Vactant Parking", 19: "HeatMap for crowd", 20: "Head count",
  //   // 21: "Person counting and Time analyisis in Tickt Kiosk", 22: "Crowd Object Detection", 23: "UnAuthorized Parking",
  //   // 24: "Human Activity detection", 25: "Person counting and Time analysis in Ticket scanning area"29: "Medical PPE Kit Violation",
  //     5: "PPE kit Violation",32:"Fall Detection",1: "Facial recognition",3: "Fire & Smoke Detection",
  //    //30: "Gender Detection",3: "Fire & Smoke Detection",32:"Fall Detection",
  //    //1: "Facial recognition",//31: "Object detection (Pen,Watch,Mobile)",32:"Fall Detection",
  //  //3: "Fire & Smoke Detection",  22: "Crowd Object Detection",27:"entry/exit", 28:"Pre-stamped",20: "Head count"
  // };

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const day = ("0" + date.getDate()).slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const year = date.getFullYear();
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  }, []);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setIsFilterChange(true);
    fetchData();
  };

  const handleEventChange = (event) => {
    setSelectedEvent(event.target.value);
    setIsFilterChange(true);
    fetchData();
  };

  const handleCameraChange = (event) => {
    setSelectedCamera(event.target.value);
    setIsFilterChange(true);
    fetchData();
  };

  const handleZoneChange = (event) => {
    const zone = event.target.value;
    setSelectedZone(zone);
    setSelectedEvent("");
    setIsFilterChange(true);
    fetchData();
  };

  const handleImageClick = (imgUrl) => {
    setModalImage(imgUrl);
    onOpen();
  };

  const closeModal = () => {
    setModalImage(null);
    onClose();
  };

 const exportToPDF = async () => {
  setPdfLoading(true);
  setRotation(0);
  try {
    //const isCountUser = email?.toLowerCase() === "count@vmukti.com"; 
   // console.log("email: ",isCountUser);
    const countUsers = ["count@vmukti.com", "maheshwara@gmail.com", "Lakshmi@gmail.com", "roopa@gmail.com"];
     const isCountUser = countUsers.includes(email?.toLowerCase());
    const pdf = new jsPDF("l", "mm", "a4");
    pdf.setFontSize(18);
    pdf.text("Analytics Image Data", 15, 15);
    pdf.setFontSize(12);
    // pdf.text(`Generated on: ${new Date().toLocaleString()}`, 15, 25);

    // Add gender counts if analytics ID 30 is selected
    let startY = 30;
    if (selectedEvent === "30") {
      pdf.setFontSize(11);
      pdf.text(`Latest Male Count: ${genderCounts.male}`, 15, 35);
      pdf.text(`Latest Female Count: ${genderCounts.female}`, 80, 35);
      startY = 40;
    }

    
    const headers = [
      isCountUser
        ? ["S.No", "Location", "Camera ID", "Detection Time", "Detection Image", "Analytics Type", "Count"]
        : ["S.No", "Location", "Camera ID", "Detection Time", "Detection Image", "Analytics Type"]
    ];

    const data = [];
    const imagePromises = [];
    const imageSize = 30;

    // Limiting data size for PDF
    const limitedData = filteredData.slice(0, 500);

    for (const [index, item] of limitedData.entries()) {
      if (!item) continue;

      const rowData = [
        (index + 1).toString(),
        item.cameraDetails?.locations?.[0]?.toString() || "N/A",
        item.cameradid?.toString() || "N/A",
        item.sendtime ? moment.utc(item.sendtime).format('DD-MM-YYYY HH:mm:ss'): "N/A",
        "", // Placeholder for the image
        currentEventMap[item.an_id] || "No Event Occurred",
      ];

      // ✅ Append direction & count only for count@vmukti.com
      if (isCountUser) {
        rowData.push(item.ImgCount?.toString() || "0");
      }

      data.push(rowData);

      if (item.imgurl) {
        imagePromises.push(
          toDataURL(item.imgurl)
            .then(({ base64Url }) => {
              if (!base64Url) {
                console.warn(`Could not convert image at index ${index} to base64`);
                return { index, base64Url: null };
              }
              return { index, base64Url };
            })
            .catch((err) => {
              console.error("Image Conversion Error:", err);
              return { index, base64Url: null };
            })
        );
      }
    }

    const images = await Promise.all(imagePromises);

    pdf.autoTable({
      head: headers,
      body: data,
      startY: startY,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 4: { cellWidth: imageSize, minCellHeight: imageSize } },
      headStyles: { fillColor: [200, 214, 229], textColor: [0, 0, 0], fontStyle: "bold" },
      didDrawCell: function (data) {
        if (data.column.index === 4 && data.section === "body") {
          const imageObj = images.find((img) => img.index === data.row.index);
          if (imageObj?.base64Url) {
            try {
              pdf.addImage(
                imageObj.base64Url,
                "JPEG",
                data.cell.x + 2,
                data.cell.y + 2,
                imageSize - 4,
                imageSize - 4
              );
            } catch (imgError) {
              console.error("Error adding image to PDF:", imgError);
            }
          }
        }
      },
    });

    pdf.save("Analytics_Image_Data.pdf");
  } finally {
    setPdfLoading(false);
  }
};

  // Memoize toDataURL to prevent unnecessary re-creation on re-renders
  const toDataURL = useCallback((url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 200;
        const MAX_HEIGHT = 200;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / width;
          height = MAX_HEIGHT;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataURL = canvas.toDataURL("image/jpeg", 0.7);
        resolve({ base64Url: dataURL });
      };
      img.onerror = (error) => {
        reject(error);
      };
      img.src = url;
    });
  }, []);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);

  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

  const getVisiblePageNumbers = () => {
    const visiblePages = [];
    visiblePages.push(1);

    if (currentPage > 3) {
      visiblePages.push("...");
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      visiblePages.push(i);
    }

    if (totalPages - 2 > currentPage) {
      visiblePages.push("...");
    }

    visiblePages.push(totalPages);

    return visiblePages;
  };

  const visiblePages = getVisiblePageNumbers();

  const goToPage = (pageNumber) => {
    if (typeof pageNumber === "number" && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const showCountColumn = (anId, selectedEvent) => {
    return (selectedEvent !== "" && (anId === 20 || anId === 21));
  };

  const showSackCountColumn = (anId, selectedEvent) => {
    return (selectedEvent !== "" && (anId === 33 || anId === 34));
  };

  const showNumberPlateColumn = (selectedEvent) => {
    return selectedEvent === "4"; // ANPR event ID
  };

  const showPersonNameColumn = (selectedEvent) => {
    return selectedEvent === "1"; // Face Recognition event ID
  };

  const showGenderCountColumns = (selectedEvent) => {
    return selectedEvent === "30"; // Gender Detection event ID
  };

  const isZoneSelected = selectedZone !== "";

  const shouldShowPagination = filteredData.length > recordsPerPage;

  return (
    <Box>
      <Modal isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent maxWidth="60%" maxHeight="90%" backgroundColor="#fff"
                      padding="10px" borderRadius="10px" position="relative"
                      boxShadow="">
          <ModalCloseButton />
          <ModalBody display="flex" justifyContent="center" alignItems="center">
            <img
              src={modalImage}
              alt="Enlarged View"
              style={{
                display: "block",
                maxWidth: "118%",
                maxHeight: "80vh",
                margin: "-20px auto",
                borderRadius: "5px"
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Analytics Image Data</h1>
          <div style={styles.headerRight}>
            <button
              onClick={exportToPDF}
              style={{
                ...styles.downloadButton,
                cursor: pdfLoading ? "not-allowed" : "pointer",
              }}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <span
                  style={{
                    display: "inline-block",
                    transform: `rotate(${rotation}deg)`,
                  }}
                >
                  ↻
                </span>
              ) : (
                <>
                  <FaDownload size={20} />
                </>
              )}
            </button>
          </div>
        </div>

        <div style={styles.filters}>
          <div style={styles.filterRow}>
            <label style={{ ...styles.filterLabel, display: "none" }}>
              Zone:
              <select
                value={selectedZone}
                style={styles.filterInputSmall}
              >
                <option value="">All Zones</option>
                {Object.keys(zoneEventMap).map((zoneKey) => (
                  <option key={zoneKey} value={zoneKey}>
                    {zoneKey.charAt(0).toUpperCase() + zoneKey.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label style={styles.filterLabel}>
              Event:
              <select
                value={selectedEvent}
                onChange={handleEventChange}
                style={styles.filterInputSmall}
              >
                <option value="">
                  All Events
                </option>
                {(selectedZone ? Object.entries(zoneEventMap[selectedZone]) : Object.entries(currentEventMap)).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            {selectedEvent === "1" && (
              <label style={{
                        display: "flex",
                        alignItems: "center",
                        marginRight: "10px",
                      }}>
              <strong>Recognition Type:</strong>
              <select
                value={selectedSubEvent}
                onChange={(e) => setSelectedSubEvent(e.target.value)}
                style={styles.filterInput}
              >
                <option value="">All</option>
                <option value="known">Known</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            )}
            <label style={styles.filterLabel}>
              Date:
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                style={styles.filterInputSmall}
              />
            </label>
            <label style={styles.filterLabel}>
              Camera ID:
              <select
                value={selectedCamera}
                onChange={handleCameraChange}
                style={styles.filterInputSmall}
              >
                <option value="">All Cameras</option>
                {cameraIds.map((cameraId) => (
                  <option key={cameraId} value={cameraId}>
                    {cameraId}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Event Count Summary */}
        {selectedEvent && (
          <div style={styles.countSummary}>
            <div style={styles.countHeader}>
              <h3 style={styles.countHeading}>
                Event Count Summary: {currentEventMap[selectedEvent]}
              </h3>
              <div style={styles.totalCount}>
                Total Records: <span style={styles.totalCountNumber}>{totalEventCount}</span>
              </div>
            </div>
            
          {selectedEvent === "30" && (
  <div style={styles.genderCountsContainer}>
    <div style={styles.genderCount}>
      <strong>Latest Male Count:</strong> <span style={styles.maleCountNumber}>{genderCounts.male}</span>
    </div>
    <div style={styles.genderCount}>
      <strong>Latest Female Count:</strong> <span style={styles.femaleCountNumber}>{genderCounts.female}</span>
    </div>
  </div>
)}
            
            <div style={styles.countContainer}>
              {/* {Object.entries(eventCounts)
                .sort((a, b) => moment(a[0]).diff(moment(b[0]))) // Sort dates chronologically
                .map(([date, events]) => (
                  <div key={date} style={styles.countItem}>
                    <strong>{moment(date).format('DD-MM-YYYY')}: </strong>
                    <span style={styles.countNumber}>{events[selectedEvent] || 0}</span>
                  </div>
                ))} */}
              {Object.keys(eventCounts).length === 0 && (
                <div style={styles.noCountData}>No data available for the selected filters</div>
              )}
            </div>
          </div>
        )}

        <div style={styles.tableWrapper}>
          <table
            style={{ ...styles.table, border: "1px solid #ddd" }}
            ref={tableRef}
          >
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeader}>S.No</th>
                <th style={styles.tableHeader}>Location</th>
                <th style={styles.tableHeader}>Camera ID</th>
                <th style={styles.tableHeader}>Detection Time</th>
                <th style={styles.tableHeader}>Detection Image</th>
                <th style={styles.tableHeader}>Analytics Type</th>
                {showNumberPlateColumn(selectedEvent) && (
                  <th style={styles.tableHeader}>Number Plate</th>
                )}
                {showPersonNameColumn(selectedEvent) && (
                  <th style={styles.tableHeader}>Person Name</th>
                )}
                {showCountColumn(parseInt(selectedEvent), selectedEvent) && (
                  <th style={styles.tableHeader}>Count</th>
                )}
                {showGenderCountColumns(selectedEvent) && (
                  <>
                    <th style={styles.tableHeader}>Male Count</th>
                    <th style={styles.tableHeader}>Female Count</th>
                  </>
                )}
                {(email === "count@vmukti.com"|| email === "maheshwara@gmail.com"||email === "Lakshmi@gmail.com"||email === "roopa@gmail.com")  && (
                  <>
                    <th style={styles.tableHeader}>Count</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="100%" style={styles.loading}>Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="100%" style={styles.error}>{error}</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="100%" style={styles.noRecords}>No records found.</td>
                </tr>
              ) : (
                currentRecords.map((item, index) => {
                  const anId = item.an_id;
                  const ImgCount = item.ImgCount;
                  const isOddRow = index % 2 !== 0; // Determine if the row is odd
                  const rowStyle = {
                    backgroundColor: isOddRow ? 'var(--chakra-colors-gray-100)' : 'white',
                  };

                  return (
                    <tr key={item._id} style={{ ...styles.tableRow, ...rowStyle }}>
                      <td style={styles.tableCell}>
                        {indexOfFirstRecord + index + 1}
                      </td>
                      <td style={styles.tableCell}>
  {/* Safely access the first element of the locations array */}
  {item.cameraDetails?.locations?.[0] || "N/A"}
</td>
      
                      <td style={styles.tableCell}>{item.cameradid}</td>
                      <td style={styles.tableCell}>
                        {(item.an_id === 20 || item.an_id === 30)
                          ? moment(item.sendtime)
                            .subtract(5, 'hours')
                            .subtract(30, 'minutes')
                            .add(5, 'hours')
                            .add(30, 'minutes')
                            .format('DD-MM-YYYY HH:mm:ss')
                          : moment(item.sendtime)
                            .subtract(5, 'hours')
                            .subtract(30, 'minutes')
                            .format('DD-MM-YYYY HH:mm:ss')
                        }
                      </td>
                      <td style={styles.tableCell}>
                        <img
                          src={item.imgurl}
                          alt="Analytics"
                          style={styles.image}
                          onClick={() => handleImageClick(item.imgurl)}
                        />
                      </td>
                      <td style={styles.tableCell}>
                        {currentEventMap[anId] || "No Event Occurred"}
                      </td>
                      {/* <td style={styles.tableCell}>
                        {ImgCount || "No Event Occurred"}
                      </td> */}
                      {showNumberPlateColumn(selectedEvent) && (
                        <td style={styles.tableCell}>
                          {item.numberplateid || "N/A"}
                        </td>
                      )}
                      {showPersonNameColumn(selectedEvent) && (
                        <td style={styles.tableCell}>
                          {item.person_name || "N/A"}
                        </td>
                      )}
                      {showCountColumn(anId, selectedEvent) && (
                        <td style={styles.tableCell}>{item.ImgCount}</td>
                      )}
                      {showGenderCountColumns(selectedEvent) && (
                        <>
                          <td style={styles.tableCell}>{item.male_count || 0}</td>
                          <td style={styles.tableCell}>{item.female_count || 0}</td>
                        </>
                      )}
                      {(email === "count@vmukti.com"|| email === "maheshwara@gmail.com"||email === "Lakshmi@gmail.com"||email === "roopa@gmail.com") && (
                          <td style={styles.tableCell}>{item.ImgCount}</td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {shouldShowPagination && filteredData.length > 0 && (
            <div style={styles.pagination}>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationButton,
                  display: currentPage === 1 ? "none" : "inline-block",
                }}
              >
                Prev
              </button>

              {visiblePages.map((page, index) => (
                <React.Fragment key={index}>
                  {typeof page === "number" ? (
                    <button
                      onClick={() => goToPage(page)}
                      style={{
                        ...styles.pageButton,
                        borderRadius: "5px",
                        ...(currentPage === page ? styles.activePageButton : {}),
                        "&:hover": { backgroundColor: "#c8d6e5" },
                      }}
                    >
                      {page}
                    </button>
                  ) : (
                    <span style={styles.ellipsis}>...</span>
                  )}
                </React.Fragment>
              ))}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationButton,
                  display: currentPage === totalPages ? "none" : "inline-block",
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};

const styles = {
  container: { margin: "20px auto", padding: "3px", maxWidth: "200%", fontFamily: "Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  headerRight: { display: "flex", alignItems: "center" },
  heading: { textAlign: "left", fontSize: "25px", fontWeight: "bold" },
  downloadButton: { backgroundColor: "#c8d6e5", color: "black", border: "none", padding: "8px 12px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px", marginLeft: "10px" },
  filters: { marginBottom: "15px" },
  filterRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" },
  filterColumn: { display: "flex", flexDirection: "column", marginRight: "10px" },
  filterLabel: { marginBottom: "5px", fontWeight: "bold", display: "flex", alignItems: "center", marginRight: "10px" },
  filterInput: { padding: "8px", fontSize: "14px", borderRadius: "4px", border: "1px solid #ccc", width: "200px", boxSizing: "border-box" },
  filterInputSmall: { padding: "8px", fontSize: "14px", borderRadius: "4px", border: "1px solid #ccc", width: "120px", boxSizing: "border-box", marginLeft: "5px", color: "Black" },
  smallFilterColumn: { maxWidth: '150px' },
  pdfButton: { backgroundColor: "#c8d6e5", color: "black", border: "none", padding: "8px 12px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px", marginLeft: "10px" },
  csvButton: { backgroundColor: "#c8d6e5", color: "black", border: "none", padding: "8px 12px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "5px", marginLeft: "10px" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeaderRow: { backgroundColor: "rgb(200, 214, 229)", color: "black" },
  tableHeader: { padding: "10px", borderBottom: "2px solid #ddd", textAlign: "center", border: "1px solid #ddd" },
  tableCell: { padding: "10px", textAlign: "center",color:"Black"},
  image: { width: "50px", height: "50px", objectFit: "cover", cursor: "pointer" },
  modal: { position: "fixed", top: "-58%", left: "-11%", right: "-30%", bottom: "-40%", backgroundColor: "rgba(248, 246, 246, 0.98)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "400px" },
  modalContent: { maxWidth: "80%", maxHeight: "80%" },
  modalImage: { width: "100%", height: "auto" },
  closeButton: { position: "fixed", top: "10px", right: "10px", border: "none", color: "Black", fontSize: "20px", cursor: "pointer", zIndex: 1001, padding: "70px 68px", borderRadius: "50%" },
  loading: { textAlign: "center", fontSize: "18px", color: "#007bff" },
  error: { textAlign: "center", fontSize: "18px", color: "red" },
  noRecords: { textAlign: "center", fontSize: "18px", color: "#555" }, // Style for no records message
  pagination: { display: "flex", justifyContent: "center", alignItems: "center", marginTop: "20px", marginBottom: "20px" },
  paginationButton: { margin: "0 5px", padding: "8px 12px", cursor: "pointer", fontSize: "14px", border: "1px solid #c8d6e5", borderRadius: "5px", backgroundColor: "transparent", paddingLeft: "15px", paddingRight: "15px", "&:hover": { backgroundColor: "#c8d6e5" } },
  pageButton: { margin: "0 5px", padding: "8px 12px", cursor: "pointer", fontSize: "14px", border: "1px solid #c8d6e5", backgroundColor: "transparent",minWidth: "36px", textAlign: "center", paddingLeft: "15px", paddingRight: "15px" },
  activePageButton: { backgroundColor: "#9ca4b4", color: "white" },
  ellipsis: { margin: "0 5px", fontSize: "14px" },
  pageNumber: { margin: "0 10px", fontSize: "14px" },
  tableRow: { // Adding this style
    border: 'none' // Removing border lines
  },
         // Add these to your styles object
countSummary: {
  backgroundColor: '#f8f9fa',
  padding: '15px',
  borderRadius: '5px',
  marginBottom: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
},
countHeading: {
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '10px'
},
countContainer: {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '15px'
},
countItem: {
  backgroundColor: 'white',
  padding: '8px 12px',
  borderRadius: '4px',
  border: '1px solid #e1e4e8'
},
noCountData: {
  fontStyle: 'italic',
  color: '#666'
},
// Add these to your styles object
genderCountsContainer: {
  display: "flex",
  justifyContent: "flex-start",
  gap: "20px",
  marginBottom: "15px",
  padding: "10px",
  backgroundColor: "#f0f4f8",
  borderRadius: "5px"
},
genderCount: {
  fontSize: "14px",
  fontWeight: "500"
},
maleCountNumber: {
  color: "#3182ce",
  fontWeight: "bold"
},
femaleCountNumber: {
  color: "#d53f8c",
  fontWeight: "bold"
},
};

export default AnalyticsImage;