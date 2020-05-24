const { MongoClient, ObjectID } = require('mongodb');
const express = require('express');
const router = express.Router();

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
      if (docs !== undefined) {
        console.log(docs);
        console.log(docs.length);
      }
      res.render("find", { cities: docs, searchString: searchString });
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

module.exports = router;
