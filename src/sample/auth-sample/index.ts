import express from 'express'
import RacerEX_F, { RacerEX_F as RacerClass } from '../../main.js'
import { AuthService } from './services/auth.service.js'
import { createAuthController } from './controllers/auth.controller.js'

// === Bootstrap Services ===
const authService = new AuthService()

// === Bootstrap Controllers ===
const authController = createAuthController(authService)

// === Setup App ===
const app = RacerEX_F.App()

app
    .middleware(express.json())
    .middleware(express.urlencoded({ extended: true }))

// === Register Routes ===
RacerClass.bootstrap(app, [
    { path: '/auth', route: authController }
])

// === Start Server ===
app.port(3000)

console.log('\n✅ Auth sample running on http://localhost:3000')
console.log('\nEndpoints:')
console.log('  POST /auth/register   — Create new account')
console.log('  POST /auth/login      — Get auth token')
console.log('  GET  /auth/me         — Get current user (requires Bearer token)')
console.log('  POST /auth/logout     — Invalidate token (requires Bearer token)')
console.log('\nQuick test:')
console.log(`  curl -s -X POST http://localhost:3000/auth/register \\
    -H "Content-Type: application/json" \\
    -d '{"email":"user@example.com","password":"Secret123","name":"John"}' | jq`)
