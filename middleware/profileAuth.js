const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');
const Profile = require('../models/Profile');

module.exports = async function (req, res, next) {
    // 
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user)
            return res.status(401).json({ msg: 'Are you Logged in?' });

        const profile = await Profile.findOne({ user: user.id })
        if (!profile)
            return res.status(401).json({ msg: 'Create a profile' });
        //  
        next();
    } catch (err) {
        // console.error('something wrong with auth middleware');
        res.status(500).json({ msg: 'Server Error' });
    }
};
