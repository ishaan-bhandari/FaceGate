const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const s3 = new AWS.S3();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadToS3 = async (imageBuffer) => {
  const fileName = `${uuidv4()}.jpeg`;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `facegate-images/${fileName}`,
    Body: imageBuffer,
    ContentType: 'image/jpeg',
    ACL: 'public-read'
  };

  const data = await s3.upload(params).promise();
  return data.Location;
};

app.post('/addKnownFace', upload.single('image'), async (req, res) => {
  const { memberId } = req.body;
  const s3Url = await uploadToS3(req.file.buffer);

  const collection = db.collection('knownFaces');
  const knownFace = {
    memberId: memberId,
    faceImageUrl: s3Url
  };

  await collection.insertOne(knownFace);
  res.status(200).send(knownFace);
});
