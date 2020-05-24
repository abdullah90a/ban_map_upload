const { MongoClient, ObjectID } = require('mongodb');
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const router = express.Router();
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render("index");
});

router.post('/search', function(req, res, next) {
  const searchString = req.body.citySearchString;
  const regexp = new RegExp(`${searchString}`, 'i')

  client.connect(function(err) {
    const db = client.db("banDB");
    const collection = db.collection('cities');

    collection.find({ city: regexp }).limit(10).toArray(function(err, docs) {
      res.render("search", { cities: docs, searchString: searchString });
    });
  });
});

router.get("/view/:cityId", function(req, res, next) {
  const cityId = req.params.cityId;

  client.connect(function(err) {
    const db = client.db("banDB");
    const collection = db.collection('cities');

    collection.findOne({ _id: ObjectID(cityId) }, {}, function(err, doc) {
      res.render("view", { city: doc });
    });
  });
});

async function updateDocument(collection, document) {
  let updateObject = {}
  Object.keys(document).forEach(key => {
    if(key === "_id" || key.length === 0) { return; }
    updateObject[key] = document[key];
  })

  if(document._id === undefined) {
    await collection.updateOne({ lat: document.lat, lng: document.lng }, {$set: updateObject}, { upsert: true });
  } else {
    await collection.updateOne({ _id: ObjectID(document._id) }, {$set: updateObject});
  }
}

router.post("/update", function(req, res, next) {
  const updatedCity = req.body;

  client.connect(function(err) {
    const db = client.db("banDB");
    const collection = db.collection('cities');

    updateDocument(collection, updatedCity)
        .then(() => res.send(`Data updated for ${updatedCity.city}, ${updatedCity.state_name}!`));
  });
});

router.post("/upload", upload.single('updateCsv'), function (req, res, next) {
  const buffer = new Buffer(req.file.buffer);
  const readable = new Readable()
  readable._read = () => {} // _read is required but you can noop it
  readable.push(buffer)
  readable.push(null)

  const csvRows = [];
  const errorRows = [];
  readable.pipe(csv())
      .on('data', data => {
        if(isNaN(data.lat) || isNaN(data.lng)) {
          errorRows.push("Latitude/Longitude must be a number!")
        } else {
          csvRows.push(data);
        }
      })
      .on('end', () => {
        client.connect(function(err) {
          const db = client.db("banDB");
          const collection = db.collection('cities');

          csvRows.forEach(rowObject => {
            updateDocument(collection, rowObject)
                .then(() => console.log(`Data updated for ${rowObject.city}, ${rowObject.state_name}!`));
          });
          res.render("upload", { errors: errorRows });
        });
      });
});

module.exports = router;
