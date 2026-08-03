# RacerEX-F

Express.js framework dengan fluent API pattern untuk mempercepat setup dan development backend.

---

## 🚀 Features

- ✅ **Fluent API** — Chaining pattern seperti NestJS untuk define endpoint
- ✅ **Dependency Injection** — Inject services ke controller dengan mudah
- ✅ **Guards System** — Validation pipeline di level controller & endpoint
- ✅ **Superstruct Integration** — Schema validation dengan error messages yang jelas
- ✅ **Request/Response Wrapper** — Type-safe API untuk akses request & response
- ✅ **Error Handling** — Standard error format dengan custom error support
- ✅ **HTTP & WebSocket** — Dual protocol support (WS ready, butuh install library)
- ✅ **TypeScript First** — Full type safety & autocomplete

---

## 📦 Installation

```bash
npm install express cors dotenv superstruct
npm install -D typescript tsx @types/express @types/node @types/cors
```

---

## 🎯 Quick Start

```typescript
import RacerEX_F, { RacerEX_F as RacerClass } from './src/main.js'
import express from 'express'

// Buat controller
const userController = RacerEX_F.Route()

userController.http()
    .config({ method: 'get', url: '/hello' })
    .main((req, res) => {
        res.success('Hello from RacerEX-F!')
    })

// Setup app & bootstrap
const app = RacerEX_F.App()

app.middleware(express.json())

RacerClass.bootstrap(app, [
    { path: '/api', route: userController }
]).port(3000)
```

Test:
```bash
curl http://localhost:3000/api/hello
```

---

## 📖 Documentation

**Dokumentasi lengkap:**
- [USAGE.md](./USAGE.md) — API reference, examples, patterns
- [GUARDS.md](./GUARDS.md) — Guards system, error handling, custom guards

---

## 🏗️ Framework Architecture

```
src/
├── main.ts                        # Entry point, exports & bootstrap()
├── modules/
│   ├── app/
│   │   ├── main.ts               # AppModules (Express wrapper)
│   │   └── middleware/
│   │       └── error.middleware.ts
│   └── routes/
│       ├── main.ts               # Route class — .http(), .ws(), .inject(), .guards()
│       ├── controller/
│       │   ├── http.ts           # HttpEndpointBuilder
│       │   └── ws.ts             # WsEndpointBuilder
│       ├── services/
│       │   ├── request.service.ts
│       │   └── response.service.ts
│       ├── types/
│       │   └── endpoint.config.ts  # EndpointConfig types
│       └── validations/
│           └── superstruct.guard.ts  # validateBody, validateParams, etc.
├── types/
│   ├── response.output.ts        # Standard response format
│   └── error.class.ts            # RacerError
└── validations/
    └── function.validation.ts
```

---

## 🔥 Core Concepts

### 1. Route & Endpoint Builder

```typescript
const userController = RacerEX_F.Route()

// HTTP endpoint
userController.http()
  .config({ method: 'post', url: '/register' })
  .guards(validateBody(RegisterSchema))
  .middleware(logger)
  .main((req, res, injected) => {
    const body = req.getBody<RegisterDTO>()
    res.success(body, 'Registered', 201)
  })

// WebSocket endpoint
userController.ws()
  .config({ url: '/chat' })
  .main((socket, req) => {
    socket.on('message', (msg) => { ... })
  })
```

### 2. Bootstrap — Centralized Route Registration

```typescript
import RacerEX_F, { RacerEX_F as RacerClass } from './src/main.js'

const app = RacerEX_F.App()

RacerClass.bootstrap(app, [
  { path: '/api/users', route: userController },
  { path: '/api/admin', route: adminController }
]).port(3000)
```

### 3. Dependency Injection

```typescript
const userService = { /* ... */ }
const emailService = { /* ... */ }

const route = RacerEX_F.Route()
  .inject(userService, emailService)

route.http()
  .config({ method: 'post', url: '/user' })
  .main((req, res, [userSvc, emailSvc]) => {
    // Access injected services via array destructuring
  })
```

### 4. Guards (Validation)

**Superstruct validation:**
```typescript
import { validateBody, object, string, number } from './src/main.js'

const UserSchema = object({
  email: string(),
  age: number()
})

route.http()
  .guards(validateBody(UserSchema))
  .main(...)
```

**Custom guards:**
```typescript
import { RacerError } from './src/main.js'

const isAuthenticated = (req, res) => {
  const token = req.getHeader('Authorization')
  if (!token) {
    throw new RacerError({
      statusCode: 401,
      errorCode: 'UNAUTHORIZED',
      message: 'Missing token'
    })
  }
  return true
}

route.guards(isAuthenticated)  // Apply to all endpoints
```

### 5. Error Handling

```typescript
import { RacerError } from './src/main.js'

throw new RacerError({
  statusCode: 404,
  errorCode: 'USER_NOT_FOUND',
  message: 'User tidak ditemukan',
  data: { requestedId: id }
})
```

---

## 🛠️ Development Tools

### Structure Initializer

```bash
node tool/init.structure.js
```

Output file tree dari struktur `src/` secara rekursif.

---

## 📝 Design Philosophy

Framework ini di-design dengan inspirasi dari NestJS untuk:
- **Fleksibilitas** — Tidak kehilangan kemudahan Express.js
- **Type Safety** — Full TypeScript support
- **Developer Experience** — Fluent API yang mudah dibaca & ditulis
- **Modular** — Komponen bisa dipakai terpisah atau gabung
- **Decoupled** — Route hanya data structure, bootstrap yang handle Express

---

## 🚧 Roadmap

- [x] HTTP Endpoint Builder
- [x] WebSocket Endpoint Builder (placeholder)
- [x] Dependency Injection
- [x] Guards System
- [x] Superstruct Validation Guards
- [x] Error Handling (RacerError)
- [x] Request/Response Services
- [x] Config-based Route Architecture
- [x] Centralized bootstrap()
- [x] Complete Auth Example (login/register)
- [ ] WebSocket Active (butuh `ws` library)
- [ ] Decorators Support
- [ ] Testing Utilities
- [ ] CLI Generator

---

## 📄 License

MIT

---

**Built with ❤️ by Ammaar-Engineer**
