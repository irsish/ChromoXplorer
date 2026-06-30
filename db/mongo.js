const mongoose = require('mongoose')

let listenersAttached = false

async function init() {
    const mongoUri = process.env.MONGODB_URI

    if (!mongoUri) {
        throw new Error('MONGODB_URI is required')
    }

    if (mongoose.connection.readyState === 1) {
        return mongoose.connection
    }

    try {
        await mongoose.connect(mongoUri)

        if (!listenersAttached) {
            mongoose.connection.on('error', (err) => {
                console.error('MongoDB runtime error:', err)
            })

            mongoose.connection.on('disconnected', () => {
                console.warn('MongoDB disconnected')
            })

            listenersAttached = true
        }

        console.log('MongoDB connected')
        return mongoose.connection
    } catch (err) {
        console.error('MongoDB connection error:', err)
        throw err
    }
}

module.exports = {
    init
}
