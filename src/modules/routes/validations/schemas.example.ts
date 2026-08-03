import { object, string, number, optional, enums, pattern, size, email as emailStruct, define, type Infer } from 'superstruct'

/**
 * Example schemas untuk dokumentasi
 * Copy dan modifikasi sesuai kebutuhan project
 */

// === Basic Schema ===
export const UserSchema = object({
    name: string(),
    email: emailStruct(),
    age: number()
})

export type User = Infer<typeof UserSchema>

// === Optional Fields ===
export const UpdateUserSchema = object({
    name: optional(string()),
    email: optional(emailStruct()),
    age: optional(number())
})

// === Route Params Schema ===
export const IdParamSchema = object({
    id: pattern(string(), /^[0-9]+$/)  // numeric string
})

export const UuidParamSchema = object({
    id: pattern(string(), /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
})

// === Query Params Schema ===
export const PaginationSchema = object({
    page: optional(pattern(string(), /^[0-9]+$/)),
    limit: optional(pattern(string(), /^[0-9]+$/)),
    sort: optional(enums(['asc', 'desc']))
})

// === Headers Schema ===
export const AuthHeaderSchema = object({
    authorization: pattern(string(), /^Bearer .+$/)
})

// === Nested Object Schema ===
export const ProfileSchema = object({
    user: object({
        name: string(),
        email: emailStruct()
    }),
    settings: object({
        theme: enums(['light', 'dark']),
        language: enums(['en', 'id'])
    })
})

// === Custom Validators ===

// Phone number Indonesia
export const PhoneSchema = define<string>('PhoneNumber', (value) => {
    if (typeof value !== 'string') return false
    return /^(\+62|62|0)[0-9]{9,12}$/.test(value)
})

// Password dengan minimal requirement
export const PasswordSchema = define<string>('Password', (value) => {
    if (typeof value !== 'string') return false
    // Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
    return value.length >= 8 &&
           /[A-Z]/.test(value) &&
           /[a-z]/.test(value) &&
           /[0-9]/.test(value)
})

// Registration schema dengan custom validators
export const RegisterSchema = object({
    email: emailStruct(),
    password: PasswordSchema,
    phone: PhoneSchema,
    name: size(string(), 3, 50)
})

// === Usage Example ===
/*
import { validateBody, validateParams } from './validations'
import { RegisterSchema, IdParamSchema } from './validations/schemas.example'

route.CreateEndpoint({ type: 'http' })
  .guards(
    validateBody(RegisterSchema),
    validateParams(IdParamSchema)
  )
  .main((req, res) => {
    const body = req.getBody<Infer<typeof RegisterSchema>>()
    const id = req.getParam('id')
  })
*/
