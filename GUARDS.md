# Guards Error Response Behavior

Dokumentasi tentang bagaimana guards menangani error dan format response yang dihasilkan.

## Mekanisme Guards

Guards adalah validation functions yang dijalankan **sebelum** handler endpoint dipanggil. Ketika guard gagal, error akan di-throw dan ditangkap oleh error middleware.

### Guards Execution Flow

```
Request → Express Middleware → Guards Pipeline → Handler → Response
                                    ↓ (failed)
                                Error Middleware → Error Response
```

Guards dijalankan secara **sequential** (satu per satu), bukan parallel. Jika satu guard gagal, guards berikutnya tidak dijalankan.

---

## Custom Guards Return Values

Custom guards dapat return 3 jenis value:

### 1. `true` — Validation Passed
```typescript
const myGuard = (req, res) => {
    if (req.getHeader('Authorization')) {
        return true  // ✅ Pass, lanjut ke guard berikutnya atau handler
    }
}
```

### 2. `false` — Validation Failed (Generic)
```typescript
const myGuard = (req, res) => {
    if (!req.getHeader('Authorization')) {
        return false  // ❌ Fail dengan generic message
    }
}
```

**Error Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "GUARD_FAILED",
  "message": "Validation failed",
  "data": null
}
```

### 3. Object — Validation Failed (Custom Message)
```typescript
const myGuard = (req, res) => {
    if (!req.getHeader('Authorization')) {
        return {
            success: false,
            message: 'Authorization header is required',
            data: { field: 'Authorization' }
        }
    }
}
```

**Error Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "GUARD_FAILED",
  "message": "Authorization header is required",
  "data": { "field": "Authorization" }
}
```

---

## Superstruct Guards Error Response

Superstruct guards (`validateBody`, `validateParams`, `validateQuery`, `validateHeaders`) throw `RacerError` dengan format yang konsisten dengan error middleware.

### Example: Body Validation Error

**Request:**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","name":"John"}'
```

**Schema:**
```typescript
const RegisterSchema = object({
    email: pattern(string(), /^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    password: string(),
    name: string()
})
```

**Error Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "BODY_VALIDATION_FAILED",
  "message": "Expected a string, but received: undefined",
  "data": [
    {
      "path": "password",
      "message": "Expected a string, but received: undefined"
    }
  ]
}
```

### Error Codes by Validation Type

| Guard Function | Error Code | Status Code |
|---------------|------------|-------------|
| `validateBody()` | `BODY_VALIDATION_FAILED` | 400 |
| `validateParams()` | `PARAMS_VALIDATION_FAILED` | 400 |
| `validateQuery()` | `QUERY_VALIDATION_FAILED` | 400 |
| `validateHeaders()` | `HEADERS_VALIDATION_FAILED` | 400 |

### Error Data Structure

Field `data` berisi array error details:
```typescript
{
  path: string,      // Field path (e.g., "email", "user.name")
  message: string    // Superstruct error message
}[]
```

**Example dengan nested object:**
```json
{
  "errorCode": "BODY_VALIDATION_FAILED",
  "message": "Expected a string, but received: undefined",
  "data": [
    {
      "path": "user.email",
      "message": "Expected a string, but received: undefined"
    },
    {
      "path": "settings.theme",
      "message": "Expected one of `\"light\", \"dark\"`, but received: \"auto\""
    }
  ]
}
```

---

## Multiple Guards Stacking

Ketika multiple guards di-register, mereka dijalankan sequential:

```typescript
route.CreateEndpoint({ type: 'http' })
  .guards(
    isAuthenticated,           // 1. Check auth token
    validateBody(UserSchema),  // 2. Validate body
    checkPermission('admin')   // 3. Check permission
  )
  .main(...)
```

**Jika guard #2 gagal:**
- Guard #1 sudah dijalankan (passed)
- Guard #2 throw error → execution stop
- Guard #3 tidak dijalankan
- Error middleware tangkap error dari guard #2

---

## Throwing RacerError Manually

Guards juga bisa throw `RacerError` langsung untuk kontrol penuh:

```typescript
import { RacerError } from './src/main.js'

const myGuard = (req, res) => {
    const token = req.getHeader('Authorization')
    
    if (!token) {
        throw new RacerError({
            statusCode: 401,
            errorCode: 'UNAUTHORIZED',
            message: 'Missing authorization token',
            data: { required: 'Authorization header' }
        })
    }
    
    return true
}
```

**Advantages:**
- Custom `statusCode` (tidak hanya 400)
- Custom `errorCode` (tidak hanya `GUARD_FAILED`)
- Lebih eksplisit

---

## Error Middleware Integration

Semua error dari guards (baik custom guards maupun superstruct guards) ditangani oleh `standardErrorMiddleware`:

```typescript
// src/modules/app/middleware/error.middleware.ts
export function standardErrorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
    const rcfError = err as unknown as ResponseOutput

    const response: ResponseOutput = {
        errorCode: rcfError.errorCode ?? 'INTERNAL_ERROR',
        statusCode: rcfError.statusCode ?? 500,
        message: rcfError.message ?? 'Unexpected internal error',
        success: false,
        data: rcfError.data ?? null
    }

    res.status(response.statusCode).json(response)
}
```

**Konsistensi:** Semua error response mengikuti format `ResponseOutput`:
```typescript
{
  success: boolean
  statusCode: number
  errorCode: string
  message?: string
  data?: any
}
```

---

## Custom Error Handler

Developer bisa override error handler untuk custom format:

```typescript
import type { ErrorRequestHandler } from 'express'

const myErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    // Custom logging
    console.error('API Error:', err)
    
    // Custom format (optional)
    res.status(err.statusCode || 500).json({
        error: err.errorCode || 'UNKNOWN_ERROR',
        msg: err.message,
        timestamp: new Date().toISOString()
    })
}

app.errorHandler(myErrorHandler)
```

---

## Best Practices

1. **Gunakan Superstruct guards untuk validasi data** — error messages lebih jelas dan terstruktur
2. **Custom guards untuk business logic** — auth, permission, rate limiting
3. **Stack guards dari general ke specific** — auth → validation → permission
4. **Return object untuk custom message** — lebih informatif daripada `false`
5. **Throw RacerError untuk custom status code** — misalnya 401 untuk auth, 403 untuk permission

---

## Examples

### Authentication Guard
```typescript
const isAuthenticated = (req, res) => {
    const token = req.getHeader('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
        return { success: false, message: 'Missing authorization token' }
    }
    
    // Verify token logic here
    const valid = verifyToken(token)
    
    if (!valid) {
        throw new RacerError({
            statusCode: 401,
            errorCode: 'INVALID_TOKEN',
            message: 'Token expired or invalid'
        })
    }
    
    return true
}
```

### Permission Guard
```typescript
const requireRole = (role: string) => (req, res) => {
    const userRole = req.getHeader('X-User-Role')
    
    if (userRole !== role) {
        throw new RacerError({
            statusCode: 403,
            errorCode: 'FORBIDDEN',
            message: `This endpoint requires ${role} role`,
            data: { required: role, actual: userRole }
        })
    }
    
    return true
}

// Usage
route.guards(isAuthenticated, requireRole('admin'))
```

### Combined with Superstruct
```typescript
import { validateBody, object, string } from './src/main.js'

const UserSchema = object({
    email: string(),
    password: string()
})

route.CreateEndpoint({ type: 'http' })
  .guards(
    isAuthenticated,              // Custom guard
    validateBody(UserSchema),     // Superstruct guard
    requireRole('admin')          // Custom guard
  )
  .main((req, res) => {
    // All guards passed ✅
  })
```
