# Route Architecture — RacerEX-F

Dokumentasi lengkap tentang **bagaimana route dibuat** dalam RacerEX-F framework.

---

## 🏗️ Architecture Overview

RacerEX-F menggunakan **config-based route architecture** dengan Builder Pattern:

```
User Code (Controller)
    ↓
Route Container (stores configs)
    ↓
EndpointBuilder (HTTP/WS)
    ↓
EndpointConfig (data structure)
    ↓
Bootstrap (registers to Express)
```

**Key Principle:** Route dan EndpointBuilder **tidak punya Express dependency**. Mereka hanya **mengumpulkan configuration**, kemudian `bootstrap()` yang register config tersebut ke Express Router.

---

## 📦 Core Components

### 1. Route Class (`src/modules/routes/main.ts`)

**Container untuk multiple endpoints** dengan support untuk:
- Dependency Injection (DI)
- Global guards
- Endpoint configs storage

```typescript
export class Route {
    private endpoints: EndpointConfig[] = []        // Stores all endpoint configs
    private injectedDependencies: any[] = []        // DI container
    private globalGuards: GuardFn[] = []           // Route-level guards

    inject(...dependencies: any[]): this { ... }   // Add dependencies
    guards(...guardFns: GuardFn[]): this { ... }   // Add global guards
    http(): HttpEndpointBuilder { ... }            // Create HTTP endpoint
    ws(): WsEndpointBuilder { ... }                // Create WS endpoint
    
    addEndpoint(config: EndpointConfig): void { ... }  // Called by builders
    getConfigs(): EndpointConfig[] { ... }             // Called by bootstrap
}
```

**Responsibilities:**
- ✅ Store endpoint configurations
- ✅ Provide DI and guards to builders
- ✅ Expose configs untuk bootstrap
- ❌ NO Express Router
- ❌ NO direct HTTP registration

---

### 2. HttpEndpointBuilder (`src/modules/routes/endpoints/http.ts`)

**Builder pattern untuk construct HTTP endpoint config** step-by-step.

```typescript
export class HttpEndpointBuilder {
    private cfg: HttpConfigInput | null = null
    private endpointGuards: GuardFn[] = []
    private endpointMiddlewares: RequestHandler[] = []

    constructor(
        private route: RouteReceiver,        // Reference to Route
        private injected: any[],             // Inherited from route.inject()
        private controllerGuards: GuardFn[]  // Inherited from route.guards()
    ) {}

    config(cfg: HttpConfigInput): this { ... }        // Set method & url
    guards(...guardFns: GuardFn[]): this { ... }      // Add endpoint-specific guards
    middleware(...middlewares: RequestHandler[]): this { ... }  // Add middlewares
    
    main(handler: HttpEndpointHandler): void {        // Terminal method
        const config: HttpEndpointConfig = {
            type: 'http',
            method: this.cfg.method,
            url: this.cfg.url,
            guards: [...this.controllerGuards, ...this.endpointGuards],
            middlewares: this.endpointMiddlewares,
            injected: this.injected,
            handler
        }
        this.route.addEndpoint(config)  // Push config to Route
    }
}
```

**Fluent API Chain:**
```typescript
route.http()                              // Returns HttpEndpointBuilder
    .config({ method: 'post', url: '/register' })  // Set HTTP config
    .guards(validateBody(Schema))         // Add guards
    .middleware(logger)                   // Add middleware
    .main((req, res, injected) => {       // Terminal: build & store config
        // Handler logic
    })
```

**Responsibilities:**
- ✅ Collect endpoint configuration step-by-step
- ✅ Merge route-level guards + endpoint-level guards
- ✅ Build `HttpEndpointConfig` object
- ✅ Push config ke Route via `addEndpoint()`
- ❌ NO Express Router
- ❌ NO actual HTTP registration

---

### 3. EndpointConfig (`src/modules/routes/types/endpoint.config.ts`)

**Pure data structure** yang menyimpan semua informasi endpoint.

```typescript
export interface BaseEndpointConfig {
    type: 'http' | 'ws'
    url: string
    guards: GuardFn[]
    middlewares: RequestHandler[]
    injected: any[]
}

export interface HttpEndpointConfig extends BaseEndpointConfig {
    type: 'http'
    method: 'get' | 'post' | 'put' | 'patch' | 'delete'
    handler: HttpEndpointHandler
}

export type EndpointConfig = HttpEndpointConfig | WsEndpointConfig
```

**Why config object?**
- ✅ Testable — inspect config without Express
- ✅ Serializable — bisa di-log, di-inspect, di-transform
- ✅ Decoupled — Route tidak tied ke Express
- ✅ Flexible — bisa register ke framework lain (Fastify, Hono, dll)

---

### 4. Bootstrap (`src/main.ts`)

**Bridge antara config dan Express**. Di sinilah config di-convert jadi actual Express routes.

```typescript
export class RacerEX_FApp {
    bootstrap(
        app: AppModules,
        routes: Array<{ path: string; route: Route }>
    ): void {
        for (const { path, route } of routes) {
            const router = Router()                  // Create Express Router
            const configs = route.getConfigs()       // Get all configs from Route

            for (const config of configs) {
                if (config.type === 'http') {
                    registerHttpEndpoint(router, config)  // Register to Express
                } else if (config.type === 'ws') {
                    registerWsEndpoint(router, config)
                }
            }

            app.router(path, router, { type: 'http' })  // Mount router to app
        }
    }
}
```

**What `registerHttpEndpoint()` does:**
```typescript
// src/services/express.handler.ts
export function registerHttpEndpoint(router: Router, config: HttpEndpointConfig): void {
    const { method, url, guards, middlewares, handler, injected } = config

    const expressHandler = async (req: any, res: any, next: any) => {
        try {
            const request = new RequestService(req)
            const response = new ResponseService(res)

            // Execute guards
            for (const guard of guards) {
                const result = await guard(request, response)
                if (result === false || (typeof result === 'object' && !result.success)) {
                    throw new RacerError({ ... })
                }
            }

            // Execute handler
            await handler(request, response, injected)
        } catch (error) {
            next(error)
        }
    }

    router[method](url, ...middlewares, expressHandler)  // Actual Express registration
}
```

**Responsibilities:**
- ✅ Loop through all Route configs
- ✅ Create Express Router for each route
- ✅ Call `registerHttpEndpoint()` untuk setiap config
- ✅ Mount router ke AppModules
- ✅ This is the ONLY place Express is involved

---

## 🔄 Full Flow: Bagaimana Route Dibuat

### Step 1: User membuat Route instance

```typescript
const userController = RacerEX_F.Route()
```

**What happens:**
- `Route` instance dibuat dengan 3 empty arrays:
  - `endpoints: []`
  - `injectedDependencies: []`
  - `globalGuards: []`

---

### Step 2: User inject dependencies (optional)

```typescript
userController.inject(userService, emailService)
```

**What happens:**
```typescript
inject(...dependencies: any[]): this {
    this.injectedDependencies.push(...dependencies)  // [userService, emailService]
    return this
}
```

---

### Step 3: User add global guards (optional)

```typescript
userController.guards(isAuthenticated, hasRole('admin'))
```

**What happens:**
```typescript
guards(...guardFns: GuardFn[]): this {
    this.globalGuards.push(...guardFns)  // [isAuthenticated, hasRole('admin')]
    return this
}
```

---

### Step 4: User create HTTP endpoint

```typescript
userController.http()
    .config({ method: 'post', url: '/register' })
    .guards(validateBody(RegisterSchema))
    .main((req, res, injected) => {
        const [userSvc, emailSvc] = injected as [UserService, EmailService]
        const body = req.getBody<RegisterDTO>()
        const user = userSvc.create(body)
        res.success(user, 'User created', 201)
    })
```

**What happens:**

#### 4.1: `route.http()` creates HttpEndpointBuilder
```typescript
http(): HttpEndpointBuilder {
    return new HttpEndpointBuilder(
        this,                           // Reference to Route
        this.injectedDependencies,      // [userService, emailService]
        this.globalGuards               // [isAuthenticated, hasRole('admin')]
    )
}
```

#### 4.2: `.config()` stores method & url
```typescript
config(cfg: HttpConfigInput): this {
    this.cfg = { method: 'post', url: '/register' }
    return this
}
```

#### 4.3: `.guards()` adds endpoint-specific guard
```typescript
guards(...guardFns: GuardFn[]): this {
    this.endpointGuards.push(validateBody(RegisterSchema))
    return this
}
```

#### 4.4: `.main()` builds config and pushes to Route
```typescript
main(handler: HttpEndpointHandler): void {
    const config: HttpEndpointConfig = {
        type: 'http',
        method: 'post',
        url: '/register',
        guards: [
            isAuthenticated,              // From route.guards()
            hasRole('admin'),             // From route.guards()
            validateBody(RegisterSchema)  // From endpoint.guards()
        ],
        middlewares: [],
        injected: [userService, emailService],  // From route.inject()
        handler: (req, res, injected) => { ... }
    }
    
    this.route.addEndpoint(config)  // Push to Route.endpoints[]
}
```

**Result:** `userController.endpoints` now has 1 config object.

---

### Step 5: Bootstrap registers routes to Express

```typescript
const app = RacerEX_F.App()
app.middleware(express.json())

RacerEX_F.bootstrap(app, [
    { path: '/api', route: userController }
])

app.port(3000)
```

**What happens:**

#### 5.1: `bootstrap()` loops through routes
```typescript
bootstrap(app, routes) {
    for (const { path, route } of routes) {
        const router = Router()              // NEW Express Router
        const configs = route.getConfigs()   // Get all configs
        
        // configs = [
        //   { type: 'http', method: 'post', url: '/register', ... }
        // ]
```

#### 5.2: Register each config to Express
```typescript
        for (const config of configs) {
            if (config.type === 'http') {
                registerHttpEndpoint(router, config)  // Express registration HERE
            }
        }
```

#### 5.3: Mount router to app
```typescript
        app.router(path, router, { type: 'http' })
        // app.use('/api', router)
    }
}
```

#### 5.4: Start server
```typescript
app.port(3000)
// Mounts error handler
// Calls app.listen(3000)
```

---

## 🎯 Key Design Benefits

### 1. **Decoupled dari Express**
```typescript
// Route dan HttpEndpointBuilder tidak import Express
// Mereka hanya data structure

const route = new Route()
route.http()
    .config({ method: 'get', url: '/hello' })
    .main((req, res) => res.success('Hello'))

// Inspect config tanpa Express
const configs = route.getConfigs()
console.log(configs)  // [{ type: 'http', method: 'get', url: '/hello', ... }]
```

### 2. **Testable**
```typescript
// Test route creation tanpa Express server
describe('Route', () => {
    it('should collect endpoint configs', () => {
        const route = new Route()
        route.http()
            .config({ method: 'get', url: '/test' })
            .main((req, res) => {})
        
        const configs = route.getConfigs()
        expect(configs).toHaveLength(1)
        expect(configs[0].url).toBe('/test')
    })
})
```

### 3. **Inspectable**
```typescript
// Debug atau log configs
const configs = route.getConfigs()
configs.forEach(cfg => {
    console.log(`${cfg.method.toUpperCase()} ${cfg.url}`)
    console.log(`  Guards: ${cfg.guards.length}`)
    console.log(`  Injected: ${cfg.injected.length}`)
})
```

### 4. **Flexible Registration**
```typescript
// Bisa register ke framework lain
function registerToFastify(app: FastifyInstance, route: Route) {
    for (const config of route.getConfigs()) {
        app[config.method](config.url, async (req, reply) => {
            // Adapt config to Fastify
        })
    }
}
```

---

## 📝 Summary

### Flow Diagram

```
1. User creates Route
   route = new Route()
   
2. User configures Route (optional)
   route.inject(services...)
   route.guards(guards...)
   
3. User creates endpoints
   route.http()
     .config({ method, url })
     .guards(endpoint-guards...)
     .middleware(middlewares...)
     .main(handler)
   
   → HttpEndpointBuilder builds config
   → Config pushed to route.endpoints[]
   
4. User calls bootstrap
   RacerEX_F.bootstrap(app, [{ path, route }])
   
   → Loop through routes
   → Get configs from each route
   → Register configs to Express Router
   → Mount router to app
   
5. User starts server
   app.port(3000)
```

### Key Takeaways

1. **Route = Config Container** — tidak ada Express logic
2. **HttpEndpointBuilder = Config Builder** — fluent API untuk construct config
3. **EndpointConfig = Pure Data** — serializable, inspectable, testable
4. **Bootstrap = Express Bridge** — satu-satunya tempat Express terlibat
5. **Separation of Concerns** — definition terpisah dari registration

---

## 🔗 Related Files

- `src/modules/routes/main.ts` — Route class
- `src/modules/routes/endpoints/http.ts` — HttpEndpointBuilder
- `src/modules/routes/types/endpoint.config.ts` — Config types
- `src/services/express.handler.ts` — Express registration logic
- `src/main.ts` — Bootstrap implementation
- `src/sample/auth-sample/` — Real-world example

---

**Built with ❤️ by Ammaar-Engineer**
