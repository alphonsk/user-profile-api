const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
  profile: {
    // type: mongoose.Schema.Types.ObjectId,
    // ref: 'user',
    type: Schema.Types.ObjectId
  },
  text: {
    type: String,
    required: true
  },
  likes: [
    {
      profile: {
        type: Schema.Types.ObjectId
      }
    }
  ],
  comments: [
    {
      profile: {
        type: Schema.Types.ObjectId
      },
      text: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ]
},
  { timestamps: true }
);

module.exports = mongoose.model('post', PostSchema);
