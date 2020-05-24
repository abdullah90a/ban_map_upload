const { MongoClient, ObjectID } = require('mongodb');
const assert = require('assert');

const uri = "mongodb://localhost:27017/";

const client = new MongoClient(uri);

client.connect(function(err) {
    assert.equal(null, err);
    console.log("Connected successfully to server");

    const db = client.db("banDB");
    const collection = db.collection('cities');

    collection.find({'_id': ObjectID("5ec9603eeb5f38d1de72c93e")}).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        console.log(docs);
        client.close();
    });
});