const express = require('express');
const router = express.Router();
// jwt 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

// 
const User = require('../../models/User');

// @routhe POST api/user
// @desc   Register user route
// access  Public 
router.post(
    '/',
    check('email', 'Please include a valid email').isEmail(),
    check(
        'password',
        'Please enter a password with 6 or more characters'
    ).isLength({ min: 4 }),
    async (req, res) => {
        // validate info
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // variables
        const { name, email, password } = req.body;
        // let user = null;

        try {
            let user = await User.findOne({ email });

            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: 'User already exists' }] });
            }

            user = new User({
                name,
                email,
                password
            });

            // encrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            // save user
            await user.save();

            // send jwt token
            const payload = {
                user: {
                    id: user.id
                }
            };

            //  
            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err;
                    return res.status(200).send({ msg: 'User saved', token });
                }
            );


        } catch (error) {
            printxy('error from post user', error)
            res.status(500).send({ msg: 'Error posting user' });
        }

    });


//
function printxy(x, y) {
    console.log(' ');
    console.log(' ');
    console.log(x, 'is', y);
    console.log(' ');
    console.log(' ');
}

module.exports = router;