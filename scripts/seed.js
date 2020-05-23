const { MongoClient } = require('mongodb');
const csv = require('csv-parser');
const assert = require('assert');
const fs = require('fs');

const FILENAMES = [ "bans", "customers", "lobsters", "composters", "facilities", "cities" ];
const uri = "mongodb://localhost:27017/";

const client = new MongoClient(uri);

client.connect(function(err) {
    assert.equal(null, err);
    console.log("Connected successfully to server");

    const db = client.db("banDB");

    FILENAMES.forEach((filename, index) => {
        const collection = db.collection(filename);
        const csvRows = [];

        fs.createReadStream(`data/${filename}.csv`)
            .pipe(csv())
            .on('data', data => {
                csvRows.push(data);
            })
            .on('end', () => {
                collection.insertMany(csvRows, function(err, result) {});
                console.log(`${filename} imported`);
                if (index === (FILENAMES.length - 1)) {
                    client.close();
                }
            });
    });
});

