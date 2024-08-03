const { MongoClient } = require('mongodb');
const { mongoUrl, dbName } = require('./config');

let db;

const connectToDatabase = (callback) => {
    MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, client) => {
        if (err) {
            console.error('Failed to connect to the database. Error:', err);
            process.exit(1);
        }
        db = client.db(dbName);
        console.log(`Connected to database: ${dbName}`);
        callback(db);
    });
};

module.exports = { connectToDatabase };
