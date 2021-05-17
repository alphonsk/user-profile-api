const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

// const connectDB = async () => {
//     console.log('MongoDb db trying to connect... ');
//     try {
//         await mongoose.connect(db, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true
//         });

//         console.log('MongoDb db connected... ');
//     } catch (error) {
//         console.log('MongoDb db connecting error ', error );

//         // exit app
//         process.exit(1);
//     }
// }

const connectDB = () => {
  mongoose.connect(
    "mongodb://localhost:27017/userprofile",
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false },
    function (err) {
      if (err) {
        console.log(err);
        // exit app
        process.exit(1);
      } else {
        console.log("mongoose db conection was successfull");
      }
    }
  );
};

module.exports = connectDB;
