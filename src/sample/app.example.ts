import { AppModules } from './modules/app/main.js'
import { RacerError } from './types/error.class.js'
import type { ErrorRequestHandler } from 'express'
import express from 'express'

// ===== Example 1: Basic usage dengan standard error handler =====
const app1 = new AppModules()

app1
    .middleware(express.json())
    .middleware(express.urlencoded({ extended: true }))
    .port(3000)

// ===== Example 2: Custom error handler =====
const app2 = new AppModules()

const customErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error('Custom error caught:', err)

    res.status(500).json({
        error: 'Something went wrong!',
        timestamp: new Date().toISOString()
    })
}

app2
    .middleware(express.json())
    .errorHandler(customErrorHandler)
    .port(3001)

// ===== Example 3: Throw RacerError dari route =====
const app3 = new AppModules()
const router = express.Router()

router.get('/user/:id', async (req, res, next) => {
    try {
        const userId = req.params.id

        if (userId === 'invalid') {
            throw new RacerError({
                statusCode: 404,
                errorCode: 'USER_NOT_FOUND',
                message: 'User tidak ditemukan'
            })
        }

        res.json({ success: true, data: { id: userId, name: 'John' } })
    } catch (error) {
        next(error) // Forward ke error handler
    }
})

app3
    .middleware(express.json())
    .router('/api', router)
    .port(3002)
