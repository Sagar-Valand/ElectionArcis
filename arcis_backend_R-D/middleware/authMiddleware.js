const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.isAuthenticatedUser = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Please log in to access this resource' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        // Check if token exists in user's token array
        if (!user || !user.tokens.some((tokenObj) => tokenObj.token === token)) {
            return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};
