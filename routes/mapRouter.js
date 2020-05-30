const { MongoClient, ObjectID } = require('mongodb');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const mongoURI = "mongodb://localhost:27017/";
const client = new MongoClient(mongoURI);

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname)
  }
});
const dataFile = "public/uploads/data";
const markerFile = "public/uploads/marker";

const upload = multer({ storage: diskStorage });

router.get("/", (req, res) => res.render("nuUpload"));

router.get("/map", (req, res) => {
  client.connect(err => {
    const db = client.db("banDB");
    const typeNameCollection = db.collection("types");
    typeNameCollection.find().toArray((err, docs) => res.render("map", { types: docs }));
  });
});

router.get("/types/:typeName", (req, res) => {
  client.connect(err => {
    const db = client.db("banDB");
    const typeCollection = db.collection(req.params.typeName);
    typeCollection.find().toArray((err, docs) => res.send(docs));
  });
});

router.post("/map", upload.fields([
  { name: "data", maxCount: 1},
  { name: "marker", maxCount: 1}
]), function(req, res) {
  client.connect((err) => {
    const newType = req.body.type;
    const db = client.db("banDB");

    fs.rename(markerFile, `public/markers/${newType}`, err => console.log(err));
    const typeNameCollection = db.collection("types");
    typeNameCollection.insertOne({ type: newType });

    const newCollection = db.collection(newType);
    const cityCollection = db.collection("cities")

    fs.createReadStream(dataFile)
        .pipe(csv())
        .on('data', data => {
          cityCollection.find({"city": data.city, "state_name": data.state})
            .toArray(function(err, docs) {
              if(docs.length > 0) {
                data.lat = docs[0].lat;
                data.lng = docs[0].lng;
                newCollection.insertOne(data, err => console.log(err));
              }
            });
        })
        .on('end', () => {
          fs.unlinkSync(dataFile);
          typeNameCollection.find().toArray((err, docs) => res.render("map", { types: docs }));
        });
  });
});

module.exports = router;
