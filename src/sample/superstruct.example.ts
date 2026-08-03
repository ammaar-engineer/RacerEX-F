import RacerEX_F, { RacerEX_F as RacerClass, validateBody, validateParams, object, string, number, optional, pattern } from '../main.js'
import express from 'express'

// === Define Schemas ===
const RegisterSchema = object({
    email: pattern(string(), /^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    password: string(),
    name: string(),
    age: number()
})

const UpdateUserSchema = object({
    name: optional(string()),
    age: optional(number())
})

const UserIdSchema = object({
    id: pattern(string(), /^[0-9]+$/)
})

// === Services ===
const userService = {
    users: [] as any[],
    create(data: any) {
        const user = { id: Date.now().toString(), ...data }
        this.users.push(user)
        return user
    },
    findById(id: string) {
        return this.users.find(u => u.id === id)
    },
    update(id: string, data: any) {
        const user = this.findById(id)
        if (user) Object.assign(user, data)
        return user
    }
}

// === Routes ===
const userController = RacerEX_F.Route().inject(userService)

userController.http()
    .config({ method: 'post', url: '/register' })
    .guards(validateBody(RegisterSchema))
    .main((req, res, [service]) => {
        const body = req.getBody()
        const user = service.create(body)
        res.success(user, 'User registered successfully', 201)
    })

userController.http()
    .config({ method: 'get', url: '/user/:id' })
    .guards(validateParams(UserIdSchema))
    .main((req, res, [service]) => {
        const id = req.getParam('id')
        const user = service.findById(id)
        if (!user) return res.error('USER_NOT_FOUND', 'User not found', 404)
        res.success(user)
    })

userController.http()
    .config({ method: 'patch', url: '/user/:id' })
    .guards(
        validateParams(UserIdSchema),
        validateBody(UpdateUserSchema)
    )
    .main((req, res, [service]) => {
        const id = req.getParam('id')
        const body = req.getBody()
        const user = service.update(id, body)
        if (!user) return res.error('USER_NOT_FOUND', 'User not found', 404)
        res.success(user, 'User updated')
    })

// === Setup App ===
const app = RacerEX_F.App()

app.middleware(express.json())

RacerClass.bootstrap(app, [
    { path: '/api', route: userController }
])

app.port(3000)

console.log('\n✅ Server started with Superstruct validation')
console.log('\nTest commands:')
console.log('  curl -X POST http://localhost:3000/api/register \\')
console.log('    -H "Content-Type: application/json" \\')
console.log('    -d \'{"email":"user@example.com","password":"secret","name":"John","age":25}\'')
