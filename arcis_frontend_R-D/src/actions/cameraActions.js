import axios from 'axios';
import { Base64 } from "js-base64";
const baseURL = `${process.env.REACT_APP_BASE_URL}/api/camera`;

const instance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

instance.interceptors.response.use(
  response => {
    // If the response is successful, just return the response
    return response;
  },
  error => {
    // If the response has a status code of 401, redirect to the login page
    if (error.response && error.response.status === 401) {
      window.location.href = '/'; // Replace with your login route
    }
    // Otherwise, reject the promise with the error object
    return Promise.reject(error);
  }
);

let currentCameras = [];

const g_usr = "admin";
const g_pwd = "";
const imgAuth = Base64.encode(`${g_usr}:${g_pwd}`);
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

// --- NEW ACTION ---
/**
 * Fetches districts the user has access to based on their email.
 * @param {string} email - The user's email address.
 * @returns {Promise<object>} - A promise resolving to the API response data.
 */

function filterObjects(array, criteria) {
  return array.filter(obj =>
    Object.entries(criteria).every(([key, value]) => obj[key] === value)
  );
}

export const searchCameras = async(search) => {
  try {
    var searchedCamerasArray = []
    var searchLength = search.length;
    currentCameras.forEach(camera => {
      if (camera.deviceId.slice(0, searchLength) === search){
        searchedCamerasArray.push(camera)
      }
    })
    return searchedCamerasArray
  } catch (error) {
    console.log("Error fetching Searched Cameras: ", error);
    return {
      success: false,
      message: `Failed to Search Camera: ${error}`
    };
  }
}

export const getYourCameras = async(email, district=null, assembly=null) => {
  try {
    currentCameras = (await instance.post("/getCurrentUserCameras", {email : email})).data;
    return currentCameras;
  } catch (error) {
    console.log("Error fetching User's Cameras: ", error);
    return {
      success: false,
      message: `Failed to Fetch Camera's: ${error}`
    };
  }
}

export const getDistrictWiseCameras = async(email, district) => {
  try {
    const filter = { dist_name : district };
    return filterObjects(currentCameras, filter);
  } catch (error) {
    return {
      success: false,
      message: `Failed to Fetch Districtwise Camera's: ${error}`
    };
  }
}

export const getAssemblyWiseCameras = async(email, district, assembly) => {
  try {
    const filter = { 
      dist_name : district,
      accName : assembly
     };
     return filterObjects(currentCameras, filter);
  } catch (error) {
    return {
      success: false,
      message: `Failed to Fetch Assemblywise Camera's: ${error}`
    };
  }
}

export const getdistrictwiseAccess = async (email) => {
  try {
    const response = await instance.get("/getdistrictwiseAccess", { 
      params: { email: email },
    });
    return response.data; 
  } catch (error) {
    console.error("Error fetching user districts:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch districts",
      error: error.response?.data?.error || error.message 
    };
  }
};

export const getCamerasByDistrict = async (districtId) => {
  try {
    const response = await instance.get(`/getCamerasByDistrict/${districtId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cameras by district:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch cameras",
      error: error.response?.data?.error || error.message,
    };
  }
};



export const getDistrictNameByAssemblyName = async (email, dist_name) => {
  try {
    const response = await instance.get("/getDistrictNameByAssemblyName", { 
      params: { 
        email: email, 
        dist_name: dist_name 
      },
    });
    return response.data; 
  } catch (error) {
    console.error("Error fetching user districts:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch districts",
      error: error.response?.data?.error || error.message 
    };
  }
};

export const getCurrentUserCameras = async (email) => {
  try {
    const response = await instance.get("/getCurrentUserCameras", {
      params: { email : email },
    })
    return response.data;
  } catch (error) {
    return { success : false, message : error.response};
  }
}


export const getHelpdeskdata = async (email) => {
  try {
    const response = await instance.get("/getHelpdeskdata", {
      params: { email : email },
    })
    return response.data;
  } catch (error) {
    return { success : false, message : error.response};
  }
}

export const getUserCameraStats = async (email) => {
  try {
      const response = await instance.get("/getUserCameraStats", {
          params: { email: email },
      });
      return response.data;
  } catch (error) {
      // Handle errors, and include an error message in the response
      return { success: false, message: error.response };
  }
};
export const getDistrictCameraStats = async (email,districtCode) => {
  try {
      const response = await instance.get("/districtcamerastats", {
          params: {email,  districtCode },
      });
      console.log("response: ",response);
      
      return response.data;
  } catch (error) {
      return { success: false, message: error.response };
  }
};


export const getAssemblyCameraStats = async (email, dist_name) => {
  try {
    // This correctly constructs the URL: /camera/assembly-stats?email=...&dist_name=...
    const res = await instance.get(`/getAssemblyCameraStats`, {
      params: { email, dist_name }
    });
    return res.data;
  } catch (err) {
    // Log the detailed error from the server if it exists
    console.error("API call to getAssemblyCameraStats failed:", err.response?.data || err.message);
    // Return a standard error format
    return { success: false, message: err.response?.data?.message || "Network error" };
  }
};


export const getAllDistrictStatsForUser = async (email) => {
  try {
    const response = await instance.get("/getAllDistrictStatsForUser", {
      params: { email: email },
    });
    console.log("response:",response);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching all district stats:", error.response);
    return { success: false, message: error.response?.data?.message || "Server error" };
  }
};
export const getAllAssemblyStatsForUser = async (email) => {
  try {
    // Calling the new assembly endpoint
    const response = await instance.get("/getAllAssemblyStatsForUser", {
      params: { email: email },
    });
    
    console.log("Assembly response:", response);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching all assembly stats:", error.response);
    return { 
      success: false, 
      message: error.response?.data?.message || "Server error" 
    };
  }
};

export const addDevice = async (name, deviceId) => {
  try {
    const response = await instance.post("/addDevice", {
      name,
      deviceId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addHelpdesk = async (
  district,
  assembly,
  vehicleNo,
  cameraId,
  activity,
  districtAssemblyCode
) => {
  try {

    const response = await instance.post("/helpdesk", {
      district,
      assembly,
      vehicleNo,
      cameraId,
      activity,
      districtAssemblyCode
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getHelpdeskEntries = async () => {
    const response = await instance.get("/helpdesk");
    return response.data; 
};

export const getSingleCamera = async (deviceId) => {
  const params = {
    deviceId: deviceId,
  };
  try {
    const response = await instance.get(`/getSingleCamera`, {
      params: params,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}


export const getAllCameras = async (
  page,
  itemsPerPage,
  search,
  status, // Receives `sortStatus` from component
  selectedDistrictName,
  selectedAssemblyValue
) => {
  const params = {
    page,
    itemsPerPage: itemsPerPage, // Send as itemsPerPage
    search: search || "",
    sortStatus: status || "",   // Send component's sortStatus as sortStatus
    selectedDistrictName: selectedDistrictName || "",
    selectedAssemblyValue: selectedAssemblyValue || "",
  };

  console.log("FRONTEND ACTION (cameraActions.js): getAllCameras - Sending params to backend:", params);

  try {
    // *** MAKE SURE THIS URL IS CORRECT FOR YOUR BACKEND ROUTE ***
    const response = await instance.get('/getAllCameras', { params }); 
    console.log("FRONTEND ACTION (cameraActions.js): getAllCameras - Success response from backend:", response.data);
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || error.message || "API error in getAllCameras action";
    console.error("FRONTEND ACTION (cameraActions.js): getAllCameras - API call error:", errorMessage, error.response || error);
    return { 
      success: false, message: errorMessage, cameras: [], total: 0, page: 1, totalPages: 1,
      // Add other expected fields if component needs them on error
    };
  }
};


export const getStreamDetails = async (deviceId) => {
  try {
    const response = await instance.get("/getStreamDetails", {
      params: { deviceId },
    });
    return response.data;
  } catch (error) {
    // Handle errors, and include an error message in the response
    return { success: false, message: error.response };
  }
};

export const updateCamera = async (cameraId, name) => {
  try {
    const response = await instance.put(`/updateCamera/${cameraId}`, { name });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeUserCamera = async (deviceId) => {
  try {
    const response = await instance.post(`/removeUserCamera`, {
      deviceId: deviceId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

//  Share Camera API's

export const getSharedEmails = async (deviceId) => {
  try {
    const response = await instance.get(`/getSharedEmails`, {
      params: {
        deviceId: deviceId,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const shareCamera = async (deviceId, shareEmail) => {
  try {
    const response = await instance.post(`/shareCamera`, {
      email: shareEmail,
      deviceId: deviceId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSharedCamera = async () => {
  try {
    const response = await instance.get(`/getSharedCamera`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeSharedCamera = async (email, deviceId) => {
  try {
    const response = await instance.post(`/removeSharedCamera`, {
      email: email,
      deviceId: deviceId,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMultipleCameras = async (page, limit) => {
  try {
    const response = await instance.get("/getMultiplePageCamera", {
      params: {
        page: page,
        limit: limit,
      },
    });
    console.log(response);
    return response;
  } catch (error) {
    return { success: false, message: error.response };
  }
};

export const dashboardData = async () => {
  try {
    const response = await instance.get("/dashboardData");
    return response.data;
  } catch (error) {
    return { success: false, message: error.response };
  }
};

export const getOnlineCameras = async () => {
  try {
    const response = await instance.get("/getOnlineCamera");
    console.log(response);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response };
  }
};

export const setImageUrl = (deviceid) => {
  const localStorageKey = `deviceImage_${deviceid}`;
  const storedImage = JSON.parse(localStorage.getItem(localStorageKey));
  console.log("storedImage:", storedImage);

  const fallbackImage = "https://zeta.arcisai.io/images/CameraCard.png";

  if (storedImage && getCurrentTimestamp() - storedImage.timestamp < 600) {
    return storedImage.imageUrl || fallbackImage;
  } else {
    const imageUrl = `https://${deviceid}.torqueverse.dev/snapshot?r=${Math.random()}&auth=${imgAuth}`;

    // Perform a quick image availability check
    const img = new Image();
    img.src = imageUrl;
    img.onerror = () => {
      localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          imageUrl: fallbackImage,
          timestamp: getCurrentTimestamp(),
        })
      );
    };
    img.onload = () => {
      localStorage.setItem(
        localStorageKey,
        JSON.stringify({
          imageUrl,
          timestamp: getCurrentTimestamp(),
        })
      );
    };

    return imageUrl;
  }
};

export const setImageUrll = async (deviceId) => {
  const fallbackImage = "https://zeta.arcisai.io/images/CameraCard.png";
  const imageUrl = `https://media.arcisai.io/snap/DVR/RTSP-${deviceId}`;
  console.log("imageUrl:", imageUrl);
  const saveImageToDB = async (imageUrl) => {
    try {
      await instance.post('/saveDeviceImage', {
        deviceId,
        imageUrl,
        timestamp: getCurrentTimestamp(),
      });
    } catch (error) {
      console.error('Failed to save image to the database', error);
    }
  };

  // Check image availability
  const img = new Image();
  img.src = imageUrl;
  img.onerror = async () => {
    await saveImageToDB(fallbackImage);
  };
  img.onload = async () => {
    await saveImageToDB(imageUrl);
  };

  return imageUrl;
};
