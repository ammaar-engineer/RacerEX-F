import { type Struct, validate } from 'superstruct'
import { RacerError } from '../../../types/error.class.js'
import type { GuardFn } from '../controller/http.js'

// Format error dari superstruct ke format yang readable
function formatStructError(error: any): { path: string; message: string }[] {
    return error.failures().map((f: any) => ({
        path: f.path.length > 0 ? f.path.join('.') : 'root',
        message: f.message
    }))
}

/**
 * Validate request body dengan Superstruct schema
 *
 * @example
 * import { object, string, number } from 'superstruct'
 *
 * const RegisterSchema = object({
 *   email: string(),
 *   password: string(),
 *   age: number()
 * })
 *
 * route.CreateEndpoint({ type: 'http' })
 *   .guards(validateBody(RegisterSchema))
 *   .main((req, res) => {
 *     const body = req.getBody<Infer<typeof RegisterSchema>>()
 *   })
 */
export function validateBody<T>(schema: Struct<T>): GuardFn {
    return (req) => {
        const [error] = validate(req.getBody(), schema)
        if (error) {
            throw new RacerError({
                statusCode: 400,
                errorCode: 'BODY_VALIDATION_FAILED',
                message: error.failures()[0]?.message ?? 'Request body validation failed',
                data: formatStructError(error)
            })
        }
        return true
    }
}

/**
 * Validate route params dengan Superstruct schema
 *
 * @example
 * import { object, string } from 'superstruct'
 *
 * const ParamSchema = object({ id: string() })
 *
 * route.CreateEndpoint({ type: 'http' })
 *   .guards(validateParams(ParamSchema))
 *   .main((req, res) => {
 *     const id = req.getParam('id')
 *   })
 */
export function validateParams<T>(schema: Struct<T>): GuardFn {
    return (req) => {
        const [error] = validate(req.getParams(), schema)
        if (error) {
            throw new RacerError({
                statusCode: 400,
                errorCode: 'PARAMS_VALIDATION_FAILED',
                message: error.failures()[0]?.message ?? 'Route params validation failed',
                data: formatStructError(error)
            })
        }
        return true
    }
}

/**
 * Validate query params dengan Superstruct schema
 *
 * @example
 * import { object, optional, string } from 'superstruct'
 *
 * const QuerySchema = object({
 *   page: optional(string()),
 *   limit: optional(string())
 * })
 *
 * route.CreateEndpoint({ type: 'http' })
 *   .guards(validateQuery(QuerySchema))
 *   .main((req, res) => {
 *     const page = req.getQuery('page')
 *   })
 */
export function validateQuery<T>(schema: Struct<T>): GuardFn {
    return (req) => {
        const [error] = validate(req.getQueries(), schema)
        if (error) {
            throw new RacerError({
                statusCode: 400,
                errorCode: 'QUERY_VALIDATION_FAILED',
                message: error.failures()[0]?.message ?? 'Query params validation failed',
                data: formatStructError(error)
            })
        }
        return true
    }
}

/**
 * Validate request headers dengan Superstruct schema
 *
 * @example
 * import { object, string } from 'superstruct'
 *
 * const HeaderSchema = object({
 *   authorization: string()
 * })
 *
 * route.CreateEndpoint({ type: 'http' })
 *   .guards(validateHeaders(HeaderSchema))
 *   .main((req, res) => {
 *     const token = req.getHeader('authorization')
 *   })
 */
export function validateHeaders<T>(schema: Struct<T>): GuardFn {
    return (req) => {
        const [error] = validate(req.getHeaders(), schema)
        if (error) {
            throw new RacerError({
                statusCode: 400,
                errorCode: 'HEADERS_VALIDATION_FAILED',
                message: error.failures()[0]?.message ?? 'Headers validation failed',
                data: formatStructError(error)
            })
        }
        return true
    }
}
