require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const { init } = require('./db/mongo')
const { setCors } = require('./scripts/set-cors')

// Routers
const usersRouter = require('./routes/users')
const cellsRouter = require('./routes/cells')
const adminRouter       = require('./routes/admin')
const genesRouter            = require('./routes/genes')
const annotationsRouter      = require('./routes/annotations')
const genomicFeaturesRouter  = require('./routes/genomicFeatures')

const app = express()
const port = process.env.PORT || 3000
const testCollection = process.env.MONGODB_TEST_COLLECTION || 'test'

app.use(express.json())
app.use(cors({
  origin: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean),
  credentials: true
}))

app.get('/', (req, res) => res.json({ status: 'ok' }))

app.get('/test', (req, res) => {
  res.send('Testing git workflow')
})

// Quick smoke test to confirm the app can read from MongoDB.
app.get('/db-test', async (req, res) => {
  try {
    const docs = await mongoose.connection.collection(testCollection).find({}).toArray()

    if (!docs.length) {
      return res.status(404).json({
        message: 'No documents found',
        collection: testCollection
      })
    }

    return res.json({
      collection: testCollection,
      documents: docs,
      count: docs.length
    })
  } catch (err) {
    console.error('DB test error:', err)
    return res.status(500).json({ error: 'DB test failed' })
  }
})

// App routes
app.use('/users', usersRouter)
app.use('/cells', cellsRouter)
app.use('/admin',       adminRouter)
app.use('/genes',             genesRouter)
app.use('/annotations',      annotationsRouter)
app.use('/genomic-features', genomicFeaturesRouter)

async function start() {
  try {
    await init()
    await setCors().catch(err => console.warn('CORS setup warning:', err.message))

    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  } catch (err) {
    console.error('Application startup failed:', err)
    process.exit(1)
  }
}

start()