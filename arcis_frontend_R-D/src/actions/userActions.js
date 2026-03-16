import axios from 'axios';

const baseURL = `${process.env.REACT_APP_BASE_URL}/api/auth`;

const instance = axios.create({
    baseURL: baseURL,
    withCredentials: true
});

export const login = async (email, password) => {
    try {

        const response = await instance.post('/login', {
            email: email,
            password: password,
        });
        console.log('rekha',response.data);
        return response.data;
    } catch (error) {
        // Handle errors, and include an error message in the response
        return { success: false, data: error.response.data.data };
    }
};

export const signup = async (name, mobile, email, password) => {
    try {
        const response = await instance.post('/register', {
            name: name,
            mobile: mobile,
            email: email,
            password: password,
        });
        return response.data;
    } catch (error) {
        // Handle errors, and include an error message in the response
        console.error('Error:', error.response.data);
        return { success: false, message: error.response.data };
    }
}

export const forgotPassword = async (email) => {
    try {
        const response = await instance.post('/forgotPassword', {
            email: email,
        });
        return response.data;
    } catch (error) {
        // Handle errors, and include an error message in the response
        return { success: false, message: error.response.data.message };
    }
}

export const resetPassword = async (token, password, confirmPassword) => {
    try {
        const response = await instance.post('/resetPassword', {
            token: token,
            password: password,
            confirmPassword: confirmPassword,
        });
        return response.data;
    } catch (error) {
        // Handle errors, and include an error message in the response
        return { success: false, message: error.response.data.message };
    }
}

export const updatePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
        const response = await instance.post('/updatePassword', {
            oldPassword: oldPassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword,
        });
        return response.data;
    } catch (error) {
        // Handle errors, and include an error message in the response
        return { success: false, message: error.response.data.message };
    }
}

// export const verify = async (token) => {
//     try {
//         const response = await instance.get(`/verify/${token}`);
//         return response.data;
//     } catch (error) {
//         // Handle errors, and include an error message in the response
//         return { success: false, message: error.response };
//     }
// }

export const verify = async (email, otp) => {
    // console.log(email, otp);
    try {
        const response = await instance.post(`/verify`, {
            email: email,
            otp: otp,
        });
        return response.data;
    } catch (error) {
        // Handle errors, and include an error message in the response
        return { success: false, message: error.response };
    }
}

export const resendOtp = async (email, otp) => {
    try {
        const response = await instance.post(`/resendOtp`, {
            email: email,
            otp: otp,
        });
        return response.data;
    } catch (error) {
        // Handle errors, and include an error message in the response
        return { success: false, message: error.response };
    }
}

export const sendVerificationForUpdateMobile = async (email, otp) => {
    try {
        const response = await instance.post('/sendVerificationMobile', {
            email: email
        })
        return response.data;
    } catch (error) {
        return { success: false, message: error.response };
    }
}

export const verifyMobileOtpForChangeMobile = async (email, otp) => {
    try {
        const response = await instance.post('/updateMobile', {
            email: email,
            otp: otp,
        });
        return response.data;
    } catch (error) {
        return { success: false, message: error.response };
    }
}

export const logout = async () => {
    try {
        const response = await instance.get("/logout", {});
        localStorage.clear();
        return response.data;
    } catch (error) {
        // Handle errors, and include an error message in the response
        return { success: false, message: error.response.data.message };
    }
};

export const logoutFromAllDevices = async () => {
    try {
        const response = await instance.get('/logout-all', {})
        localStorage.clear();
        return response.data;
    } catch (error) {
        return { success: false, message: error.response.data.message };
    }
}

export const userProfile = async () => {
    try {
        const response = await instance.get("/profile");
        return response.data;
    } catch (error) {
        // Handle errors, and include an error message in the response
        return { success: false, message: error.response.data.message };
    }
};

export const sendOtp = async (email) => {
    try {
        const response = await instance.post('/sendOtp', {
            email: email,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
export const verifyOtp = async (email, otp) => {
    try {
        console.log(email, otp);
        const response = await instance.post('/verifyOtp', {
            email: email,
            otp: otp,
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error(error);
        // Handle errors, and include an error message in the response
        return { success: false, message: error.message || 'An error occurred during login.' };
    }
};

export const verifytok = async () => {
    try {
        const response = await instance.get('/verifytok');
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            return null; // Return null on 401 error
        }
        // console.error('Error verifying token:', error);
        throw error;
    }
}


export const UpdateName = async (name) => {
    try {
        const response = await instance.post("/updateName", {
            name: name,
        });
        return response;
    } catch (error) {
        return error;
    }
};

export const UpdateMobile = async (mobile) => {
    try {
        const response = await instance.post("/updateMobile", {
            email: mobile,
        });
        return response;
    } catch (error) {
        return error;
    }
};
export const deleteAccount = async (email, password) => {
    try {
        const response = await instance.post("/deleteUser", {
            email: email,
            password: password,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};