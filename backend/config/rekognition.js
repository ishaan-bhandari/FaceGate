const AWS = require('aws-sdk');
const { awsRegion } = require('./config');

const rekognition = new AWS.Rekognition({
    region: awsRegion
});

module.exports = rekognition;
