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
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname);
  }
});
const dataFile = "public/uploads/data";
const markerFile = "public/uploads/marker";

const upload = multer({ storage: diskStorage });

router.get("/", (req, res) => res.render("nuUpload"));

function respondWithTypes(res, viewName) {
  client.connect(err => {
    const db = client.db("banDB");
    const typeNameCollection = db.collection("types");
    typeNameCollection.find().toArray((err, docs) => res.render(viewName, {types: docs}));
  });
}

router.get("/map", (req, res) => {
  respondWithTypes(res, "map");
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

    fs.rename(markerFile, `public/markers/${newType}.png`, err => console.log(err));
    const typeNameCollection = db.collection("types");
    typeNameCollection.find({ type: newType }).toArray((err, docs) => {
      if(docs.length === 0) {
        typeNameCollection.insertOne({ type: newType });
      }
    });

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
                newCollection.updateOne({ lat: data.lat, lng: data.lng }, { $set: data }, { upsert: true });
              }
            });
        })
        .on('end', () => {
          fs.unlinkSync(dataFile);
          typeNameCollection.find().toArray((err, docs) => res.render("map", { types: docs }));
        });
  });
});

router.get("/deleteType/:typeName", (req, res) => {
  client.connect((err) => {
    const typeName = req.params.typeName;
    const db = client.db("banDB");

    fs.unlinkSync(`public/markers/${typeName}.png`);
    db.collection(typeName).drop();
    db.collection("types").deleteOne({type: typeName});
    res.send("Deletion in progress...");
  });
});

router.get("/deleteItem/:typeName/:itemId", (req, res) => {
  client.connect((err) => {
    const db = client.db("banDB");

    db.collection(req.params.typeName).deleteOne({ _id: ObjectID(req.params.itemId) });
    res.send("Deletion in progress...");
  });
});

router.get("/upsert", (req, res) => {
  respondWithTypes(res, "upsert");
});

router.post("/upsert", (req, res) => {
  console.log(req.body);
});

module.exports = router;
