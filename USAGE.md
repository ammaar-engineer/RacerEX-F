# RacerEX-F — Quick Start Guide

Framework ExpressJS dengan fluent API pattern yang mempercepat development backend.

## Installation

```bash
npm install express cors dotenv
npm install -D typescript tsx @types/express @types/node @types/cors
```

## Basic Usage

### 1. Import Framework

```typescript
import RacerEX_F from './src/main.js'
import express from 'express'
```

### 2. Buat Route Controller

```typescript
const userController = RacerEX_F.Route()

userController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'get', url: '/users' })
    .main((req, res) => {
        res.success([
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' }
        ], 'Users fetched')
    })

userController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'get', url: '/user/:id' })
    .main((req, res) => {
        const id = req.getParam('id')
        res.success({ id, name: 'Alice' })
    })
```

### 3. Setup App & Start Server

```typescript
const app = RacerEX_F.App()

app
    .middleware(express.json())
    .middleware(express.urlencoded({ extended: true }))
    .router('/api', userController.getRouter(), { type: 'http' })
    .port(3000)

console.log('Server running on http://localhost:3000')
```

---

## Features

### Request Service

Access request data dengan API yang clean:

```typescript
.main((req, res) => {
    // Route params
    const id = req.getParam('id')              // /user/:id
    const params = req.getParams()             // all params
    
    // Query params
    const page = req.getQuery('page')          // ?page=1
    const queries = req.getQueries()           // all queries
    
    // Body
    const body = req.getBody<UserDTO>()        // typed body
    
    // Headers
    const auth = req.getHeader('Authorization')
    const headers = req.getHeaders()
    
    // Other
    const method = req.getMethod()             // GET, POST, etc
    const path = req.getPath()
    const ip = req.getIp()
})
```

### Response Service

Send response dengan berbagai format:

```typescript
.main((req, res) => {
    // Success response (shorthand)
    res.success({ id: 1, name: 'Alice' }, 'User found', 200)
    
    // Error response (shorthand)
    res.error('USER_NOT_FOUND', 'User tidak ditemukan', 404)
    
    // Full JSON response
    res.json({
        success: true,
        statusCode: 200,
        errorCode: '',
        message: 'Success',
        data: { id: 1 }
    })
    
    // Set headers
    res.setHeader('X-Custom', 'value')
    res.setHeaders({ 'X-A': 'a', 'X-B': 'b' })
    
    // Redirect
    res.redirect('/login', 302)
    
    // File download
    res.download('/path/to/file.pdf', 'filename.pdf')
})
```

### Guards (Validation)

Validasi request sebelum masuk handler:

```typescript
// Define guard function
const validateId = (req, res) => {
    const id = req.getParam('id')
    if (!id || isNaN(Number(id))) {
        return { success: false, message: 'Invalid ID format' }
    }
    return true  // passed
}

const isAuthenticated = async (req, res) => {
    const token = req.getHeader('Authorization')
    if (!token) {
        return { success: false, message: 'Unauthorized', data: { code: 401 } }
    }
    return true
}

// Global guards (apply to all endpoints)
const userController = RacerEX_F.Route()
    .guards(isAuthenticated)

// Endpoint-specific guards
userController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'delete', url: '/user/:id' })
    .guards(validateId)  // stacked after global guards
    .main((req, res) => {
        res.success(null, 'User deleted')
    })
```

**Guard return values:**
- `true` — validation passed
- `false` — validation failed (generic message)
- `{ success: false, message: '...', data?: any }` — failed with detail

### Dependency Injection

Inject services ke dalam controller:

```typescript
// Define services
const userService = {
    findById: (id: string) => ({ id, name: 'Alice', email: 'alice@example.com' }),
    create: (data: any) => ({ id: '123', ...data })
}

const emailService = {
    send: (to: string, subject: string) => console.log(`Email sent to ${to}`)
}

// Inject into controller
const userController = RacerEX_F.Route()
    .inject(userService, emailService)

// Access in handlers via third parameter (array)
userController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'post', url: '/user' })
    .main((req, res, [userSvc, emailSvc]) => {
        const body = req.getBody()
        const user = userSvc.create(body)
        emailSvc.send(user.email, 'Welcome!')
        res.success(user, 'User created', 201)
    })
```

**Array destructuring:** services di-inject dalam urutan yang sama dengan `.inject()`.

### Middleware

Register middleware per-endpoint:

```typescript
import type { RequestHandler } from 'express'

const logger: RequestHandler = (req, res, next) => {
    console.log(`${req.method} ${req.path}`)
    next()
}

const timer: RequestHandler = (req, res, next) => {
    const start = Date.now()
    res.on('finish', () => {
        console.log(`Duration: ${Date.now() - start}ms`)
    })
    next()
}

userController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'get', url: '/slow' })
    .middleware(logger, timer)  // specific to this endpoint
    .main((req, res) => {
        setTimeout(() => res.success('Done'), 1000)
    })
```

**Global middleware** di-register via `app.middleware()` sebelum routing.

### Error Handling

Throw custom error dengan `RacerError`:

```typescript
import { RacerError } from './src/main.js'

userController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'get', url: '/user/:id' })
    .main((req, res, [userSvc]) => {
        const id = req.getParam('id')
        const user = userSvc.findById(id)
        
        if (!user) {
            throw new RacerError({
                statusCode: 404,
                errorCode: 'USER_NOT_FOUND',
                message: 'User tidak ditemukan',
                data: { requestedId: id }
            })
        }
        
        res.success(user)
    })
```

Error akan ditangkap oleh standard error middleware dan dikembalikan sebagai:
```json
{
  "success": false,
  "statusCode": 404,
  "errorCode": "USER_NOT_FOUND",
  "message": "User tidak ditemukan",
  "data": { "requestedId": "123" }
}
```

**Custom error handler:**
```typescript
import type { ErrorRequestHandler } from 'express'

const myErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error('Error:', err)
    res.status(500).json({ error: 'Custom error format' })
}

app.errorHandler(myErrorHandler)
```

### TypeScript Types

```typescript
import type {
    HttpEndpointHandler,
    HttpEndpointConfig,
    GuardFn,
    ResponseOutput
} from './src/main.js'

// Type handler
const myHandler: HttpEndpointHandler = (req, res, injected) => {
    res.success('typed')
}

// Type guard
const myGuard: GuardFn = (req, res) => {
    return req.getParam('id') ? true : false
}

// Type response
interface User {
    id: string
    name: string
}

const response: ResponseOutput<User> = {
    success: true,
    statusCode: 200,
    errorCode: '',
    data: { id: '1', name: 'Alice' }
}
```

---

## Complete Example

```typescript
import RacerEX_F, { RacerError } from './src/main.js'
import express from 'express'
import cors from 'cors'

// Services
const db = {
    users: [
        { id: '1', name: 'Alice', email: 'alice@example.com' },
        { id: '2', name: 'Bob', email: 'bob@example.com' }
    ],
    findById: function(id: string) {
        return this.users.find(u => u.id === id)
    }
}

// Guards
const isAuth = (req, res) => {
    const token = req.getHeader('Authorization')
    return token ? true : { success: false, message: 'Unauthorized' }
}

// Routes
const userController = RacerEX_F.Route()
    .inject(db)
    .guards(isAuth)

userController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'get', url: '/users' })
    .main((req, res, [db]) => {
        res.success(db.users, 'Users fetched')
    })

userController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'get', url: '/user/:id' })
    .main((req, res, [db]) => {
        const id = req.getParam('id')
        const user = db.findById(id)
        
        if (!user) {
            throw new RacerError({
                statusCode: 404,
                errorCode: 'USER_NOT_FOUND',
                message: `User ${id} not found`
            })
        }
        
        res.success(user)
    })

// App setup
const app = RacerEX_F.App()

app
    .middleware(cors())
    .middleware(express.json())
    .router('/api', userController.getRouter(), { type: 'http' })
    .port(3000)

console.log('Server: http://localhost:3000')
console.log('Endpoints:')
console.log('  GET /api/users')
console.log('  GET /api/user/:id')
```

**Test:**
```bash
# Success
curl -H "Authorization: Bearer token" http://localhost:3000/api/users

# Error (missing auth)
curl http://localhost:3000/api/users

# Error (not found)
curl -H "Authorization: Bearer token" http://localhost:3000/api/user/999
```

---

## WebSocket Support (Coming Soon)

```typescript
// Placeholder (requires ws library installation)
const chatController = RacerEX_F.Route()

chatController.CreateEndpoint({ type: 'ws' })
    .config({ type: 'ws', url: '/chat' })
    .main((socket, req) => {
        socket.on('message', (msg) => {
            socket.send(`Echo: ${msg}`)
        })
    })

app.router('/ws', chatController.getRouter(), { type: 'ws' })
```

---

## Project Structure Recommendation

```
project/
├── src/
│   ├── modules/
│   │   ├── user/
│   │   │   ├── controllers/
│   │   │   │   └── user.controller.ts
│   │   │   ├── services/
│   │   │   │   └── user.service.ts
│   │   │   ├── guards/
│   │   │   │   └── user.guards.ts
│   │   │   └── dto/
│   │   │       └── user.dto.ts
│   │   └── auth/
│   │       └── ...
│   ├── middleware/
│   │   └── logger.ts
│   └── main.ts
├── package.json
└── tsconfig.json
```

Happy coding with RacerEX-F! 🚀
