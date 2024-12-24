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