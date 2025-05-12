const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()

const port = process.env.PORT || 5666
const app = express()

app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://artifacts-tracker-84d4a.web.app',
        'https://artifacts-tracker-84d4a.firebaseapp.com',
        'https://artifacts-tracker-server.vercel.app'

    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser());


const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    if (!token) {
        return res.status(401).send({ message: 'unAuthorized access' })
    }

    jwt.verify(token, process.env.JWT_SECRETE, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
}

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

        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRETE, { expiresIn: '1h' });
            res
                .cookie('token', token, {
                    httpOnly: true,
                    // secure: false,
                    secure: process.env.NODE_ENV === "production" ? true : false,
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                })


                .send({ success: true })
        })
        app.post('/logout', (req, res) => {
            res
                .clearCookie('token', {
                    httpOnly: true,
                    // secure: false,
                    secure: process.env.NODE_ENV === "production" ? true : false,
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                })
                .send({ success: true })
        })

        // artifacts related
        app.post('/add-artifact', async (req, res) => {
            const artifactData = req.body
            const result = await artifactsCollection.insertOne(artifactData)
            console.log(result)
            res.send(result)
        })

        app.get('/artifacts', async (req, res) => {
            const searchQuery = req.query.search || '';

            const result = await artifactsCollection
                .find({
                    artifactName: { $regex: searchQuery, $options: 'i' }
                })
                .toArray();
            res.send(result);

        });

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
            const { likeCount, likedBy } = req.body;
            const artifact = await artifactsCollection.updateOne(
                { _id: new ObjectId(id) },
                {
                    $set: { likeCount: likeCount },
                    $addToSet: { likedBy: { $each: likedBy } },
                }
            );

        });
        app.get('/artifacts/likes/:email', async (req, res) => {
            const { email } = req.params;
            const artifacts = await artifactsCollection.find({ likedBy: email }).toArray();
            res.status(200).json(artifacts);
        });

        app.get('/artifacts/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            const query = { 'addedBy.email': email }
            if (req.user.email !== req.params.email) {
                return res.status(403).send({ message: 'forbidden access' });
            }

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

        // save a jobData in db
        app.put('/update-artifact/:id', async (req, res) => {
            const id = req.params.id
            const artifactData = req.body
            const updated = {
                $set: artifactData,
            }
            const query = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const result = await artifactsCollection.updateOne(query, updated, options)
            console.log(result)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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