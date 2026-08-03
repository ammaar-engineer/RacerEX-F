import { Route } from './modules/routes/main.js'
import { AppModules } from './modules/app/main.js'

// Re-export types yang dibutuhkan user framework
export type { HttpEndpointHandler, HttpEndpointConfig, GuardFn } from './modules/routes/controller/http.js'
export type { WsEndpointHandler, WsEndpointConfig, WsConnection } from './modules/routes/controller/ws.js'
export type { ResponseOutput } from './types/response.output.js'

// Re-export classes
export { RacerError } from './types/error.class.js'
export { RequestService } from './modules/routes/services/request.service.js'
export { ResponseService } from './modules/routes/services/response.service.js'

// Re-export superstruct validation guards
export { validateBody, validateParams, validateQuery, validateHeaders } from './modules/routes/validations/index.js'
export { object, string, number, boolean, array, optional, nullable, enums, pattern, size, define, type Infer } from 'superstruct'

/**
 * RacerEX_F - Main framework class
 *
 * @example
 * import RacerEX_F from './main.js'
 *
 * const app = RacerEX_F.App()
 * const userController = RacerEX_F.Route()
 *
 * userController.CreateEndpoint({ type: 'http' })
 *   .config({ type: 'http', method: 'get', url: '/hello' })
 *   .main((req, res) => {
 *     res.success('Hello World')
 *   })
 *
 * app.router('/api', userController.getRouter(), { type: 'http' })
 * app.port(3000)
 */
export class RacerEX_F {
    /**
     * Create new Route instance
     */
    Route() {
        return new Route()
    }

    /**
     * Create new App instance
     */
    App() {
        return new AppModules()
    }
}

export default new RacerEX_F()
