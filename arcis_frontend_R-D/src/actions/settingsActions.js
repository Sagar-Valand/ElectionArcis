import axios from 'axios';

const baseURL = `${process.env.REACT_APP_BASE_URL}/api/setting`;

const instance = axios.create({
    baseURL: baseURL,
    withCredentials: true
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

// PTZ Controls
export async function handlePtzAction(step, deviceId) {
    try {
        const response = await instance.post('/ptzSettings',
            {
                step,
                deviceId
            });
        console.log('PTZ Response:', response);
        return response;
    } catch (error) {
        throw error;
    }
}

export const getVideoSettings = async (deviceId) => {
    try {
        const response = await instance.get('/getVideoSettings', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getImageInfo = async (deviceId) => {
    try {
        const response = await instance.get('/getImageInfo', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getAudioInfo = async (deviceId) => {
    try {
        const response = await instance.get('/getAudioInfo', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setAudioInfo = async (deviceId, enabled) => {
    try {
        const response = await instance.post('/setAudioInfo', {
            enabled: enabled,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getSmartQuality = async (deviceId) => {
    try {
        const response = await instance.get('/getSmartQuality', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}
export const setSmartQuality = async (deviceId, smartQuality, dataPlan) => {

    try {
        const numericDataPlan = Number(dataPlan);
        console.log(numericDataPlan, smartQuality, dataPlan);

        const response = await instance.post('/setsmartQuality', {
            smartQuality: smartQuality,
            dataPlan: numericDataPlan
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setImageInfo = async (deviceId, irCutMode) => {
    try {
        const response = await instance.post('/setImageInfo', {
            irCutMode: irCutMode,
        }, {
            params: { deviceId: deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setVideoSettings = async (deviceId, brightness, contrast, saturation, sharpness, hue, mirror, flip) => {
    try {
        const response = await instance.post('/setVideoSettings', {
            brightness,
            contrast,
            saturation,
            sharpness,
            hue,
            mirror,
            flip,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getQuality = async (deviceId) => {
    try {
        const response = await instance.get('/getQuality', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setQualitySettings = async (deviceId, quality) => {
    try {
        const response = await instance.post('/setQuality', {
            quality: quality,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const rebootCamera = async (deviceId) => {
    try {
        const response = await instance.get("/rebootCamera", {
            params: { deviceId: deviceId }
        });
        return response.data
    } catch (error) {
        return { success: false, message: error.response };
    }
}



export const getMotionDetection = async (deviceId) => {
    try {
        const response = await instance.get('/getMotionDetection', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setMotionDetection = async (deviceId, enabled, sensitivityLevel) => {
    try {
        console.log("setMotionDetecssssssssstion", deviceId, enabled, sensitivityLevel);
        const response = await instance.post('/setMotionDetection', {
            enabled: enabled,
            sensitivityLevel: sensitivityLevel,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

/// Human Detection ///

export const getHumanoid = async (deviceId) => {
    try {
        const response = await instance.get('/getHumanoid', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setHumanoid = async (deviceId, enabled, sensitivityLevel, sensitivityStep) => {
    try {
        const response = await instance.post('/setHumanoid', {
            Enabled: enabled,
            Sensitivity: sensitivityLevel,
            sensitivityStep: sensitivityStep,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

/// Face Detection ///

export const getFace = async (deviceId) => {
    try {
        const response = await instance.get('/getFace', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setFace = async (deviceId, enabled, sensitivityLevel, AudioAlert, LightAlert) => {
    try {
        const response = await instance.post('/setFace', {
            Enabled: enabled,
            Sensitivity: sensitivityLevel,
            AudioAlert: AudioAlert,
            LightAlert: LightAlert,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

/// Line Crossing ///

export const getLineCross = async (deviceId) => {
    try {
        const response = await instance.get('/getLineCross', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}
export const setLineCross = async (deviceId, enabled, sensitivityLevel, AudioAlert, LightAlert, detectLine, direction) => {
    try {
        const response = await instance.post('/setLineCross', {
            Enabled: enabled,
            Sensitivity: sensitivityLevel,
            AudioAlert: AudioAlert,
            LightAlert: LightAlert,
            DetectLine: detectLine,
            Direction: direction,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

/// Area Detection ///

export const getAreaDetection = async (deviceId) => {
    try {
        const response = await instance.get('/getAreaDetection', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setAreaDetection = async (deviceId, enabled, sensitivityLevel, AudioAlert, LightAlert, detectArea, areaDirection, Action) => {
    console.log("setAreaDetection", deviceId, enabled, sensitivityLevel, AudioAlert, LightAlert, detectArea, areaDirection, Action);
    try {
        const response = await instance.post('/setAreaDetection', {
            Enabled: enabled,
            Sensitivity: sensitivityLevel,
            AudioAlert: AudioAlert,
            LightAlert: LightAlert,
            DetectArea: detectArea,
            AreaDirection: areaDirection,
            Action: Action,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

/// Customer/Traffic Statistics ///

export const getCustomerStats = async (deviceId) => {
    try {
        const response = await instance.get('/getCustomerStats', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setCustomerStats = async (deviceId, Enabled, DetectLine, Direction) => {
    try {
        const response = await instance.post('/setCustomerStats', {
            Enabled: Enabled,
            DetectLine: DetectLine,
            Direction: Direction,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

/// Missing Detection ///

export const getMissingObjectDetection = async (deviceId) => {
    try {
        const response = await instance.get('/getMissingObjectDetection', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setMissingObjectDetection = async (deviceId, enabled, sensitivityLevel, AudioAlert, LightAlert, DetectRegion, direction) => {
    try {
        const response = await instance.post('/setMissingObjectDetection', {
            Enabled: enabled,
            Sensitivity: sensitivityLevel,
            AudioAlert: AudioAlert,
            LightAlert: LightAlert,
            DetectRegion: DetectRegion,
            MinDuration: direction,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

/// unattended Object Detection ///

export const getUnattendedObjectDetection = async (deviceId) => {
    try {
        const response = await instance.get('/getUnattendedObjectDetection', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setUnattendedObjectDetection = async (deviceId, enabled, sensitivityLevel, AudioAlert, LightAlert, detectUnattended, unattendedDuration) => {
    try {
        const response = await instance.post('/setUnattendedObjectDetection', {
            Enabled: enabled,
            Sensitivity: sensitivityLevel,
            AudioAlert: AudioAlert,
            LightAlert: LightAlert,
            DetectRegion: detectUnattended,
            MinDuration: unattendedDuration,
            // UnattendedDirection: unattendedDirection,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getSDCardData(currentPage, deviceId, selectedDate, TypeFlags2, p2porigin, pageSize) {
    try {

        const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/setting/tfdata`, {
            deviceId,
            currentPage,
            formattedDate: selectedDate,
            TypeFlags2: TypeFlags2,
            pagesize: pageSize,
            p2porigin: p2porigin
        });

        const data = await response.data;
        // console.log(data);
        return data;
    } catch (error) {
        throw error;
    }

}

export const edgeEvent = async (deviceId, currentPage, formattedDate, p2porigin, TypeFlags2, pagesize) => {
    try {
        console.log(currentPage, formattedDate, p2porigin, TypeFlags2, pagesize, deviceId);

        // currentPage, formattedDate, TypeFlags2, p2porigin, pagesize
        // Append deviceId as a query parameter
        const response = await instance.post(`/tfdata`, {
            deviceId,
            currentPage,
            formattedDate,
            TypeFlags2,
            p2porigin,
            pagesize,
        });

        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error(error);
        return { success: false, message: error.response?.data || error.message };
    }
};

// Get Alert Setting

export const getAlertSettings = async (deviceId) => {
    try {
        const response = await instance.get('/getAlertSettings', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setAlertSettings = async (deviceId, bEnable) => {
    try {
        const response = await instance.post('/setAlertSettings', {
            bEnable: bEnable,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

// Human Tracking API

export const getHumanTracking = async (deviceId) => {
    try {
        const response = await instance.get('/getHumanTracking', {
            params: { deviceId },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const setHumanTrackingSettings = async (deviceId, motionTracking, cruiseMode) => {
    try {
        console.log('hituhehe', deviceId, motionTracking, cruiseMode);
        const response = await instance.post('/setHumanTracking', {
            motionTracking: motionTracking,
            cruiseMode: cruiseMode,
        },
            {
                params: { deviceId: deviceId },
            });
        return response.data;
    } catch (error) {
        throw error;
    }
}

// talk to camera

export const talkToCamera = async (formData) => {
    try {
        const response = await instance.post('/talkToCamera', formData);
        return response.data;
    } catch (error) {
        throw error;
    }
}

// Wifi configuration

// export const setWifiConfig = async (wifiName, wifiPassword) => {
//     try {
//         const payload = {
//             wirelessMode: "stationMode",
//             stationMode: {
//                 wirelessStaMode: "802.11bgn mixed",
//                 wirelessApBssId: "123456",
//                 wirelessApEssId: wifiName,
//                 wirelessApPsk: wifiPassword,
//                 wirelessFixedBpsModeEnabled: false
//             }
//         };

//         console.log("Sending payload to IoT device:", payload);

//         const response = await axios.put('http://192.168.1.88/netsdk/Network/Interface/4/Wireless', payload, {
//             headers: {
//                 'Authorization': 'Basic YWRtaW46'
//             },
//             timeout: 5000 // Adjust timeout if needed
//         });

//         console.log("Response from IoT device:", response.data);

//         return response.data;
//     } catch (error) {
//         console.error("Error setting WiFi config:", error.message);
//         if (error.response) {
//             console.error("Response data:", error.response.data);
//         }
//         throw new Error(`Failed to set WiFi config: ${error.message}`);
//     }
// };