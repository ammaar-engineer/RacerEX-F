import RacerEX_F, {
    RacerError,
    validateBody,
    object,
    string,
    size,
    pattern,
    define
} from '../main.js'
import express from 'express'
import crypto from 'crypto'

// === Schemas ===
const PasswordSchema = define<string>('Password', (value) => {
    if (typeof value !== 'string') return false
    // Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
    return value.length >= 8 &&
           /[A-Z]/.test(value) &&
           /[a-z]/.test(value) &&
           /[0-9]/.test(value)
})

const RegisterSchema = object({
    email: pattern(string(), /^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    password: PasswordSchema,
    name: size(string(), 3, 50)
})

const LoginSchema = object({
    email: pattern(string(), /^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    password: string()
})

// === Types ===
interface User {
    id: string
    email: string
    name: string
    passwordHash: string
    createdAt: Date
}

interface Session {
    token: string
    userId: string
    expiresAt: Date
}

// === Helper Functions ===
function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex')
}

function generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
}

// === In-Memory Database (untuk demo) ===
const db = {
    users: [] as User[],
    sessions: [] as Session[],

    // User methods
    findUserByEmail(email: string): User | undefined {
        return this.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    },

    findUserById(id: string): User | undefined {
        return this.users.find(u => u.id === id)
    },

    createUser(email: string, password: string, name: string): User {
        const user: User = {
            id: Date.now().toString(),
            email: email.toLowerCase(),
            name,
            passwordHash: hashPassword(password),
            createdAt: new Date()
        }
        this.users.push(user)
        return user
    },

    // Session methods
    createSession(userId: string): Session {
        const session: Session = {
            token: generateToken(),
            userId,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
        this.sessions.push(session)
        return session
    },

    findSessionByToken(token: string): Session | undefined {
        return this.sessions.find(s => s.token === token && s.expiresAt > new Date())
    },

    deleteSession(token: string): boolean {
        const index = this.sessions.findIndex(s => s.token === token)
        if (index !== -1) {
            this.sessions.splice(index, 1)
            return true
        }
        return false
    }
}

// === Guards ===
const isAuthenticated = (req, res) => {
    const authHeader = req.getHeader('Authorization')

    if (!authHeader) {
        throw new RacerError({
            statusCode: 401,
            errorCode: 'UNAUTHORIZED',
            message: 'Missing authorization header'
        })
    }

    const token = authHeader.replace('Bearer ', '')
    const session = db.findSessionByToken(token)

    if (!session) {
        throw new RacerError({
            statusCode: 401,
            errorCode: 'INVALID_TOKEN',
            message: 'Invalid or expired token'
        })
    }

    // Store user info in request for handler to use
    // (This is a workaround since we can't modify req object directly)
    return true
}

// === Routes ===
const authController = RacerEX_F.Route().inject(db)

// Register endpoint
authController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'post', url: '/register' })
    .guards(validateBody(RegisterSchema))
    .main((req, res, [db]) => {
        const { email, password, name } = req.getBody<{
            email: string
            password: string
            name: string
        }>()

        // Check if user already exists
        const existingUser = db.findUserByEmail(email)
        if (existingUser) {
            throw new RacerError({
                statusCode: 409,
                errorCode: 'USER_EXISTS',
                message: 'User with this email already exists',
                data: { email }
            })
        }

        // Create user
        const user = db.createUser(email, password, name)

        // Create session
        const session = db.createSession(user.id)

        res.success({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt
            },
            token: session.token,
            expiresAt: session.expiresAt
        }, 'Registration successful', 201)
    })

// Login endpoint
authController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'post', url: '/login' })
    .guards(validateBody(LoginSchema))
    .main((req, res, [db]) => {
        const { email, password } = req.getBody<{
            email: string
            password: string
        }>()

        // Find user
        const user = db.findUserByEmail(email)
        if (!user) {
            throw new RacerError({
                statusCode: 401,
                errorCode: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password'
            })
        }

        // Verify password
        const passwordHash = hashPassword(password)
        if (user.passwordHash !== passwordHash) {
            throw new RacerError({
                statusCode: 401,
                errorCode: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password'
            })
        }

        // Create session
        const session = db.createSession(user.id)

        res.success({
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token: session.token,
            expiresAt: session.expiresAt
        }, 'Login successful')
    })

// Get current user (protected)
authController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'get', url: '/me' })
    .guards(isAuthenticated)
    .main((req, res, [db]) => {
        const authHeader = req.getHeader('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        const session = db.findSessionByToken(token)!
        const user = db.findUserById(session.userId)!

        res.success({
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        })
    })

// Logout endpoint (protected)
authController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'post', url: '/logout' })
    .guards(isAuthenticated)
    .main((req, res, [db]) => {
        const authHeader = req.getHeader('Authorization')!
        const token = authHeader.replace('Bearer ', '')

        db.deleteSession(token)

        res.success(null, 'Logout successful')
    })

// === Setup App ===
const app = RacerEX_F.App()

app
    .middleware(express.json())
    .router('/auth', authController.getRouter(), { type: 'http' })
    .port(3000)

console.log('\n✅ Auth server started on http://localhost:3000')
console.log('\nEndpoints:')
console.log('  POST /auth/register  - Register new user')
console.log('  POST /auth/login     - Login user')
console.log('  GET  /auth/me        - Get current user (protected)')
console.log('  POST /auth/logout    - Logout (protected)')
console.log('\n📝 Test commands:')
console.log('\n1. Register:')
console.log('curl -X POST http://localhost:3000/auth/register \\')
console.log('  -H "Content-Type: application/json" \\')
console.log('  -d \'{"email":"user@example.com","password":"Secret123","name":"John Doe"}\'')
console.log('\n2. Login:')
console.log('curl -X POST http://localhost:3000/auth/login \\')
console.log('  -H "Content-Type: application/json" \\')
console.log('  -d \'{"email":"user@example.com","password":"Secret123"}\'')
console.log('\n3. Get current user (use token from login):')
console.log('curl http://localhost:3000/auth/me \\')
console.log('  -H "Authorization: Bearer <token>"')
console.log('\n4. Logout:')
console.log('curl -X POST http://localhost:3000/auth/logout \\')
console.log('  -H "Authorization: Bearer <token>"')
console.log('\n')
