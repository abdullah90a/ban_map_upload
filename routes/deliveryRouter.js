const { MongoClient, ObjectID } = require('mongodb');
const { Readable } = require('stream');
const express = require('express');
const csv = require('csv-parser');
const multer = require('multer');
const geolib = require('geolib');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });
const mongoURI = "mongodb://localhost:27017/";

router.get("/customers", async (req, res) => {
    const client = new MongoClient(mongoURI);

    await client.connect((err) => {
        const banDB = client.db("banDB");
        const customerNamesCollection = banDB.collection("customers");

        customerNamesCollection.find()
            .toArray((err, docs) => res.render("customers", { customers: docs }));
    });
});

router.get("/suppliers", async (req, res) => {
    const client = new MongoClient(mongoURI);

    await client.connect((err) => {
        const banDB = client.db("banDB");
        const supplierNamesCollection = banDB.collection("suppliers");

        supplierNamesCollection.find()
            .toArray((err, docs) => res.send({ suppliers: docs.map(supplier => supplier.name) }));
    });
});

router.get("/plan/:customer/:supplier", async (req, res) => {
    const client = new MongoClient(mongoURI);
    const customer = req.params.customer;
    const supplier = req.params.supplier;

    await client.connect(async (err) => {
        const banDB = client.db("banDB");
        const supplierSitesCollection = banDB.collection(supplier);
        const customerSitesCollection = banDB.collection(customer);
        const suppliersMetaCollection = banDB.collection("suppliers");

        await suppliersMetaCollection.find({ name: supplier }).toArray((err, suppliers) => {
            customerSitesCollection.find().toArray((err, customerSites) => {
                supplierSitesCollection.find().toArray((err, supplierSites) => {
                    const costResponse = {}

                    customerSites.forEach(customerSite => {
                        const customerCoords = { latitude: customerSite.lat, longitude: customerSite.lng };
                        const closestSite = supplierSites.map(site => {
                            return {
                                supplier: site,
                                distance: geolib.getDistance(
                                    customerCoords,
                                    { latitude: parseFloat(site.lat), longitude: parseFloat(site.lng)}
                                )
                            };
                        }).sort((a, b) =>
                            a.distance - b.distance
                        )[0];

                        costResponse[customerSite.city] = {
                            from: `${closestSite.supplier.city}, ${closestSite.supplier.state}`,
                            shippingCost: closestSite.distance * suppliers[0].cpm
                        };
                    });

                    res.send(costResponse);
                });
            });
        });
    });
});

const persistSiteData = async (client, typeMetaObject, type, fileBuffer, response) => {
    const banDB = client.db("banDB");
    const cityCollection = banDB.collection("cities");
    const siteCollection = banDB.collection(typeMetaObject.name);

    const typeCollection = banDB.collection(type);
    await typeCollection.updateOne(
        { name: typeMetaObject.name },
        { $set: typeMetaObject },
        { upsert: true }
    );

    const readable = new Readable();
    readable._read = () => {} // _read is required but you can noop it
    readable.pipe(csv())
        .on('data', data => {
            cityCollection.find({"city": data.city, "state_name": data.state})
                .toArray(function (err, docs) {
                    if (docs.length > 0) {
                        data.lat = docs[0].lat;
                        data.lng = docs[0].lng;
                        siteCollection.updateOne(
                            {lat: data.lat, lng: data.lng},
                            {$set: data}, {upsert: true}
                        );
                    }
                });
        })
        .on('end', () => response.send("Upload Complete!"));

    readable.push(new Buffer(fileBuffer));
    readable.push(null);
};

router.post("/uploadCustomerSites", upload.single('customerCSV'), async (req, res) => {
    const client = new MongoClient(mongoURI);

    await client.connect(() =>
        persistSiteData(
            client,
            { name: req.body.customer },
            "customers",
            req.file.buffer,
            res
        )
    );
});

router.post("/uploadSupplierSites", upload.single('supplierCSV'), async (req, res) => {
    const client = new MongoClient(mongoURI);

    await client.connect(() =>
        persistSiteData(
            client,
            {
                name: req.body.supplier,
                cpm: req.body.cpm
            },
            "suppliers",
            req.file.buffer,
            res
        )
    );
});

module.exports = router;