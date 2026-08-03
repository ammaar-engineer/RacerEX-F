import express from 'express'
import RacerEX_F, { RacerEX_F as RacerClass } from '../main.js'

// === Example 1: Simple endpoint ===
const userController = RacerEX_F.Route()

userController.http()
    .config({ method: 'get', url: '/hello' })
    .main((req, res) => {
        res.success('Hello from RacerEX-F!')
    })

userController.http()
    .config({ method: 'get', url: '/user/:id' })
    .main((req, res) => {
        const id = req.getParam('id')
        res.success({ id, name: 'John Doe' }, `User ${id} retrieved`)
    })

// === Example 2: With guards ===
const validateId = (req: any) => {
    const id = req.getParam('id')
    if (!id || isNaN(Number(id))) {
        return { success: false, message: 'Invalid ID format' }
    }
    return true
}

userController.http()
    .config({ method: 'get', url: '/protected/:id' })
    .guards(validateId)
    .main((req, res) => {
        const id = req.getParam('id')
        res.success({ id, protected: true }, 'Protected resource accessed')
    })

// === Example 3: With DI ===
const userService = {
    findById: (id: string) => ({ id, name: 'Jane Doe', email: 'jane@example.com' })
}

const adminController = RacerEX_F.Route()
    .inject(userService)

adminController.http()
    .config({ method: 'get', url: '/admin/user/:id' })
    .main((req, res, [service]) => {
        const id = req.getParam('id')
        const user = service.findById(id)
        res.success(user, 'User found')
    })
adminController.ws()
    .config({ url: '/api'})

// === Example 4: WebSocket (placeholder, requires ws library) ===
const chatController = RacerEX_F.Route()

chatController.ws()
    .config({ url: '/chat' })
    .main((socket, req) => {
        console.log('WS connected (placeholder)')
    })

// === Setup app ===
const app = RacerEX_F.App()

app
    .middleware(express.json())
    .middleware(express.urlencoded({ extended: true }))

RacerClass.bootstrap(app, [
    { path: '/api', route: userController },
    { path: '/api', route: adminController },
    { path: '/ws', route: chatController }
])

app.port(3000)

console.log('\n✅ Server started on http://localhost:3000')
console.log('\nHTTP Endpoints:')
console.log('  GET /api/hello')
console.log('  GET /api/user/:id')
console.log('  GET /api/protected/:id (with guard)')
console.log('  GET /api/admin/user/:id (with DI)')
console.log('\nWebSocket:')
console.log('  WS  /ws/chat (placeholder, install ws to activate)\n')
