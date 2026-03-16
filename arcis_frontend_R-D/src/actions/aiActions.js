import axios from "axios";

const baseURL = `${process.env.REACT_APP_BASE_URL}/api/ai`;

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

export const getDataByDate = async (
  pageNumber,
  limit,
  date,
  deviceId,
  modelname,
  fromTime,
  toTime
) => {
  try {
    const response = await instance.post("/getDataByDate", {
      pageNumber,
      limit,
      date,
      deviceId,
      modelname,
      from: fromTime,
      to: toTime,
    });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response };
  }
};

export const summarizeVideo = async (query_prompt, sessionId) => {
  try {
    const response = await instance.post("/summarizeVideo", {
      query_prompt,
      sessionId,
    });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response };
  }
};

export const getModelNames = async () => {
  try {
    const response = await instance.get("/getModelNames");
    return response.data;
  } catch (error) {
    return { success: false, message: error.response };
  }
};

export const getFutureEvents = async () => {
  try {
    const response = await instance.get("/getFutureEvents");
    return response.data;
  } catch (error) {
    return { success: false, message: error.response };
  }
};

// get all sessions

export const createSession = async () => {
  try {
    const response = await instance.get("/createSession");
    return response.data;
  } catch (error) {
    return { success: false, message: error.response };
  }
};

export const getAllSession = async () => {
  try {
    const response = await instance.get("/getAllSession");
    return response.data;
  } catch (error) {
    return { success: false, message: error.response };
  }
};

export const getAllChatBySessionId = async (sessionId) => {
  try {
    const response = await instance.get("/getAllChatBySessionId", {
      params: { sessionId },
    });
    return response.data.chat;
  } catch (error) {
    return { success: false, message: error.response };
  }
};

export const getAiCameras = async () => {
  try {
    const response = await instance.get("/getAiCameras");
    return response.data;
  } catch (error) {
    return { success: false, message: error.response };
  }
};