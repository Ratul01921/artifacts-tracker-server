const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()

const port = process.env.PORT || 5555
const app = express()

app.use(cors())
app.use(express.json())

// artifactsTrackers
// 4fYp3bxn90ToW4Ih



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.diltr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const artifactsCollection = client.db("artifactTracker").collection("artifacts");


        app.post('/add-artifact', async (req, res) => {
            const artifactData = req.body
            const result = await artifactsCollection.insertOne(artifactData)
            console.log(result)
            res.send(result)
        })

        // get all artifacts data from db
        app.get('/artifacts', async (req, res) => {
            const result = await artifactsCollection.find().toArray()
            res.send(result)
        })

        app.get('/top-artifacts', async (req, res) => {
            const cursor = artifactsCollection.find().sort({ likeCount: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        });

        // get a single artifact data by id from db
        app.get('/artifact/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await artifactsCollection.findOne(query)
            res.send(result)
        })
        app.put('/artifacts/:id', async (req, res) => {
            const { id } = req.params;
            const { likeCount } = req.body;
            const artifact = await artifactsCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { likeCount } }
            );

        });


        // get all artifacts posted by a specific user
        app.get('/artifacts/:email', async (req, res) => {
            const email = req.params.email
            const query = { 'addedBy.email': email }
            const result = await artifactsCollection.find(query).toArray()
            res.send(result)
        })

        // delete a artifact from db
        app.delete('/artifact/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await artifactsCollection.deleteOne(query)
            res.send(result)
        })








        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);







app.get('/', (req, res) => {
    res.send('Hello from artifact server....')
})

app.listen(port, () => console.log(`Server running on port ${port}`))