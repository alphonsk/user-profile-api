const express = require('express');
const axios = require('axios');
const config = require('config');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
// bring in normalize to give us a proper url, regardless of what user entered
const normalize = require('normalize-url');
//
const checkObjectId = require('../../middleware/checkObjectId');
const auth = require('../../middleware/auth');
const profileAuth = require('../../middleware/profileAuth');
//
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');




// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
    '/',
    auth,
    check('username', 'Username is required').notEmpty(),
    check('birthday', 'DOB is required').notEmpty(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // destructure the request
        const {
            username,
            birthday,
            website,
            skills,
            instagram,
            facebook,
            // spread the rest of the fields we don't need to check
            ...rest
        } = req.body;

        // check for user 
        const user = await User.findById(req.user.id);
        if (!user) return res.status(400).json({ msg: 'Are you logged in' });

        // build a profile
        const profileFields = {
            user: req.user.id,
            username,
            birthday,
            website:
                website && website !== ''
                    ? normalize(website, { forceHttps: true })
                    : '',
            skills: Array.isArray(skills)
                ? skills
                : skills.split(',').map((skill) => ' ' + skill.trim()),
            ...rest
        };

        // Build socialFields object
        const socialFields = { instagram, facebook };

        // normalize social fields to ensure valid url
        for (const [key, value] of Object.entries(socialFields)) {
            if (value && value.length > 0)
                socialFields[key] = normalize(value, { forceHttps: true });
        }
        // add to profileFields
        profileFields.social = socialFields;

        try {
            // Using upsert option (creates new doc if no match is found):
            let profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );
            return res.json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
    }
);



// 
// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate('user', ['email', 'age']);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route    GET api/profile
// @desc     Get all profiles
// @access   Private
router.get('/', auth, profileAuth, async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['email', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});



// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get(
    '/user/:user_id',
    checkObjectId('user_id'),
    async ({ params: { user_id } }, res) => {
        try {
            const profile = await Profile.findOne({
                user: user_id
            }).populate('user', ['name', 'avatar']);

            if (!profile) return res.status(400).json({ msg: 'Profile not found' });

            return res.json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({ msg: 'Server error' });
        }
    }
);


// @route    GET api/profile/:profile_id
// @desc     Get profile by profile ID
// @access   Public
router.get(
    '/:profile_id',
    checkObjectId('profile_id'),
    async ({ params: { profile_id } }, res) => {
        try {
            const profile = await Profile.findById(profile_id).populate('user', ['email', 'city']);

            if (!profile) return res.status(400).json({ msg: 'Profile not found' });

            return res.json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({ msg: 'Server error' });
        }
    }
);


// @route    GET api/profile/name/:username
// @desc     Get profile by username
// @access   Public
router.get(
    '/name/:username',
    async ({ params: { username } }, res) => {
        try {
            const profile = await Profile.findOne({ username: username }).populate('user', ['email', 'city']);

            if (!profile) return res.status(400).json({ msg: 'Profile not found' });

            return res.json(profile);
        } catch (err) {
            console.error(err.message);
            return res.status(500).json({ msg: 'Server error' });
        }
    }
);



// @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private
router.delete('/', auth, profileAuth, check('password', 'Password is required').exists(), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    //
    const { password } = req.body;

    try {
        let user = await User.findById({ _id: req.user.id });
        const profile = await Profile.findOne({ user: req.user.id })
        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Try log in' }] });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        // Remove user posts
        // Remove profile
        // Remove user
        await Promise.all([
            Post.deleteMany({ profile: profile.id }),
            // Post.deleteMany({ user: req.user.id }), 
            Profile.findOneAndRemove({ user: req.user.id }),
            User.findOneAndRemove({ _id: req.user.id })
        ]);

        res.json({ msg: 'User deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// 
// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
router.put(
    '/experience',
    auth,
    profileAuth,
    check('title', 'Title is required').notEmpty(),
    // check('from', 'From the past') 
    //   .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const profile = await Profile.findOne({ user: req.user.id })
            profile.experience.unshift(req.body);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);



// @route GET experienc by id
router.get('/experience/:exp_id', checkObjectId('profile_id'), auth, profileAuth, async (req, res) => {
    try {
        const foundProfile = await Profile.findOne({ user: req.user.id });

        // foundProfile.experience.map( (exp) =>{ return {exp._id.toString() == req.params.exp_id}});
        let foundProfileExperience = foundProfile.experience.filter(
            (exp) => exp._id.toString() == req.params.exp_id
        );
        return res.status(200).json(foundProfileExperience);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Server error' });
    }
});
module.exports = router;

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private
router.delete('/experience/:exp_id', checkObjectId('profile_id'), auth, async (req, res) => {
    try {
        const foundProfile = await Profile.findOne({ user: req.user.id });

        foundProfile.experience = foundProfile.experience.filter(
            (exp) => exp._id.toString() !== req.params.exp_id
        );

        await foundProfile.save();
        return res.status(200).json(foundProfile);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Server error' });
    }
});
module.exports = router;

//"experience": "{'title':'manager','location': 'philly' },{'title':'driver','location': 'ny'}"