const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('auth-token');

    // Check if not token
    if (!token) {
        // console.log("from midware auth js no token");
        return res.status(401).json({ msg: 'Authorization denied, try Login' });
    } else {
        // console.log("token from midware auth js ", token);
    }

    // Verify token
    try {
        jwt.verify(token, config.get('jwtSecret'), (error, decoded) => {
            if (error) {
                return res.status(401).json({ msg: 'Authorization denied, try Login' });
            } else {
                req.user = decoded.user;
                // console.log("req.user from midware auth js ", req.user);
                next();
            }
        });
    } catch (err) {
        // console.error('something wrong with auth middleware');
        res.status(500).json({ msg: 'Server Error' });
    }
};
