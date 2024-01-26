const express = require('express');
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const UserModel = mongoose.model("UserModel");
const protectedRoute = require("../middleware/protectedResource");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const upload = multer({
    storage: storage,
   
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/webp") {
            cb(null, true);
        } else {
            cb(null, false);
            return res.status(400).json({ error: "File types allowed are .jpeg, .png, .jpg" });
        }
    }
});

router.post("/uploadFile", upload.single('file'), function (req, res) {
    res.json({ "fileName": req.file.filename });
});

router.post("/updateProfileDetails", protectedRoute, upload.single('file'), async (req, res) => {
    try {
        const user = await UserModel.findById(req.user._id);

        // Delete old profile picture if exists
        if (user.profileImg) {
            // You might want to delete the old file from the server, e.g., using fs.unlinkSync
        }

        // Check if a new profile picture is provided
        if (req.file) {
            // Update user's profile picture field with the new filename
            user.profileImg = req.file.filename;
        }

        // Update other user information
        user.fullName = req.body.fullName || user.fullName;
        user.email = req.body.email || user.email;
        user.description = req.body.description || user.description;

        await user.save();

        res.json({ message: "Profile information updated successfully", profileImg: user.profileImg });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


const downloadFile = (req, res) => {
    const fileName = req.params.filename;
    const path = __basedir + "/uploads/";

    res.download(path + fileName, (error) => {
        if (error) {
            res.status(500).send({ meassge: "File cannot be downloaded " + error })
        }
    })
}
router.get("/files/:filename", downloadFile);

module.exports = router;