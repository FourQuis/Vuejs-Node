const Comments = require("../../models/feedback/commentModel");
const Products = require("../../models/productModel");
const authMe = require("../../middleware/authMe");
const User = require("../../models/userModel");
const Feedbacks = require("../../models/feedback/feedbackModel");
const { ObjectId } = require("mongoose").Types;
const commentsCtrl = {
  createComments: async (req, res) => {
    try {
      const { content, product_id } = req.body;
      const userID = await authMe(req);
      if (!userID) {
        res.status(401).json({ message: "Please login to continue" });
        return;
      }
      const product = await Products.findOne({ _id: product_id });
      if (!product) {
        res.status(400).json({ message: "Product not found" });
        return;
      }
      const posted = new Date();
      const formattedPosted = posted.toISOString();
      const user = await User.findOne(
        { _id: userID },
        { name: 1, _id: 1, avatar: 1 }
      );
      var like = 0;
      var idcmt = new ObjectId();
      const comment = new Comments({
        parentcmt: idcmt,
        _id: idcmt,
        product_id: product_id,
        comment: content,
        username: user.name,
        user_id: user._id,
        avatar: user.avatar,
        timestamp: formattedPosted,
        likes: like,
        likedBy: [],
        liked: false,
      });
      await comment.save();
      await Products.findByIdAndUpdate(
        { _id: product_id },
        {
          $push: {
            comments: comment,
          },
        }
      );
      res.send(JSON.stringify(comment));
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server" });
    }
  },
  getallComments: async (req, res) => {
    try {
      const { product_id } = req.query;
      const match = product_id;
      console.log("ok", feedback_id);
      const comments = await Comments.find({ product_id: match });
      console.log(comments);
      res.json({
        status: "success",
        result: comments.length,
        comments: comments,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server" });
    }
  },
  doReply: async (req, res) => {
    try {
      const { content, product_id, comment_id, parentcmt } = req.body;
      const userID = await authMe(req);
      if (!userID) {
        res.status(401).json({ message: "Please login to continue" });
        return;
      }
      const product = await Products.findOne({ _id: product_id });
      if (!product) {
        res.status(400).json({ message: "Product not found" });
        return;
      }
      const posted = new Date();
      const formattedPosted = posted.toISOString();
      const user = await User.findOne(
        { _id: userID },
        { name: 1, _id: 1, avatar: 1 }
      );
      const like = 0;
      const reply_id = new ObjectId();
      const reply = {
        _id: reply_id,
        parentcmt: parentcmt,
        product_id: product_id,
        comment: content,
        username: user.name,
        user_id: user._id,
        avatar: user.avatar,
        timestamp: formattedPosted,
        replies: [],
        likes: like,
        likedBy: [],
        liked: false,
      };
      for (const comment of product.comments) {
        if (comment._id == parentcmt) {
          COM = comment;
        }
      }
      const updateTree = commentsCtrl.addComment(COM, comment_id, reply);
      await Products.updateOne(
        { _id: ObjectId(product_id), "comments._id": ObjectId(parentcmt) },
        { $set: { "comments.$.replies": updateTree.replies } }
      );
      res.send(JSON.stringify(reply));
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  addComment: (tree, commentId, reply) => {
    if (!tree.replies) {
      tree.replies = [];
    }
    if (tree._id == commentId) {
      tree.replies.push(reply);
      return tree;
    }
    if (!tree.replies || !Array.isArray(tree.replies)) {
      return tree;
    }
    const updatateReplipe = tree.replies.map((ele) =>
      commentsCtrl.addComment(ele, commentId, reply)
    );
    return { ...tree, replies: updatateReplipe };
  },
  findCommentById: (comments, commentId) => {
    for (const comment of comments) {
      if (comment._id == commentId) {
        return comment;
      }
      if (comment.replies && comment.replies.length > 0) {
        const foundComment = commentsCtrl.findCommentById(
          comment.replies,
          commentId
        );
        if (foundComment) {
          return foundComment;
        }
      }
    }
    return null;
  },
  likeCommentByID: async (req, res) => {
    try {
      const { commentId, product_id } = req.body;

      const userID = await authMe(req);
      if (!userID) {
        res.status(401).json({ message: "Please login to continue" });
        return;
      }
      const product = await Products.findOne({ _id: product_id });
      if (!product) {
        res.status(400).json({ message: "Product not found" });
        return;
      }
      const foundComment =  commentsCtrl.findAndUpdateLike(
        product.comments,
        commentId,
        userID,
        true
      );
      if (!foundComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      await Products.updateOne(
        { _id: product_id },
        { $set: { comments: product.comments } }
      );
      console.log(foundComment);
      res.status(200).json({ message: "Comment liked successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Endpoint cho việc dislike một comment
  dislikeCommentByID: async (req, res) => {
    try {
      const { commentId, product_id } = req.body;

      const userID = await authMe(req);
      if (!userID) {
        res.status(401).json({ message: "Please login to continue" });
        return;
      }
      const product = await Products.findOne({ _id: product_id });
      if (!product) {
        res.status(400).json({ message: "Product not found" });
        return;
      }
      const foundComment = commentsCtrl.findAndUpdateLike(
        product.comments,
        commentId,
        userID,
        false
      );
      if (!foundComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      await Products.updateOne(
        { _id: product_id },
        { $set: { comments: product.comments } }
      );
      console.log(foundComment);
      res.status(200).json({ message: "Comment disliked successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  findAndUpdateLike: (comments, commentId, userID, isLike) => {
    for (const comment of comments) {
      if (comment._id == commentId) {
        const isLiked = comment.likedBy.includes(userID);
        if ((isLiked && isLike) || (!isLiked && !isLike)) {
          return true;
        } else if (isLike) {
          comment.likes += 1;
          comment.likedBy.push(userID);
          comment.liked = true;
        } else {
          comment.likes -= 1;
          comment.likedBy = comment.likedBy.filter((id) => id !== userID);
          comment.liked = false;
        }
        return true;
      }
      if (comment.replies && comment.replies.length > 0) {
        const found = commentsCtrl.findAndUpdateLike(
          comment.replies,
          commentId,
          userID,
          isLike
        );
        if (found) return true;
      }
    }
    return false;
  },
};
module.exports = commentsCtrl;
