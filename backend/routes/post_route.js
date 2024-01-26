const express = require('express');
const router = express.Router();
const mongoose = require("mongoose");
const PostModel = mongoose.model("PostModel");
const UserModel = mongoose.model("UserModel");
const protectedRoute = require("../middleware/protectedResource");


//all users posts
router.get("/allposts", (req, res) => {
    PostModel.find()
        .populate("author", "_id fullName profileImg")
        .populate("comments.commentedBy", "_id fullName")
        .then((dbPosts) => {
            res.status(200).json({ posts: dbPosts })
        })
        .catch((error) => {
            console.log(error);
        })
});

//all posts only from logged in user
router.get("/myallposts", protectedRoute, (req, res) => {
    PostModel.find({ author: req.user._id })
        .populate("author", "_id fullName profileImg")
        .populate("comments.commentedBy", "_id fullName")
        .then((dbPosts) => {
            res.status(200).json({ posts: dbPosts })
        })
        .catch((error) => {
            console.log(error);
        })
});

router.post("/createpost", protectedRoute, async (req, res) => {
    const { description, location, image } = req.body;
    if (!description || !location || !image) {
        return res.status(400).json({ error: "One or more mandatory fields are empty" });
    }

    req.user.password = undefined;
    const postObj = new PostModel({ description: description, location: location, image: image, author: req.user });

    try {
        const newPost = await postObj.save();

        // Associate the post with the user and update the user's posts array
        const user = await UserModel.findById(req.user._id);
        user.posts.push(newPost._id);
        await user.save();

        res.status(201).json({ post: newPost });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred while creating a new post" });
    }
});


router.delete("/deletepost/:postId", protectedRoute, (req, res) => {
    PostModel.findOne({ _id: req.params.postId })
        .populate("author", "_id")
        .exec((error, postFound) => {
            if (error || !postFound) {
                return res.status(400).json({ error: "Post does not exist" });
            }
            //check if the post author is same as loggedin user only then allow deletion
            if (postFound.author._id.toString() === req.user._id.toString()) {
                postFound.remove()
                    .then((data) => {
                        res.status(200).json({ result: data });
                    })
                    .catch((error) => {
                        console.log(error);
                    })
            }
        })
});

router.put("/like", protectedRoute, (req, res) => {
    PostModel.findByIdAndUpdate(req.body.postId, {
        $push: { likes: req.user._id }
    }, {
        new: true //returns updated record
    }).populate("author", "_id fullName")
        .exec((error, result) => {
            if (error) {
                return res.status(400).json({ error: error });
            } else {
                console.log("Lets find out")
                console.log(result)
                res.json(result);

            }
        })
});
router.put("/unlike", protectedRoute, (req, res) => {
    PostModel.findByIdAndUpdate(req.body.postId, {
        $pull: { likes: req.user._id }
    }, {
        new: true //returns updated record
    }).populate("author", "_id fullName")
        .exec((error, result) => {
            if (error) {
                return res.status(400).json({ error: error });
            } else {
                res.json(result);
            }
        })
});
router.put("/comment", protectedRoute, (req, res) => {

    const comment = { commentText: req.body.commentText, commentedBy: req.user._id }

    PostModel.findByIdAndUpdate(req.body.postId, {
        $push: { comments: comment }
    }, {
        new: true //returns updated record
    }).populate("comments.commentedBy", "_id fullName") //comment owner
        .populate("author", "_id fullName")// post owner
        .exec((error, result) => {
            if (error) {
                return res.status(400).json({ error: error });
            } else {
                res.json(result);
            }
        })
});

router.post("/retweet/:postId", protectedRoute, async (req, res) => {
    try {
        // Find the original post by postId
        const originalPost = await PostModel.findById(req.params.postId)
            .populate("author", "_id fullName profileImg")
            .populate("comments.commentedBy", "_id fullName");

        if (!originalPost) {
            return res.status(404).json({ error: "Original post not found" });
        }

        // Create a new post with a reference to the original post
        const retweetPost = new PostModel({
            description: ` ${originalPost.description}`,
            author: req.user,
            retweetOf: originalPost._id,
            image: originalPost.image,
            location: originalPost.location,
        });
        console.log("lets find whats in req.user")
        console.log(req.user)

        const newRetweet = await retweetPost.save();

        // Associate the retweet with the user and update the user's posts array
        const user = await UserModel.findById(req.user._id);
        user.posts.push(newRetweet._id);
        await user.save();

        // Increment the retweet count in the original post
        originalPost.retweets.push(newRetweet._id);
        await originalPost.save();
        

        res.status(201).json({
            retweet: newRetweet,
            retweets: originalPost.retweets.length + 1,
            retweetedUsers: originalPost.retweets.map((retweet) => retweet.author)
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred while retweeting" });
    }
});



router.get('/userDetails/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await UserModel.findById(userId);

        if (user) {
            console.log(user)
            res.status(200).json({ userDetails: user });
        } else {
            res.status(404).json({ error: "User not found" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




module.exports = router;
