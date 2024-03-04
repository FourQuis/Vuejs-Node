const mongoose = require("mongoose");
const replySchma = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "type",
      require: true,
    },
    parentcmt : {
      type : String,
      require: true ,
    },
    comment: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    replies: {
      type: Array,
      require: true,
    },
    likedBy: {
      type: Array,
      require: true,
    },
    liked: {
      type:Boolean,
      require: true,
    },
  },
  {
    collation: "Comments",
    timestamps: true,
  }
);
const commentsSchema = new mongoose.Schema(
  {
    likes:{
      type:Number,
      require: true,
    },
    timestamp: {
      type: String,
      require: true,
    },
    comment: {
      type: String,
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "type",
      require: true,
    },
    replies: [replySchma],
    username: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    parentcmt: {
      type: String,
      require: true,
    },
    likedBy: {
      type: Array,
      require: true,
    },
    liked: {
      type:Boolean,
      require: true,
    },
  },
  {
    collation: "Comments",
    timestamps: true,
  }
);
module.exports = mongoose.model("Comments", commentsSchema);
