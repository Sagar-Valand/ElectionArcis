const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
        },
        email: {
            type: String,
            required: [true, 'Please enter your email'],
            unique: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please enter a valid email',
            ],
        },
        mobile: {
            type: String,
        },
        password: {
            type: String,
            required: [true, 'Please enter a password'],
            minlength: 6,
            select: false,
        },
        role: {
            type: Array,
            default: ['App'],
        },
        Isverified: {
            type: Number,
            default: 0,
        },
        tokens: [{
            token: {
                type: String,
                required: true,
            }
        }],
        loginAttempts: {
            type: Number,
            required: true,
            default: 0,
        },
        lockUntil: {
            type: Date,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpire: {
            type: Date,
        },
        deleteAt: {
            type: Date,
        },
        // AccessId: [
        //     {
        //         did: {
        //             type: String,
        //             required: true
        //         },
        //     }
        // ],
        UserAccessibleRegions: { type: Array }
    }, { collection: "users" });


userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (update.password) {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(update.password, salt);
    }
    next();
    console.log();
    
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = async function () {
    // Generating Token
    const resetToken = (Math.random() + 1).toString(36).substring(2); // Simple random token

    // Hashing and adding resetPasswordToken to userSchema using bcrypt
    let hashedToken = await bcrypt.hash(resetToken, 10); // Adjust salt rounds as needed

    // Remove any '/' from the hashed token
    hashedToken = hashedToken.replace(/\//g, '');

    this.resetPasswordToken = hashedToken;

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // Token valid for 15 minutes

    return hashedToken; // Return the hashed token without '/'
};

module.exports = mongoose.model('users', userSchema);
