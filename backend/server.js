// Load environment variables from .env before anything else.
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()
const port = process.env.PORT || 3000
const mongoUri = process.env.MONGODB_URI
const testCollection = process.env.MONGODB_TEST_COLLECTION || 'test'

app.use(express.json())
// Allow browser clients from approved origins to call the API.
app.use(cors({
    origin: (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean),
    credentials: true
}))

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/test', (req, res) => {
    res.send('Testing git workflow')
})

// Quick smoke test to confirm the app can read from MongoDB.
app.get('/db-test', async (req, res) => {
    try {
        const docs = await mongoose.connection.collection(testCollection).find({}).toArray()

        if (!docs.length) {
            return res.status(404).json({ message: 'No documents found', collection: testCollection })
        }

        return res.json({ collection: testCollection, documents: docs, count: docs.length })
    } catch (err) {
        console.error('DB test error:', err)
        return res.status(500).json({ error: 'DB test failed' })
    }
})

// Get all users
app.get('/users', async (req, res) => {
    try {
        const docs = await mongoose.connection.collection("users").find({}).toArray()

        if (!docs.length) {
            return res.status(404).json({ message: 'No users found', collection: "users" })
        }
        return res.json({ collection: "users", document: docs, count: docs.length })
    } catch (err) {
        console.error('DB users error', err)
        return res.status(500).json({ error: 'DB users failed' })
    }
})
// Add a user to the users collection.
app.post('/users', async (req, res) => {
    try {
        const payload = req.body

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return res.status(400).json({ error: 'Invalid user payload' })
        }

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ error: 'User payload is required' })
        }

        if (!payload.sub) {
            return res.status(400).json({ error: 'User payload must include sub' })
        }

        const usersCollection = mongoose.connection.collection('users')
        const existingUser = await usersCollection.findOne({ sub: payload.sub })

        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                user: existingUser
            })
        }

        const result = await usersCollection.insertOne(payload)

        return res.status(201).json({
            id: result.insertedId,
            user: { _id: result.insertedId, ...payload }
        })
    } catch (err) {
        console.error('Create user error:', err)
        return res.status(500).json({ error: 'Failed to create user' })
    }

})

async function start() {
    if (!mongoUri) {
        console.error('MONGODB_URI is required')
        process.exit(1)
    }

    try {
        await mongoose.connect(mongoUri)
        console.log('MongoDB connected')
    } catch (err) {
        console.error('MongoDB connection error:', err)
        process.exit(1)
    }

    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
}

start()
