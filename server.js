require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const rekognition = new AWS.Rekognition({
    region: process.env.AWS_REGION
});

const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;
let db;

MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) {
        console.error('Failed to connect to the database. Error:', err);
        process.exit(1);
    }
    db = client.db(dbName);
    console.log(`Connected to database: ${dbName}`);
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/addKnownFace', upload.single('image'), (req, res) => {
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
            const collection = db.collection('knownFaces');
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

app.post('/upload', upload.single('image'), (req, res) => {
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
            const collection = db.collection('knownFaces');
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
                        const attendanceCollection = db.collection('attendance');
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

app.get('/attendance', (req, res) => {
    const attendanceCollection = db.collection('attendance');

    attendanceCollection.find().toArray((err, records) => {
        if (err) {
            console.error('Error retrieving attendance records from MongoDB:', err);
            res.status(500).send(err);
        } else {
            res.status(200).send(records);
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
