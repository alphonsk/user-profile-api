const express = require("express");
const connectDB = require("./config/db");
// var cors = require('cors')
const app = express();

// connect database
connectDB();

// init middleware
app.use(express.json({}))
// app.use(cors())

// Import all routes  
// app.get("/", (req, res) => res.send("API running"));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profiles', require('./routes/api/profiles'));
app.use('/api/posts', require('./routes/api/post'));
app.use('/*', require('./routes/other/error'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server started on port ${PORT}`));