import axios from 'axios';

const baseURL = `${process.env.REACT_APP_BASE_URL}/api/plan`;

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

export const getMasterPlans = async () => {
    try {
        const response = await instance.get('/getMasterPlan');
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getAIPlans = async (plan) => {
    try {
        const response = await instance.get('/getAIPlans', {
            params: {
                plan: plan
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function getFinalPrice(plan, aiFeatureType, aiFeatureName, selectedPlanOptions) {
    console.log("selectedPlanOptions", plan, aiFeatureType, aiFeatureName, selectedPlanOptions)
    try {
        // const token = localStorage.getItem('token');
        const response = await instance.post('/getFinalPrice', {
            plan: plan,
            aiFeatureType: aiFeatureType,
            aiFeatureName: aiFeatureName,
            storagePlan: selectedPlanOptions,
        });
        console.log(response.data)
        return response.data;

    } catch (error) {
        throw error;
    }
}

export async function createOrder(amount, currency, receipt, notes, shippingInfo, orderItems) {
    try {
        const response = await instance.post('/create-order', {
            amount,
            currency,
            receipt,
            notes,
            shippingInfo,
            orderItems,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}