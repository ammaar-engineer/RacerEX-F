/**
 * Superstruct validation guards for RacerEX-F
 *
 * @example
 * import { validateBody, validateParams } from './modules/routes/validations'
 * import { object, string, number } from 'superstruct'
 *
 * const UserSchema = object({
 *   name: string(),
 *   age: number()
 * })
 *
 * route.CreateEndpoint({ type: 'http' })
 *   .guards(validateBody(UserSchema))
 *   .main((req, res) => { ... })
 */

export {
    validateBody,
    validateParams,
    validateQuery,
    validateHeaders
} from './superstruct.guard.js'

// Re-export common superstruct functions
export {
    object,
    string,
    number,
    boolean,
    array,
    optional,
    nullable,
    enums,
    pattern,
    size,
    email,
    define,
    type Infer
} from 'superstruct'
