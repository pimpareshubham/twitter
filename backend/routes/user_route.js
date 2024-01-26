const express = require('express');
const router = express.Router();
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const UserModel = mongoose.model("UserModel");
const PostModel = mongoose.model("PostModel");
const { JWT_SECRET } = require('../config');
const protectedRoute = require("../middleware/protectedResource");

router.post("/signup", (req, res) => {
    const { fullName, email, password, profileImg } = req.body;
    if (!fullName || !password || !email) {
        return res.status(400).json({ error: "One or more mandatory fields are empty" });
    }
    UserModel.findOne({ email: email })
        .then((userInDB) => {
            if (userInDB) {
                return res.status(500).json({ error: "User with this email already registered" });
            }
            bcryptjs.hash(password, 16)
                .then((hashedPassword) => {
                    const user = new UserModel({ fullName, email, password: hashedPassword, profileImg, description : "" });
                    user.save()
                        .then((newUser) => {
                            res.status(201).json({ result: "User Signed up Successfully!" });
                        })
                        .catch((err) => {
                            console.log(err);
                        })
                }).catch((err) => {
                    console.log(err);
                })
        })
        .catch((err) => {
            console.log(err);
        })
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!password || !email) {
        return res.status(400).json({ error: "One or more mandatory fields are empty" });
    }
    UserModel.findOne({ email: email })
        .then((userInDB) => {
            if (!userInDB) {
                return res.status(401).json({ error: "Invalid Credentials" });
            }
            bcryptjs.compare(password, userInDB.password)
                .then((didMatch) => {
                    if (didMatch) {
                        const jwtToken = jwt.sign({ _id: userInDB._id }, JWT_SECRET);
                        const userInfo = { "_id": userInDB._id, "email": userInDB.email, "fullName": userInDB.fullName, "profileImg":userInDB.profileImg };
                        res.status(200).json({ result: { token: jwtToken, user: userInfo } });
                    } else {
                        return res.status(401).json({ error: "Invalid Credentials" });
                    }
                }).catch((err) => {
                    console.log(err);
                })
        })
        .catch((err) => {
            console.log(err);
        })
});
router.get('/user/:id', protectedRoute, async (req, res) => {
    try {
      const userId = req.params.id;
      console.log('User ID:', userId); // Log the user ID
      const user = await UserModel.findById(userId)
        .select('-password')
        .populate({
          path: 'posts', // Assuming 'posts' is the field containing user's posts
          select: 'title content createdAt', // Select the fields you want to populate for posts
        })
        .populate({
          path: 'following',
          select: 'fullName email profileImg', // Select the fields you want to populate for following users
        })
        .populate({
          path: 'followers',
          select: 'fullName email profileImg', // Select the fields you want to populate for followers
        });
        
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      console.log(user)
  
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });  

  router.get('/userposts/:userId', protectedRoute, async (req, res) => {
    try {
      const userId = req.params.userId;
      console.log('User ID for Posts:', userId); // Log the user ID for posts
  
      const userPosts = await PostModel.find({ author: userId })
        .select('description image createdAt likes') // Include 'likes' in the fields to select
        .populate({
          path: 'author',
          select: 'fullName email profileImageUrl', // Select the fields you want to populate for the post author
        })
        .populate({
          path: 'comments', // Assuming 'comments' is the field in PostModel that references CommentModel
          select: 'commentText commentedBy createdAt', // Select the fields you want to include for comments
          populate: {
            path: 'commentedBy',
            select: 'fullName email profileImageUrl', // Select the fields you want to include for the comment author
          },
        })
        .populate({
          path: 'likes', // Assuming 'likes' is the field in PostModel that references LikeModel
          select: 'likedBy ', // Select the fields you want to include for likes
          populate: {
            path: 'likedBy',
            select: 'fullName email profileImageUrl', // Select the fields you want to include for the like author
          },
        });
  
      res.json({ posts: userPosts });
    } catch (error) {profileImageUrl
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  router.get('/myprofile', protectedRoute, async (req, res) => {
    try {
      const userId = req.user.id; // Assuming userId is available in the request object
      const user = await UserModel.findById(userId)
        .populate('followers', 'fullName') // Assuming followers is a reference to another User model
        .populate('following', 'fullName'); // Assuming following is a reference to another User model
  
      // Construct a simplified user object to send back to the client
      const userProfile = {
        _id: user._id,
        email: user.email,
        description :user.description,
        fullName: user.fullName,
        profileImageUrl: user.profileImg,
        followers: user.followers.length,
        following: user.following.length,
      };

      console.log(userProfile)
  
      res.json(userProfile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  router.post('/follow/:userId', protectedRoute, async (req, res) => {
    try {
        const userId = req.user._id; // Assuming userId is available in the request object
        const followUserId = req.params.userId;

        // Check if the user is trying to follow themselves
        if (userId.toString() === followUserId.toString()) {
            return res.status(400).json({ error: "Cannot follow yourself" });
        }

        const user = await UserModel.findById(userId);
        const followUser = await UserModel.findById(followUserId);

        // Check if the user and the user to follow exist
        if (!user || !followUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the user is already following the followUser
        if (user.following.includes(followUserId)) {
            return res.status(400).json({ error: 'Already following this user' });
        }

        // Update the user's following list
        user.following.push(followUserId);
        await user.save();

        // Update the followUser's followers list
        followUser.followers.push(userId);
        await followUser.save();

        res.json({ message: 'User followed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Unfollow user
router.post('/unfollow/:userId', protectedRoute, async (req, res) => {
    try {
        const userId = req.user._id; // Assuming userId is available in the request object
        const unfollowUserId = req.params.userId;

        // Check if the user is trying to unfollow themselves
        if (userId.toString() === unfollowUserId.toString()) {
            return res.status(400).json({ error: "Cannot unfollow yourself" });
        }

        const user = await UserModel.findById(userId);
        const unfollowUser = await UserModel.findById(unfollowUserId);

        // Check if the user and the user to unfollow exist
        if (!user || !unfollowUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the user is not following the unfollowUser
        if (!user.following.includes(unfollowUserId)) {
            return res.status(400).json({ error: 'Not following this user' });
        }

        // Remove the unfollowUserId from the user's following list
        user.following = user.following.filter(id => id.toString() !== unfollowUserId.toString());
        await user.save();

        // Remove the userId from the unfollowUser's followers list
        unfollowUser.followers = unfollowUser.followers.filter(id => id.toString() !== userId.toString());
        await unfollowUser.save();

        res.json({ message: 'User unfollowed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/checkfollow/:userId', protectedRoute, async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const followUserId = req.params.userId;

    const user = await UserModel.findById(loggedInUserId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the user is following the specified user
    const isFollowing = user.following.includes(followUserId);

    res.json({ following: isFollowing });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


 
module.exports = router;