import { object, string, pattern, define } from '../../../main.js'

/**
 * Custom password validator
 * Min 8 chars, harus ada uppercase, lowercase, dan angka
 */
export const PasswordSchema = define<string>('Password', (value: any) => {
    if (typeof value !== 'string') return false
    return (
        value.length >= 8 &&
        /[A-Z]/.test(value) &&
        /[a-z]/.test(value) &&
        /[0-9]/.test(value)
    )
})

/**
 * Email validation schema
 */
export const EmailSchema = pattern(
    string(),
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
)

/**
 * Register request validation
 */
export const RegisterSchema = object({
    email: EmailSchema,
    password: PasswordSchema,
    name: string()
})

/**
 * Login request validation
 */
export const LoginSchema = object({
    email: EmailSchema,
    password: string()
})
