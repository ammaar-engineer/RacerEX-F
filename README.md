# RacerEX-F

Express.js framework dengan fluent API pattern untuk mempercepat setup dan development backend.

---

## 🚀 Features

- ✅ **Fluent API** — Chaining pattern seperti NestJS untuk define endpoint
- ✅ **Dependency Injection** — Inject services ke controller dengan mudah
- ✅ **Guards System** — Validation pipeline di level controller & endpoint
- ✅ **Request/Response Wrapper** — Type-safe API untuk akses request & response
- ✅ **Error Handling** — Standard error format dengan custom error support
- ✅ **HTTP & WebSocket** — Dual protocol support (WS ready, butuh install library)
- ✅ **TypeScript First** — Full type safety & autocomplete

---

## 📦 Installation

```bash
npm install express cors dotenv
npm install -D typescript tsx @types/express @types/node @types/cors
```

---

## 🎯 Quick Start

```typescript
import RacerEX_F from './src/main.js'
import express from 'express'

// Buat controller
const userController = RacerEX_F.Route()

userController.CreateEndpoint({ type: 'http' })
    .config({ type: 'http', method: 'get', url: '/hello' })
    .main((req, res) => {
        res.success('Hello from RacerEX-F!')
    })

// Setup app
const app = RacerEX_F.App()

app
    .middleware(express.json())
    .router('/api', userController.getRouter(), { type: 'http' })
    .port(3000)

console.log('Server running on http://localhost:3000')
```

Test:
```bash
curl http://localhost:3000/api/hello
```

---

## 📖 Documentation

Lihat [USAGE.md](./USAGE.md) untuk dokumentasi lengkap dengan contoh:
- Request & Response API
- Guards (validation)
- Dependency Injection
- Middleware
- Error Handling
- TypeScript Types
- Complete Examples

---

## 🏗️ Framework Architecture

```
src/
├── main.ts                        # Entry point & exports
├── modules/
│   ├── app/
│   │   ├── main.ts               # AppModules (Express wrapper)
│   │   └── middleware/
│   │       └── error.middleware.ts
│   └── routes/
│       ├── main.ts               # Route class (DI & guards)
│       ├── controller/
│       │   ├── http.ts           # HTTP endpoint builder
│       │   └── ws.ts             # WebSocket endpoint builder
│       └── services/
│           ├── request.service.ts
│           └── response.service.ts
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

userController.CreateEndpoint({ type: 'http' })
  .config({ type: 'http', method: 'post', url: '/register' })
  .guards(validateBody)           // Validation
  .middleware(logger)             // Middleware
  .main((req, res, injected) => { // Handler
    const body = req.getBody<RegisterDTO>()
    res.success(body, 'Registered', 201)
  })
```

### 2. Dependency Injection

```typescript
const userService = { /* ... */ }
const emailService = { /* ... */ }

const route = RacerEX_F.Route()
  .inject(userService, emailService)

route.CreateEndpoint({ type: 'http' })
  .main((req, res, [userSvc, emailSvc]) => {
    // Access injected services via array destructuring
  })
```

### 3. Guards (Validation)

```typescript
const isAuthenticated = (req, res) => {
  const token = req.getHeader('Authorization')
  return token ? true : { success: false, message: 'Unauthorized' }
}

// Global guards untuk semua endpoint
const route = RacerEX_F.Route().guards(isAuthenticated)

// Endpoint-specific guards
route.CreateEndpoint({ type: 'http' })
  .guards(validateId)  // Stacked after global guards
  .main(...)
```

### 4. Error Handling

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

---

## 🚧 Roadmap

- [x] HTTP Endpoint Builder
- [x] Dependency Injection
- [x] Guards System
- [x] Error Handling
- [x] Request/Response Services
- [ ] WebSocket Active (butuh `ws` library)
- [ ] Guards Utilities (common validators)
- [ ] Decorators Support
- [ ] Testing Utilities
- [ ] CLI Generator

---

## 📄 License

MIT

---

## 🤝 Contributing

Contributions are welcome! Lihat issue atau buat pull request.

---

**Built with ❤️ by the RacerEX-F Team**
