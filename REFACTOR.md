# Refactor: Config-Based Route Architecture

## Overview

Refactor besar pada `src/modules/routes/` untuk memisahkan Route dari Express dependency. Route hanya menjadi **data structure** yang menyimpan config endpoint, sedangkan `RacerEX_F.bootstrap()` yang bertanggung jawab register ke Express.

---

## Motivasi

**Problem sekarang:** Route class langsung create dan register endpoint ke Express Router internal — coupling erat dengan Express dan sulit untuk testing/mocking.

**Solusi:** Route hanya kumpulkan config, `bootstrap()` yang handle Express registration.

---

## New API

```typescript
const app = RacerEX_F.App()
const userController = RacerEX_F.Route().inject(userService)
const adminController = RacerEX_F.Route().inject(adminService)

userController.CreateEndpoint({ type: 'http' })
  .config({ type: 'http', method: 'get', url: '/hello' })
  .main((req, res) => res.success('Hello'))

RacerEX_F.bootstrap(app, [
  { path: '/api/users', route: userController },
  { path: '/api/admin', route: adminController }
]).port(3000)
```

---

## Architecture Changes

### Before
```
Route
  └── private router: Router   ← Express dep disini
  └── getRouter()              ← Expose router ke user

HttpEndpointBuilder
  └── constructor(router, ...) ← Receive router
  └── main() → router[method](url, handler)  ← Direct registration
```

### After
```
Route
  └── private endpoints: EndpointConfig[]  ← Hanya data
  └── addEndpoint(config)                  ← Internal
  └── getConfigs()                         ← Expose configs

HttpEndpointBuilder
  └── constructor(route, ...)  ← Receive Route instance
  └── main() → route.addEndpoint(config)   ← Push config only

RacerEX_F.bootstrap()
  └── Loop routes
  └── Create Express Router per route
  └── Register handlers
  └── Mount to app
```

---

## Files to Create

| File | Keterangan |
|------|-----------|
| `src/modules/routes/types/endpoint.config.ts` | EndpointConfig types (BaseEndpointConfig, HttpEndpointConfig, WsEndpointConfig) |

## Files to Modify

| File | Perubahan |
|------|-----------|
| `src/modules/routes/main.ts` | Remove Express Router, store EndpointConfig[], add addEndpoint() & getConfigs() |
| `src/modules/routes/controller/http.ts` | Accept Route instead of Router, push config di main() |
| `src/modules/routes/controller/ws.ts` | Same pattern as http.ts |
| `src/main.ts` | Add static bootstrap() method, private registerHttpEndpoint(), registerWsEndpoint() |
| `src/sample/*.ts` | Update semua contoh ke API baru |

## Files Unchanged

- `src/modules/app/main.ts` — router() method masih kompatibel
- `src/modules/routes/services/*.ts` — sudah decoupled
- `src/modules/routes/validations/*.ts` — tidak ada perubahan

---

## Breaking Changes

1. `route.getRouter()` — **dihapus**, tidak lagi expose Express Router
2. `app.router('/path', route.getRouter(), {...})` — **diganti** dengan `bootstrap()`
3. Endpoint registration sekarang **lazy** — tidak aktif sampai `bootstrap()` dipanggil

---

## Migration

```typescript
// BEFORE
app.router('/api', userController.getRouter(), { type: 'http' })
app.port(3000)

// AFTER
RacerEX_F.bootstrap(app, [
  { path: '/api', route: userController }
]).port(3000)
```

---

## Benefits

1. **Testability** — Route bisa ditest tanpa Express
2. **Flexibility** — Config bisa di-inspect sebelum registration
3. **Cleaner separation** — Route = data, bootstrap = registration
4. **Extensibility** — Mudah tambah fitur seperti route introspection, OpenAPI generation
