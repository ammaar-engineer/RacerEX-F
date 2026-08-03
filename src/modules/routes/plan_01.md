# Plan: Implement Route System untuk RacerEX-F

## Context

Framework RacerEX-F membutuhkan sistem Route yang menjadi core dari framework ini. Berdasarkan dev story di `src/sample/design.v1.md`, user ingin membuat fluent/chaining API pattern seperti NestJS yang memudahkan developer mendefinisikan endpoint dengan fitur:

- Dependency injection via `.inject()`
- Guards (validation) di level controller dan endpoint
- Middleware per-endpoint
- Support dual protocol: HTTP REST dan WebSocket
- Type-safe request handling

Saat ini sudah ada:
- ✅ `AppModules` di `src/modules/app/main.ts` dengan method `.router(path, router, {type})` yang sudah support type 'http' | 'ws'
- ✅ Error handling system (`RacerError`, `standardErrorMiddleware`)
- ✅ Type definitions (`ResponseOutput<T>`, `FunctionValidation`)

Yang perlu dibangun:
- Route class dengan builder pattern
- HTTP controller implementation
- Integration dengan Express Router

## Target API (dari design.v1.md)

```typescript
const UserController = new RacerEX_F.Route()
  .inject(userService, tokenValidation)  // DI di level controller
  .guards(isValidHuman)                   // Guards global

UserController.CreateEndpoint()
  .config({ type: 'REST', method: 'post', url: 'register' })
  .guards(GetUserBodyDTO)      // Validation spesifik endpoint
  .middleware(loggerRegister)  // Middleware spesifik endpoint
  .main(async (rcf, injectedModule) => {
    const email = rcf.getRequest<GetUserBodyDTO>().email
    // Business logic
  })
```

## Implementation Plan

### 1. Route Base Class (`src/modules/routes/main.ts`)

**Responsibilities:**
- Container untuk multiple endpoints
- Manage dependency injection di level controller
- Manage guards global
- Factory method `CreateEndpoint()` yang return HTTP atau WS endpoint builder

**Key methods:**
```typescript
class Route {
  inject(...dependencies: any[]): this
  guards(...guardFns: Function[]): this
  CreateEndpoint(): EndpointBuilder
  getRouter(): Router  // Return Express Router untuk integration
}
```

**Implementation notes:**
- Store injected dependencies dalam private array
- Store global guards dalam private array
- Pass dependencies & guards ke setiap endpoint yang dibuat
- CreateEndpoint() akan return instance dari `HttpEndpointBuilder`

### 2. RacerContext (RCF) (`src/types/racer.context.ts`)

**Purpose:** Wrapper untuk Express Request/Response dengan type-safe API

```typescript
class RacerContext<T = any> {
  constructor(private req: Request, private res: Response)
  
  getRequest<DTO = T>(): DTO & Request
  getResponse(): Response
  json<D>(data: ResponseOutput<D>): void
  getParam(key: string): string
  getQuery(key: string): string
  getBody<B = T>(): B
}
```

**Why:** Abstraksi ini memudahkan testing dan memberikan API yang lebih clean dibanding raw Express req/res.

### 3. HTTP Endpoint Builder (`src/modules/routes/controller/http.ts`)

**Responsibilities:**
- Builder pattern untuk konfigurasi endpoint HTTP
- Chain guards, middleware, config
- Register route ke Express Router

**Key methods:**
```typescript
class HttpEndpointBuilder {
  config(cfg: { type: 'REST', method: HttpMethod, url: string }): this
  guards(...guardFns: Function[]): this
  middleware(...middlewares: RequestHandler[]): this
  main(handler: EndpointHandler): void  // Terminal method
}

type EndpointHandler = (
  rcf: RacerContext,
  injectedModules: any[]
) => Promise<void> | void
```

**Implementation flow:**
1. `.config()` — simpan method & url
2. `.guards()` — merge dengan guards dari controller
3. `.middleware()` — simpan middleware list
4. `.main()` — buat Express handler yang:
   - Jalankan guards (jika error, throw RacerError)
   - Jalankan middleware chain
   - Wrap req/res ke RacerContext
   - Call user handler dengan (rcf, injectedModules)
   - Handle error dengan next(error)

### 4. Guards System (`src/validations/guards.ts`)

**Purpose:** Execute validation functions dan throw error jika gagal

```typescript
async function executeGuards(
  guards: Function[],
  req: Request,
  res: Response
): Promise<void> {
  for (const guard of guards) {
    const result = await guard(req, res)
    if (result === false || result?.success === false) {
      throw new RacerError({
        statusCode: 400,
        errorCode: 'VALIDATION_FAILED',
        message: result?.message ?? 'Validation failed',
        data: result?.data
      })
    }
  }
}
```

**Notes:**
- Guards return `boolean | { success: boolean, message?: string, data?: any }`
- Dijalankan sequentially (bukan parallel)
- First failed guard throws error immediately

### 5. Integration dengan AppModules

**Update di `src/main.ts`:**
```typescript
export class RacerEX_F {
  Route() {
    return new Route()
  }
  
  App() {
    return new AppModules()
  }
}

export default new RacerEX_F()
```

**Usage:**
```typescript
import RacerEX_F from './main.js'

const app = RacerEX_F.App()
const userController = RacerEX_F.Route()

// Define endpoints...

app.router('/api/users', userController.getRouter(), { type: 'http' })
app.port(3000)
```

## Critical Files to Modify/Create

**Create:**
- `src/modules/routes/main.ts` — Route class
- `src/modules/routes/controller/http.ts` — HttpEndpointBuilder
- `src/types/racer.context.ts` — RacerContext wrapper
- `src/validations/guards.ts` — Guards execution logic

**Modify:**
- `src/main.ts` — Export RacerEX_F dengan Route() dan App()

**Reuse existing:**
- `src/types/error.class.ts` — RacerError untuk validation errors
- `src/types/response.output.ts` — ResponseOutput<T> type
- `src/validations/function.validation.ts` — FunctionValidation utility

## WebSocket Support (Future)

Untuk sekarang fokus ke HTTP dulu. WebSocket akan diimplementasi di `src/modules/routes/controller/ws.ts` dengan pattern serupa tapi:
- Skip guards (sesuai comment di design.v1.md line 27)
- Middleware tetap jalan
- Handler receive WebSocket connection, bukan rcf

## Verification

**Test 1: Basic endpoint**
```typescript
const router = RacerEX_F.Route()
router.CreateEndpoint()
  .config({ type: 'REST', method: 'get', url: '/hello' })
  .main((rcf) => {
    rcf.json({ success: true, statusCode: 200, errorCode: '', data: 'Hello' })
  })

const app = RacerEX_F.App()
app.router('/api', router.getRouter(), { type: 'http' })
app.port(3000)
```
Test: `curl http://localhost:3000/api/hello`

**Test 2: With guards**
```typescript
const validateId = (req: Request) => {
  if (!req.params.id) {
    return { success: false, message: 'ID required' }
  }
  return true
}

router.CreateEndpoint()
  .config({ type: 'REST', method: 'get', url: '/user/:id' })
  .guards(validateId)
  .main((rcf) => {
    const id = rcf.getParam('id')
    rcf.json({ success: true, statusCode: 200, errorCode: '', data: { id } })
  })
```
Test: `curl http://localhost:3000/api/user/123` (success)
Test: `curl http://localhost:3000/api/user/` (validation error)

**Test 3: With dependency injection**
```typescript
const userService = { findById: (id: string) => ({ id, name: 'John' }) }

const router = RacerEX_F.Route()
  .inject(userService)

router.CreateEndpoint()
  .config({ type: 'REST', method: 'get', url: '/user/:id' })
  .main((rcf, [service]) => {
    const user = service.findById(rcf.getParam('id'))
    rcf.json({ success: true, statusCode: 200, errorCode: '', data: user })
  })
```

**Type checking:**
```bash
npx tsc --noEmit
```

All files should compile without errors.
