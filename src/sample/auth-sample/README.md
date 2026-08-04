# Auth Sample - Modular Architecture Example

Contoh implementasi authentication system menggunakan RacerEX-F dengan **module-based architecture**.

## 📁 Structure

```
auth-sample/
├── controllers/
│   └── auth.controller.ts    # Route definitions & handlers
├── services/
│   └── auth.service.ts        # Business logic (user CRUD, sessions)
├── guards/
│   └── auth.guard.ts          # Authentication guard (Bearer token validation)
├── types/
│   ├── user.types.ts          # Domain models & DTOs
│   └── validation.schemas.ts  # Superstruct schemas
├── index.ts                   # Entry point - bootstrap app
└── README.md
```

## 🎯 Architecture Pattern

### 1. **Service Layer** — Business Logic
```typescript
// auth.service.ts
export class AuthService {
    findUserByEmail(email: string): User | undefined { ... }
    createUser(dto: RegisterDTO): User { ... }
    createSession(userId: string): Session { ... }
    verifyPassword(user: User, password: string): boolean { ... }
}
```

### 2. **Controller Layer** — Route Configuration
```typescript
// auth.controller.ts
export function createAuthController(authService: AuthService): Route {
    const route = new Route()
    route.inject(authService)  // DI: inject service
    
    route.http()
        .config({ method: 'post', url: '/register' })
        .guards(validateBody(RegisterSchema))
        .main((req, res, [authSvc]) => {
            // Handler logic
        })
    
    return route
}
```

### 3. **Guard Layer** — Validation & Authorization
```typescript
// auth.guard.ts
export function isAuthenticated(authService: AuthService) {
    return (req: RequestService) => {
        const token = req.getHeader('Authorization')?.slice(7)
        const session = authService.findSessionByToken(token)
        if (!session) throw new RacerError({ ... })
        return true
    }
}
```

### 4. **Bootstrap** — Wire Everything Together
```typescript
// index.ts
const authService = new AuthService()
const authController = createAuthController(authService)

RacerClass.bootstrap(app, [
    { path: '/auth', route: authController }
])

app.port(3000)
```

## 🚀 Run

```bash
npx tsx src/sample/auth-sample/index.ts
```

## 🧪 Test Endpoints

### 1. Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Secret123",
    "name": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2026-08-03T..."
    },
    "token": "hex-token-here",
    "expiresAt": "2026-08-04T..."
  }
}
```

### 2. Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Secret123"
  }'
```

### 3. Get Current User (Protected)
```bash
TOKEN="your-token-here"

curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Logout (Protected)
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## 🧩 Key Framework Features Demonstrated

### ✅ Dependency Injection
```typescript
route.inject(authService)  // Service available in all endpoints
route.http()
    .main((req, res, [authSvc]: [AuthService]) => {
        // Type-safe access to injected service
    })
```

### ✅ Guards System
```typescript
// Superstruct validation
route.http()
    .guards(validateBody(RegisterSchema))
    .main(...)

// Custom authentication guard
route.http()
    .guards(isAuthenticated(authService))
    .main(...)
```

### ✅ Request/Response Services
```typescript
// RequestService — type-safe request access
const body = req.getBody<RegisterDTO>()
const token = req.getHeader('Authorization')
const userId = req.getParam('id')

// ResponseService — standard response format
res.success(data, 'Message', 201)
res.error('ERROR_CODE', 'Message', 400)
```

### ✅ Error Handling
```typescript
throw new RacerError({
    statusCode: 409,
    errorCode: 'USER_EXISTS',
    message: 'User with this email already exists'
})
```

## 📚 Learn More

- Full framework docs: [../../README.md](../../README.md)
- Guards documentation: [../../GUARDS.md](../../GUARDS.md)
- API reference: [../../USAGE.md](../../USAGE.md)

## 🔄 Extending This Sample

### Add a new endpoint
Edit `controllers/auth.controller.ts`:
```typescript
route.http()
    .config({ method: 'patch', url: '/update-profile' })
    .guards(isAuthenticated(authService), validateBody(UpdateProfileSchema))
    .main((req, res, [authSvc]) => {
        // Implementation
    })
```

### Add a new service
Create `services/email.service.ts`, then inject it:
```typescript
const emailService = new EmailService()
const authController = createAuthController(authService, emailService)
```

### Add role-based authorization
Create `guards/roles.guard.ts`:
```typescript
export function hasRole(authService: AuthService, role: string) {
    return (req: RequestService) => {
        const token = req.getHeader('Authorization')?.slice(7)
        const user = authService.getUserByToken(token)
        if (user.role !== role) throw new RacerError({ ... })
        return true
    }
}
```
