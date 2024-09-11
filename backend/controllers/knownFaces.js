const express = require('express');
const multer = require('multer');
const rekognition = require('../rekognition');
const { validateKnownFace } = require('../middleware/validate');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', validateKnownFace, upload.single('image'), (req, res) => {
    const memberId = req.body.memberId;
    const params = {
        Image: {
            Bytes: req.file.buffer
        },
        Attributes: ['ALL']
    };

    rekognition.detectFaces(params, (err, data) => {
        if (err) {
            console.error('Error detecting faces:', err);
            res.status(500).send(err);
        } else {
            const faceDetails = data.FaceDetails;
            const collection = req.app.locals.db.collection('knownFaces');
            const knownFace = {
                memberId: memberId,
                faceDetails: faceDetails,
                image: req.file.buffer
            };
            collection.insertOne(knownFace, (err, result) => {
                if (err) {
                    console.error('Error inserting document into MongoDB:', err);
                    res.status(500).send(err);
                } else {
                    console.log('Known face record saved:', result.ops[0]);
                    res.status(200).send(result.ops[0]);
                }
            });
        }
    });
});

module.exports = router;
