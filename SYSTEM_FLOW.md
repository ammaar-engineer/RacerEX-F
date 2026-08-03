# RacerEX-F — System Flow

Dokumen ini menjelaskan bagaimana data mengalir dari definisi route oleh user hingga request HTTP masuk dan diproses.

---

## 🗂️ Struktur Modul

```
src/
├── main.ts                              # RacerEX_FApp — bootstrap entry point
├── modules/
│   ├── app/
│   │   ├── main.ts                      # AppModules — Express app wrapper
│   │   └── middleware/error.middleware.ts
│   └── routes/
│       ├── main.ts                      # Route — config container
│       ├── endpoints/
│       │   ├── http.ts                  # HttpEndpointBuilder
│       │   └── ws.ts                    # WsEndpointBuilder
│       ├── services/
│       │   ├── request.service.ts       # RequestService — req wrapper
│       │   └── response.service.ts      # ResponseService — res wrapper
│       ├── types/
│       │   └── endpoint.config.ts       # EndpointConfig types
│       └── validations/
│           ├── index.ts
│           └── superstruct.guard.ts     # validateBody, validateQuery, dll
├── services/
│   └── express.handler.ts              # registerHttpEndpoint — Express bridge
└── types/
    ├── error.class.ts                   # RacerError
    └── response.output.ts              # ResponseOutput format
```

---

## 🔄 System Flow

### Phase 1: Route Definition (Startup Time)

User mendefinisikan route dan endpoint sebelum server start. Tidak ada Express di sini.

```
User Code
  │
  ├─ RacerEX_F.Route()
  │    └─ new Route()                   → endpoints: [], injected: [], guards: []
  │
  ├─ route.inject(service1, service2)
  │    └─ injectedDependencies.push()   → endpoints: [], injected: [svc1, svc2], guards: []
  │
  ├─ route.guards(isAuthenticated)
  │    └─ globalGuards.push()           → endpoints: [], injected: [...], guards: [isAuth]
  │
  └─ route.http()                        → new HttpEndpointBuilder(route, injected, guards)
       │
       ├─ .config({ method, url })       → builder.cfg = { method: 'post', url: '/login' }
       ├─ .guards(validateBody(Schema))  → builder.endpointGuards = [validateBody]
       ├─ .middleware(logger)            → builder.endpointMiddlewares = [logger]
       └─ .main(handler)                → builds HttpEndpointConfig, calls route.addEndpoint()
            │
            └─ HttpEndpointConfig = {
                 type: 'http',
                 method: 'post',
                 url: '/login',
                 guards: [isAuth, validateBody],   ← merged: route + endpoint guards
                 middlewares: [logger],
                 injected: [svc1, svc2],           ← from route.inject()
                 handler: fn
               }
               → route.endpoints.push(config)
```

**Result:** Route memiliki array `endpoints[]` berisi pure config objects. Tidak ada Express.

---

### Phase 2: Bootstrap (Startup Time)

`bootstrap()` mengambil semua config dari setiap Route dan register ke Express.

```
RacerEX_F.bootstrap(app, [
  { path: '/api', route: userController },
  { path: '/auth', route: authController }
])
  │
  └─ for each { path, route }:
       │
       ├─ const router = Router()             ← Create Express Router
       ├─ const configs = route.getConfigs()  ← Get all EndpointConfigs
       │
       └─ for each config:
            │
            ├─ if config.type === 'http':
            │    registerHttpEndpoint(router, config)
            │      │
            │      └─ router[method](url, ...middlewares, expressHandler)
            │           expressHandler wraps: guards + handler + error forwarding
            │
            └─ if config.type === 'ws':
                 registerWsEndpoint(router, config)

  └─ app.router(path, router)                ← app.use('/api', router)
```

**Result:** Express app siap menerima requests, semua routes ter-register.

---

### Phase 3: Server Start

```
app.port(3000)
  │
  ├─ app.use(errorMiddleware)   ← Error handler di-mount paling akhir
  └─ app.listen(3000)           ← Server mulai listen
```

---

### Phase 4: Request Handling (Runtime)

Request masuk ke-registered Express handler.

```
HTTP Request: POST /api/login
  │
  ├─ Express routes to handler registered at bootstrap
  │
  └─ expressHandler (dari registerHttpEndpoint):
       │
       ├─ new RequestService(req)      ← Wrap Express req
       ├─ new ResponseService(res)     ← Wrap Express res
       │
       ├─ Execute guards (sequential):
       │    for (const guard of config.guards) {
       │      const result = await guard(request, response)
       │      if (result === false || !result.success)
       │        throw new RacerError({ statusCode: 400, ... })
       │    }
       │
       ├─ Execute handler:
       │    await config.handler(request, response, config.injected)
       │      │
       │      ├─ req.getBody<LoginDTO>()        ← Type-safe body access
       │      ├─ req.getParam('id')             ← Route params
       │      ├─ req.getHeader('Authorization') ← Headers
       │      ├─ res.success(data, 'msg', 200)  ← Standard success response
       │      └─ res.error('CODE', 'msg', 400)  ← Standard error response
       │
       └─ catch (error):
            next(error) → errorMiddleware
              │
              └─ if RacerError: res.json({ success: false, statusCode, errorCode, message })
                 else: res.json({ success: false, statusCode: 500, ... })
```

---

## 📐 Data Flow Diagram

```
                        STARTUP TIME
┌─────────────────────────────────────────────────┐
│                                                 │
│  User Code                                      │
│    │                                            │
│    ├── route.inject(services)                   │
│    ├── route.guards(globalGuards)               │
│    └── route.http()                             │
│          └── .config().guards().main()          │
│                │                                │
│                ▼                                │
│         EndpointConfig[]                        │
│     (pure data, no Express)                     │
│                │                                │
│                ▼                                │
│        bootstrap(app, routes)                   │
│                │                                │
│                ▼                                │
│       Express Router registered                 │
│                │                                │
│                ▼                                │
│           app.port(3000)                        │
└─────────────────────────────────────────────────┘

                        RUNTIME
┌─────────────────────────────────────────────────┐
│                                                 │
│  HTTP Request                                   │
│    │                                            │
│    ▼                                            │
│  Express Router                                 │
│    │                                            │
│    ▼                                            │
│  expressHandler                                 │
│    ├── RequestService(req)                      │
│    ├── ResponseService(res)                     │
│    ├── Run guards[]  ──── fail ──► RacerError   │
│    └── Run handler(req, res, injected)          │
│              │                                  │
│              ▼                                  │
│         res.success() / res.error()             │
│              │           │                      │
│              ▼           ▼                      │
│         200 OK       throw RacerError           │
│                           │                     │
│                           ▼                     │
│                    errorMiddleware              │
│                           │                     │
│                           ▼                     │
│                    { success: false, ... }      │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Key Principles

### 1. Decoupled Route Definition
`Route` dan `EndpointBuilder` tidak memiliki Express dependency.
Mereka hanya **collect config** — tidak ada HTTP registration.

### 2. Config as Data
`EndpointConfig` adalah pure data object — bisa di-inspect, di-test, di-serialize
tanpa perlu Express server berjalan.

### 3. Single Registration Point
`bootstrap()` + `registerHttpEndpoint()` adalah **satu-satunya tempat** Express terlibat.
Semua Express routing logic ada di `src/services/express.handler.ts`.

### 4. Guards as Pipeline
Guards dijalankan **secara sequential** sebelum handler. Guard dari level Route
dijalankan lebih dulu, kemudian guard level endpoint.

Order: `[...routeGuards, ...endpointGuards]`

### 5. Dependency Injection via Closure
`injected[]` array diteruskan dari `route.inject()` → `EndpointConfig.injected`
→ `expressHandler` → `handler(req, res, injected)`.

User mengakses via destructuring: `const [svc1, svc2] = injected as [Svc1, Svc2]`

---

## 📦 Key Types

```typescript
// Guard return values
type GuardResult = boolean
    | { success: boolean; message?: string; data?: any }
    | Promise<...>

// HTTP handler signature
type HttpEndpointHandler = (
    req: RequestService,
    res: ResponseService,
    injected: any[]
) => void | Promise<void>

// Stored config (pure data)
interface HttpEndpointConfig {
    type: 'http'
    method: 'get' | 'post' | 'put' | 'patch' | 'delete'
    url: string
    guards: GuardFn[]
    middlewares: RequestHandler[]
    injected: any[]
    handler: HttpEndpointHandler
}

// Standard response format
interface ResponseOutput<D> {
    success: boolean
    statusCode: number
    errorCode: string
    message?: string
    data: D
}
```

---

## 🔗 Related Files

| File | Role |
|------|------|
| `src/main.ts` | `RacerEX_FApp` class, `bootstrap()` method |
| `src/modules/routes/main.ts` | `Route` class — config container |
| `src/modules/routes/endpoints/http.ts` | `HttpEndpointBuilder` — fluent builder |
| `src/modules/routes/types/endpoint.config.ts` | `EndpointConfig` types |
| `src/services/express.handler.ts` | Express registration bridge |
| `src/modules/app/main.ts` | `AppModules` — Express app wrapper |
| `src/modules/routes/services/request.service.ts` | `RequestService` — req wrapper |
| `src/modules/routes/services/response.service.ts` | `ResponseService` — res wrapper |
| `src/sample/auth-sample/` | Real-world modular usage example |
| `docs/ROUTE_ARCHITECTURE.md` | Deep-dive route architecture docs |
