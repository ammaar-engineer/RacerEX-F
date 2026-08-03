import RacerEX_F, {
    RacerEX_F as RacerClass,
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

// === Helpers ===
const hashPassword = (p: string) => crypto.createHash('sha256').update(p).digest('hex')
const generateToken = () => crypto.randomBytes(32).toString('hex')

// === In-Memory Database ===
const db = {
    users: [] as User[],
    sessions: [] as Session[],

    findUserByEmail(email: string) {
        return this.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    },
    findUserById(id: string) {
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
    createSession(userId: string): Session {
        const session: Session = {
            token: generateToken(),
            userId,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
        this.sessions.push(session)
        return session
    },
    findSessionByToken(token: string) {
        return this.sessions.find(s => s.token === token && s.expiresAt > new Date())
    },
    deleteSession(token: string) {
        const index = this.sessions.findIndex(s => s.token === token)
        if (index !== -1) this.sessions.splice(index, 1)
        return index !== -1
    }
}

// === Guards ===
const isAuthenticated = (req: any) => {
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

    return true
}

// === Routes ===
const authController = RacerEX_F.Route().inject(db)

authController.http()
    .config({ method: 'post', url: '/register' })
    .guards(validateBody(RegisterSchema))
    .main((req, res, [db]) => {
        const { email, password, name } = req.getBody<{ email: string; password: string; name: string }>()

        if (db.findUserByEmail(email)) {
            throw new RacerError({
                statusCode: 409,
                errorCode: 'USER_EXISTS',
                message: 'User with this email already exists'
            })
        }

        const user = db.createUser(email, password, name)
        const session = db.createSession(user.id)

        res.success({
            user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
            token: session.token,
            expiresAt: session.expiresAt
        }, 'Registration successful', 201)
    })

authController.http()
    .config({ method: 'post', url: '/login' })
    .guards(validateBody(LoginSchema))
    .main((req, res, [db]) => {
        const { email, password } = req.getBody<{ email: string; password: string }>()

        const user = db.findUserByEmail(email)
        if (!user || user.passwordHash !== hashPassword(password)) {
            throw new RacerError({
                statusCode: 401,
                errorCode: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password'
            })
        }

        const session = db.createSession(user.id)

        res.success({
            user: { id: user.id, email: user.email, name: user.name },
            token: session.token,
            expiresAt: session.expiresAt
        }, 'Login successful')
    })

authController.http()
    .config({ method: 'get', url: '/me' })
    .guards(isAuthenticated)
    .main((req, res, [db]) => {
        const token = req.getHeader('Authorization')!.replace('Bearer ', '')
        const session = db.findSessionByToken(token)!
        const user = db.findUserById(session.userId)!

        res.success({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt })
    })

authController.http()
    .config({ method: 'post', url: '/logout' })
    .guards(isAuthenticated)
    .main((req, res, [db]) => {
        const token = req.getHeader('Authorization')!.replace('Bearer ', '')
        db.deleteSession(token)
        res.success(null, 'Logout successful')
    })

// === Setup App ===
const app = RacerEX_F.App()

app.middleware(express.json())

RacerClass.bootstrap(app, [
    { path: '/auth', route: authController }
])

app.port(3000)

console.log('\n✅ Auth server started on http://localhost:3000')
console.log('\nEndpoints:')
console.log('  POST /auth/register')
console.log('  POST /auth/login')
console.log('  GET  /auth/me        (protected)')
console.log('  POST /auth/logout    (protected)\n')
