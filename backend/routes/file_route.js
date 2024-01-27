const express = require('express');
const router = express.Router();
const multer = require("multer");
const mongoose = require("mongoose");
const UserModel = mongoose.model("UserModel");
const protectedRoute = require("../middleware/protectedResource");
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');



const storage = new Storage({
    keyFilename: path.join(__dirname, '../storageACKey/sakey.json'), // Update with the correct path
    projectId: 'dauntless-water-412305', // Replace with your project ID
});

const bucketName = 'shubhamspstorage'; // replace with your bucket name
const bucket = storage.bucket(bucketName);

const upload = multer({ dest: 'uploads/' });


router.post("/uploadFile", upload.single('file'), async function (req, res) {
    try {
        console.log("inside /uploadFile")
        if (!req.file) {
            console.log("not file")
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileName = req.file.originalname;  // Use originalname to get the file name with extension
        const localFilePath = req.file.path;

        console.log(fileName)

        // Upload the file to Google Cloud Storage
        await bucket.upload(localFilePath, {
            destination: fileName,
        });

        // Delete the local file after uploading to GCS
        fs.unlinkSync(localFilePath);

        // Get the public URL of the uploaded file
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

        // Send the public URL in the response
        console.log(publicUrl)
        res.status(201).json({ "fileName": fileName, "publicUrl": publicUrl });
    } catch (error) {
        console.error('Error uploading file to Google Cloud Storage:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});




router.post("/updateProfileDetails", protectedRoute, upload.single('file'), async (req, res) => {
    try {

        console.log("inside /updateProfileDetails")
        const user = await UserModel.findById(req.user._id);

        // Delete old profile picture if exists in Google Cloud Storage
        if (user.profileImg) {
            try {
                await bucket.file(user.profileImg).delete();
            } catch (deleteError) {
                console.error('Error deleting old profile picture:', deleteError);
            }
        }

        // Check if a new profile picture is provided
        if (req.file) {
            // Upload the file directly to GCS without saving it locally
            const fileName = req.file.originalname;
            const fileBuffer = req.file.buffer;

            await bucket.file(fileName).save(fileBuffer, {
                contentType: req.file.mimetype,
            });

            // Get the public URL of the uploaded file
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

            // Update user's profile picture field with the new filename and public URL
            user.profileImg = publicUrl;
        }

        // Update other user information
        user.fullName = req.body.fullName || user.fullName;
        user.email = req.body.email || user.email;
        user.description = req.body.description || user.description;

        await user.save();

        res.status(201).json({ 
            message: "Profile information updated successfully", 
            profileImg: user.profileImg
        
        });
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