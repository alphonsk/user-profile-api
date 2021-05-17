const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  username: {
    type: String,
    required: true
  },
  birthday: {
    type: Date,
    required: true
  },
  website: {
    type: String
  },
  skills: {
    type: [String],
    // required: true
  },
  bio: {
    type: String
  },

  experience: [
    {
      title: {
        type: String,
        required: true
      },
      location: {
        type: String
      },
    }
  ],
  social: {
    facebook: {
      type: String
    },
    instagram: {
      type: String
    }
  },
},
  { timestamps: true }
);

module.exports = mongoose.model('profile', ProfileSchema);


