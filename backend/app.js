require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { connectToDatabase } = require('./database');
const knownFacesRoutes = require('./routes/knownFaces');
const attendanceRoutes = require('./routes/attendance');
const authenticate = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(authenticate);

connectToDatabase((db) => {
    app.locals.db = db;

    app.use('/knownFaces', knownFacesRoutes);
    app.use('/attendance', attendanceRoutes);

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});
