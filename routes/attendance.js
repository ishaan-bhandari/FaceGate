const express = require('express');
const multer = require('multer');
const rekognition = require('../rekognition');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.single('image'), (req, res) => {
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
            collection.find().toArray((err, knownFaces) => {
                if (err) {
                    console.error('Error retrieving known faces from MongoDB:', err);
                    res.status(500).send(err);
                } else {
                    let matches = [];
                    faceDetails.forEach((detectedFace) => {
                        knownFaces.forEach((knownFace) => {
                            const compareParams = {
                                SourceImage: {
                                    Bytes: req.file.buffer
                                },
                                TargetImage: {
                                    Bytes: knownFace.image
                                },
                                SimilarityThreshold: 90
                            };
                            rekognition.compareFaces(compareParams, (err, compareData) => {
                                if (err) {
                                    console.error('Error comparing faces:', err);
                                } else {
                                    if (compareData.FaceMatches.length > 0) {
                                        matches.push({
                                            memberId: knownFace.memberId,
                                            similarity: compareData.FaceMatches[0].Similarity
                                        });
                                    }
                                }
                            });
                        });
                    });

                    if (matches.length > 0) {
                        const attendanceCollection = req.app.locals.db.collection('attendance');
                        const attendanceRecord = {
                            timestamp: new Date(),
                            matches: matches
                        };
                        attendanceCollection.insertOne(attendanceRecord, (err, result) => {
                            if (err) {
                                console.error('Error inserting document into MongoDB:', err);
                                res.status(500).send(err);
                            } else {
                                console.log('Attendance record saved:', result.ops[0]);
                                res.status(200).send(result.ops[0]);
                            }
                        });
                    } else {
                        res.status(200).send({ message: 'No known faces matched.' });
                    }
                }
            });
        }
    });
});

router.get('/', (req, res) => {
    const attendanceCollection = req.app.locals.db.collection('attendance');

    attendanceCollection.find().toArray((err, records) => {
        if (err) {
            console.error('Error retrieving attendance records from MongoDB:', err);
            res.status(500).send(err);
        } else {
            res.status(200).send(records);
        }
    });
});

module.exports = router;