const express = require('express');
const router = express.Router();

// @route GET api/users  
router.get('/', async (req, res) => {
    res.status(401).send('The page you are looking for is not present');
});


module.exports = router;