import axios from "axios";
import { Base64 } from "js-base64";
const baseURL = `${process.env.REACT_APP_BASE_URL}/api/alert`;

const instance = axios.create({
  baseURL: baseURL,
  withCredentials: true,
});

export const getReports = async (deviceId, date) => {
  try {
    const response = await instance.get("/getReports", {
      params: {
        deviceSN: deviceId,
        date,
      },
    });
    console.log("response:", response);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTabluarReport = async (deviceId, date, page, eventType) => {
  try {
    const response = await instance.get("/getTabularReports", {
      params: {
        deviceSN: deviceId,
        date,
        page,
        eventType,
      },
    });
    console.log("responseTabluar :", response);
    return response.data;
  } catch (error) {
    throw error;
  }
};
