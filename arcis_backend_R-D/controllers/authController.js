const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const sendEmail = require("../middleware/sendEmail");
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
const axios = require("axios");
const cameraModel = require("../models/cameraModel");
const UserActivity = require("../models/Useractivites")
const cron = require("node-cron");

const otpStorage = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Register User
exports.registerUser = async (req, res) => {
  const { name, email, mobile, password } = req.body;

  try {
    const regex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!regex.test(password)) {
      return res.status(400).json({
        success: false,
        data: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
      });
    }

    const user = await User.create({ name, email, mobile, password });

    const otp = generateOTP();

    otpStorage[email] = otp;
    await sendEmail({
      email: user.email,
      subject: "Your ArcisAI Verification Code",
      message: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                  }
                  .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                  }
                  h1 {
                    color: #333333;
                    font-size: 24px;
                    margin-bottom: 20px;
                  }
                  p {
                    color: #666666;
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 10px;
                  }
                  .otp-box {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #f0f0f0;
                    border-radius: 5px;
                    font-size: 20px;
                    font-weight: bold;
                    letter-spacing: 2px;
                    margin: 20px 0;
                  }
                  .btn {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                    transition: background-color 0.3s ease;
                    margin-top: 10px;
                  }
                  .btn:hover {
                    background-color: #0056b3;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Welcome to ArcisAI</h1>
                  <p>Dear ${user.name},</p>
                  <p>Your verification code for ArcisAI is:</p>
                  <div class="otp-box">${otp}</div>
                  <p>If you did not request this email, please ignore it.</p>
                  <p>Best regards,<br>The ArcisAI Team</p>
                </div>
              </body>
            </html>
            `,
    });

    res.status(201).json({
      success: true,
      data: "User registered successfully, please check your email for verification",
    });
  } catch (error) {
    if (error.code === 11000 && error.keyValue.email) {
      return res.status(400).json({
        success: false,
        data: "Email already exists",
      });
    }
    res.status(500).json({ success: false, data: error.message });
  }
};

// resend otp email
exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        data: "User not found",
      });
    }
    const otp = generateOTP();
    otpStorage[email] = otp;
    await sendEmail({
      email: user.email,
      subject: "Your ArcisAI Verification Code",
      message: `
            <!DOCTYPE html>
            <html>
              <head>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                  }
                  .container {
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 5px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                  }
                  h1 {
                    color: #333333;
                    font-size: 24px;
                    margin-bottom: 20px;
                  }
                  p {
                    color: #666666;
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 10px;
                  }
                  .otp-box {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #f0f0f0;
                    border-radius: 5px;
                    font-size: 20px;
                    font-weight: bold;
                    letter-spacing: 2px;
                    margin: 20px 0;
                  }
                  .btn {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 5px;
                    transition: background-color 0.3s ease;
                    margin-top: 10px;
                  }
                  .btn:hover {
                    background-color: #0056b3;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <h1>Welcome to ArcisAI</h1>
                  <p>Dear ${user.name},</p>
                  <p>Your verification code for ArcisAI is:</p>
                  <div class="otp-box">${otp}</div>
                  <p>If you did not request this email, please ignore it.</p>
                  <p>Best regards,<br>The ArcisAI Team</p>
                </div>
              </body>
            </html>
            `,
    });

    return res.status(200).json({
      success: true,
      data: "OTP resent successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, data: error.message });
  }
};

// Verify User
exports.verifyUser = async (req, res) => {
  const { otp, email } = req.body;
  console.log(otp, email);
  try {
    if (!otpStorage[email]) {
      return res.status(400).json({
        success: false,
        data: "Invalid or expired OTP",
      });
    }

    if (otpStorage[email] !== Math.floor(otp)) {
      return res.status(400).json({
        success: false,
        data: "Invalid OTP",
      });
    }

    delete otpStorage[email];
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        data: "User not found",
      });
    }
    if (user.Isverified === 1) {
      return res.status(400).json({
        success: false,
        data: "User already verified",
      });
    }
    await User.findByIdAndUpdate(user._id, { Isverified: 1 });

    res.status(200).json({
      success: true,
      data: "User verified successfully",
    });
  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(400)
        .json({
          success: false,
          data: "Token has expired, please request a new one",
        });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(400)
        .json({ success: false, data: "Invalid or malformed token" });
    } else {
      // General error handler for other exceptions
      return res
        .status(500)
        .json({ success: false, data: "Internal server error" });
    }
  }
};

const getClientIp = async (req) => {
 
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

 
  if (ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.0.0.1')) {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      console.log(response);
      
      return response.data.ip;
    } catch (error) {
      return ip; 
    }
  }
  

  if (ip.includes('::ffff:')) {
    ip = ip.split(':').pop();
  }
  
  return ip;
};

// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, data: "Please provide email and password" });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email }).select("+password");

    // Check if the user exists
    if (!user) {
      return res.status(400).json({ success: false, data: "User not found" });
    }

    const getISTTime = () => new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));

    const trackActivity = async (userId,userEmail) => {
      if (!userId) return;
      

      await UserActivity.create({
        // userId: userId,
        email: userEmail,
        active: 1, 
        ipaddress: await getClientIp(req),
        loginTime: getISTTime(),   
        logoutTime: null
      });
    };

   
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
        sameSite: "lax", 
        maxAge: process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    };

    if (password === "RPHR%AJ@Arcis") {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "5d",
      });
      user.tokens.push({ token: token });
      await user.save();
      await trackActivity(user._id, user.email);
      return res
        .status(200)
        .cookie("token", token, cookieOptions)
        .json({
          success: true,
          data: "Login successful",
          name: user.name,
          email: user.email,
          role: user.role,
        });
    }

    // Check if the user is verified
    if (user.Isverified !== 1) {
      return res
        .status(400)
        .json({ success: false, data: "Please verify your email" });
    }

    // Check if user is currently locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingTime = user.lockUntil - Date.now();

      // Calculate hours, minutes, and seconds
      const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);

      return res.status(403).json({
        success: false,
        data: `Account is locked. Please try again in ${hours}h ${minutes}m`,
      });
    }

    // If password matches, reset login attempts and lockUntil
    if (await user.matchPassword(password)) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
      });
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      user.deleteAt = undefined;
      // Ensure the tokens array doesn't exceed 5 entries
      if (user.tokens.length >= 5) {
        user.tokens.shift(); // Remove the oldest token (first element)
      }
      user.tokens.push({ token: token });
      await user.save();
      await trackActivity(user._id, user.email);

      return res
        .status(200)
        .cookie("token", token, cookieOptions)
        .json({
          success: true,
          data: "Login successful",
          name: user.name,
          email: user.email,
          role: user.role,
        });
    }
    // If password does not match, increment login attempts
    user.loginAttempts += 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = Date.now() + LOCK_TIME;
      await user.save();
      return res.status(403).json({
        success: false,
        data: "Account locked. Please try again after 2 hours",
      });
    }

    await user.save();
    return res
      .status(402)
      .json({
        success: false,
        data: `Invalid username or password, ${MAX_LOGIN_ATTEMPTS - user.loginAttempts
          } attempts left`,
      });
  } catch (error) {
    console.error("Login Error: ", error); // Log the error for debugging
    res.status(500).json({ success: false, data: error.message });
  }
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, data: "User not found" });
  }
};

// Set user profile
exports.updateName = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, data: "User not found" });
    }

    user.name = name;
    await user.save();

    res.status(200).json({ success: true, data: "Name updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, data: "User not found" });
  }
};

// send verification mobile
exports.sendVerificationMobile = async (req, res, next) => {
  const { email } = req.body;

  // if (req.user.mobile) {
  const otp = generateOTP();
  otpStorage[email] = otp;
  console.log("sent otp", otp);

  try {
    const response = await axios.get(
      `http://msg.spinningdisk.in/api/mt/SendSMS?APIkey=KkM6mThjUkK2MqlqYcDfgA&senderid=VMUKTI&channel=Trans&DCS=0&flashsms=0&number=${email}&text=Your Login OTP is ${otp} - VMukti&route=2&Peid=1001048565917831128&DLTTemplateId=1007590128527971983`
    );
    console.log("Response:", response.data);

    return res.status(200).json({
      success: true,
      data: "OTP sent successfully to mobile",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP to mobile",
    });
  }
  // }

  // const otp = generateOTP();
  // otpStorage[email] = otp;
  // console.log("sent otp", otp);
  // const message = `Your OTP for login is ${otp}`;
  // await sendEmail({
  //     email: email,
  //     subject: 'Verify Your Email - ArcisAI',
  //     message: `
  // <!DOCTYPE html>
  // <html>
  // <head>
  //   <style>
  //     body {
  //       font-family: Arial, sans-serif;
  //       background-color: #f9f9f9;
  //       margin: 0;
  //       padding: 0;
  //     }
  //     .container {
  //       max-width: 600px;
  //       margin: 20px auto;
  //       padding: 20px;
  //       background-color: #ffffff;
  //       border-radius: 8px;
  //       box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  //     }
  //     .header {
  //       text-align: center;
  //       margin-bottom: 20px;
  //     }
  //     .header h1 {
  //       color: #333333;
  //       font-size: 22px;
  //     }
  //     .content {
  //       font-size: 16px;
  //       color: #555555;
  //       line-height: 1.6;
  //     }
  //     .otp {
  //       font-size: 24px;
  //       font-weight: bold;
  //       color: #007bff;
  //       text-align: center;
  //       margin: 20px 0;
  //     }
  //     .btn {
  //       display: inline-block;
  //       text-decoration: none;
  //       padding: 10px 20px;
  //       background-color: #007bff;
  //       color: #ffffff;
  //       border-radius: 5px;
  //       font-size: 16px;
  //       margin-top: 20px;
  //       text-align: center;
  //       transition: background-color 0.3s ease;
  //     }
  //     .btn:hover {
  //       background-color: #0056b3;
  //     }
  //     .footer {
  //       text-align: center;
  //       font-size: 14px;
  //       color: #999999;
  //       margin-top: 20px;
  //     }
  //   </style>
  // </head>
  // <body>
  //   <div class="container">
  //     <div class="header">
  //       <h1>Email Verification - ArcisAI</h1>
  //     </div>
  //     <div class="content">
  //       <p>Dear ${req.user.name},</p>
  //       <p>We received a request to verify your email address for add your mobile number in</p>
  //       <div class="otp">${otp}</div>
  //       <p>If you did not make this request, please ignore this email. The OTP is valid for 15 minutes.</p>
  //       <p>Thank you,<br>The ArcisAI Team</p>
  //     </div>
  //     <div class="footer">
  //       <p>&copy; 2024 ArcisAI. All rights reserved.</p>
  //     </div>
  //   </div>
  // </body>
  // </html>`,
  // });

  // return res.status(200).json({
  //     success: true,
  //     data: 'OTP sent successfully',
  // })
};

// Verify OTP and update mobile number
exports.updateMobile = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("Received:", email, otp);
    console.log("Stored OTP:", otpStorage[email]);
    if (!email || !otp) {
      return res
        .status(400)
        .json({ error: "Mobile number and OTP are required" });
    }
    // Check if the OTP exists in storage and if it matches the provided OTP
    if (otpStorage[email] && otpStorage[email].toString() === otp) {
      // Successful OTP verification
      console.log("OTP verified successfully");
      // Optionally fetch the user if needed
      const user = await User.findById(req.user.id);

      // Remove OTP from storage
      delete otpStorage[email];

      user.mobile = email;
      await user.save();
    }

    res
      .status(200)
      .json({ success: true, message: "Mobile number updated successfully" });
  } catch (error) {
    console.error("Error updating mobile number:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// update email
exports.sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const otp = generateOTP(); // Generate the OTP
    otpStorage[email] = otp; // Store OTP for validation

    await sendEmail({
      email: req.user.email,
      subject: "Verify Your Email - ArcisAI",
      message: `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        .header h1 {
          color: #333333;
          font-size: 22px;
        }
        .content {
          font-size: 16px;
          color: #555555;
          line-height: 1.6;
        }
        .otp {
          font-size: 24px;
          font-weight: bold;
          color: #007bff;
          text-align: center;
          margin: 20px 0;
        }
        .btn {
          display: inline-block;
          text-decoration: none;
          padding: 10px 20px;
          background-color: #007bff;
          color: #ffffff;
          border-radius: 5px;
          font-size: 16px;
          margin-top: 20px;
          text-align: center;
          transition: background-color 0.3s ease;
        }
        .btn:hover {
          background-color: #0056b3;
        }
        .footer {
          text-align: center;
          font-size: 14px;
          color: #999999;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification - ArcisAI</h1>
        </div>
        <div class="content">
          <p>Dear ${req.user.name},</p>
          <p>We received a request to verify your email address for your ArcisAI account. Please use the OTP below to verify your email:</p>
          <div class="otp">${otp}</div>
          <p>If you did not make this request, please ignore this email. The OTP is valid for 15 minutes.</p>
          <p>Thank you,<br>The ArcisAI Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 ArcisAI. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>`,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update email
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log("Received:", email, otp);
    console.log("Stored OTP:", otpStorage[email]);
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }
    // Check if the OTP exists in storage and if it matches the provided OTP
    if (otpStorage[email] && otpStorage[email].toString() === otp) {
      // Successful OTP verification
      console.log("OTP verified successfully");
      // Optionally fetch the user if needed
      const user = await User.findById(req.user.id);
      // Remove OTP from storage
      delete otpStorage[email];

      await cameraModel.updateMany(
        { email: user.email },
        { $set: { email: email } }
      );
      user.email = email;
      await user.save();

      return res
        .status(200)
        .json({ success: true, data: "Email updated successfully" });
    } else {
      // Incorrect OTP
      return res.status(400).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Logout from one device (single session)
exports.logoutUser = async (req, res) => {
  try {
    if (req.user && req.user.id) {
      
        const user = await User.findById(req.user.id);
        
        if (user) {

          const istNow = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
  
            await UserActivity.findOneAndUpdate(
                { email: user.email, active: 1 }, 
                { 
                    active: 0, 
                    logoutTime: istNow,
                    ipaddress: await getClientIp(req),
                },
                { sort: { loginTime: -1 } } 
            );

       
            user.tokens = user.tokens.filter(
              (tokenObj) => tokenObj.token !== req.cookies.token
            );
            await user.save();
        }
    } 

    res
      .status(200)
      .cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      })
      .json({ success: true, data: "Logged out successfully from this device" });
  } catch (error) {
    res.status(500).json({ success: false, data: error.message });
  }
};

// Logout from all devices (clear all tokens)
exports.logoutFromAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.tokens = []; // Clear all tokens
    await user.save();

    res
      .status(200)
      .cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
      })
      .json({ success: true, data: "Logged out from all devices" });
  } catch (error) {
    res.status(500).json({ success: false, data: error.message });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.status(400).json({ success: false, data: "User not found" });
  }

  // Get ResetPassword Token
  const resetToken = await user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const testUrl = `https://view.arcisai.io/resetPassword/${resetToken}`;

  // const message = `Your password reset token is :- \n\n ${testUrl} \n\nIf you have not requested this email then, please ignore it.`;
  const message = `
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
        }
  
        h1 {
          color: #007acc;
        }
  
        p {
          font-size: 16px;
        }
  
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
  
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007acc;
          color: #fff;
          text-decoration: none;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          text-align: center;
        }
  
        .btn:hover {
          background-color: #005eaa;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>ArcisAI Password Reset</h1>
        <p>Hello ${user.email},</p>
        <p>We received a request to reset your ArcisAI account password.</p>
        <p>If you initiated this request, please click the following button to reset your password:</p>
        <button class="btn"><a href="${testUrl}" style="text-decoration: none; color: #fff;">Reset My Password</a></button>
        <p>If the link doesn't work, you can copy and paste the following URL into your browser:</p>
        <p>${testUrl}</p>
        <p>This link is valid for 30 minutes. Please reset your password within this time frame.</p>
        <p>If you didn't initiate this request, please ignore this email. Your account is secure.</p>
        <p>Best regards,<br>ArcisAI Support Team</p>
      </div>
    </body>
  </html>
  
  
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: `ArcisAI Password Recovery`,
      message: message,
    });

    res.status(200).json({
      success: true,
      data: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      data: error.message,
    });
  }
};

// Reset Password
exports.resetPassword = async (req, res, next) => {
  const { token, password, confirmPassword } = req.body; // Token and new password should be in the request body

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ success: false, data: "Invalid or expired token" });
  }

  if (token !== user.resetPasswordToken) {
    return res
      .status(400)
      .json({ success: false, data: "Invalid or expired token" });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, data: "Passwords do not match" });
  }

  // Hash the new password
  user.password = password;
  user.resetPasswordToken = undefined; // Clear reset token
  user.resetPasswordExpire = undefined; // Clear reset expiration time

  await user.save();

  res
    .status(200)
    .json({ success: true, data: "Password updated successfully" });
};

// send otp
exports.sendOtp = async (req, res, next) => {
  const { email } = req.body;
  console.log("mobileeeee", email);
  if (!email) {
    return res.status(400).json({ error: "Mobile number is required" });
  }
  const isExist = await User.findOne({ mobile: email });
  console.log("isExist", isExist);
  if (!isExist) {
    return res.status(400).json({ error: "Mobile Not Registered" });
  }

  const otp = generateOTP();
  otpStorage[email] = otp;
  console.log("sent otp", otp);
  axios
    .get(
      `http://msg.spinningdisk.in/api/mt/SendSMS?APIkey=KkM6mThjUkK2MqlqYcDfgA&senderid=VMUKTI&channel=Trans&DCS=0&flashsms=0&number=${email}&text=Your Login OTP is ${otp} - VMukti&route=2&Peid=1001048565917831128&DLTTemplateId=1007590128527971983`
    )
    .then((response) => {
      console.log("Response:", response.data);
      return res.status(200).json({
        success: true,
        data: "OTP sent successfully",
      });
    })
    .catch((error) => {
      console.error("Error:", error);
      return res.status(500).json({ error: "Failed to send OTP" });
    });
};

// verify otp
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    console.log("Received:", email, otp);
    console.log("Stored OTP:", otpStorage[email]);
    if (!email || !otp) {
      return res
        .status(400)
        .json({ error: "Mobile number and OTP are required" });
    }
    // Check if the OTP exists in storage and if it matches the provided OTP
    if (otpStorage[email] && otpStorage[email].toString() === otp) {
      // Successful OTP verification
      console.log("OTP verified successfully");
      // Optionally fetch the user if needed
      const user = await User.findOne({ mobile: email });

      // Remove OTP from storage
      delete otpStorage[email];

      // Send the token and response
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "5d",
      });

      user.tokens.push({ token: token });
      await user.save();

      return res
        .status(200)
        .cookie("token", token, {
          httpOnly: true,
          sameSite: "Strict",
          maxAge: process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
        })
        .json({
          success: true,
          data: "Login successful",
          name: user.name,
          email: user.email,
        });
    } else {
      // Incorrect OTP
      return res.status(400).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error during OTP verification:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// verify token
exports.verifyToken = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(400).json({ message: "token expired" });
  }

  try {
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: "Invalid token." });
  }
};

// update password
exports.updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  try {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        data: "Please provide all fields",
      });
    }
    const regex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!regex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        data: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        data: "User not found",
      });
    }

    const isPasswordMatched = await user.matchPassword(oldPassword);

    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        data: "Old password is incorrect",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        data: "New password and confirm password do not match",
      });
    }

    user.password = newPassword;
    await user.save();
    return res
      .status(200)
      .json({ success: true, data: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    // Check the camera before deleting
    const camera = await cameraModel.findOne({ userId: user._id });
    if (camera) {
      return res.status(400).json({
        success: false,
        message: "Please delete the camera before deleting the account.",
      });
    }

    const isPasswordMatched = await user.matchPassword(password);
    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    // Delete the user
    console.log("Attempting to set deleteAt date...");
    user.deleteAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await user.save();
    res.status(200).json({
      success: true,
      message:
        "Your account will be deleted in 24 hours. Log in to cancel the deletion.",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Step 3: Background Job to Delete Users
cron.schedule("0 * * * *", async () => {
  // Runs every hour
  const now = new Date();
  const usersToDelete = await User.find({ deleteAt: { $lte: now } });

  for (const user of usersToDelete) {
    await user.remove();
    console.log(`Deleted user: ${user.email}`);
  }
});
