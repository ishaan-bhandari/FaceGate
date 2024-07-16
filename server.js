// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

// Initialize Express app and set the port
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// AWS Rekognition setup
const rekognition = new AWS.Rekognition({
    region: process.env.AWS_REGION
});

// MongoDB setup
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

app.post('/upload', upload.single('image'), (req, res) => {
    const params = {
        Image: {
            Bytes: req.file.buffer
        },
        Attributes: ['ALL']
    };

    // calling Rekognition
    rekognition.detectFaces(params, (err, data) => {
        if (err) {
            console.error('Error detecting faces:', err);
            res.status(500).send(err);
        } else {
            // Process face details & store in Mongo
            const faceDetails = data.FaceDetails;
            const collection = db.collection('attendance');
            const attendanceRecord = {
                timestamp: new Date(),
                faces: faceDetails
            };
            collection.insertOne(attendanceRecord, (err, result) => {
                if (err) {
                    console.error('Error inserting document into MongoDB:', err);
                    res.status(500).send(err);
                } else {
                    console.log('Attendance record saved:', result.ops[0]);
                    res.status(200).send(result.ops[0]);
                }
            });
        }
    });
});

// Start Express server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
