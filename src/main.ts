import express, { Router } from 'express'
import { Route } from './modules/routes/main.js'
import { AppModules } from './modules/app/main.js'
import { registerHttpEndpoint, registerWsEndpoint } from './services/express.handler.js'
import type { HttpEndpointConfig } from './modules/routes/types/endpoint.config.js'

// Re-export types yang dibutuhkan user framework
export type { HttpEndpointHandler, GuardFn } from './modules/routes/controller/http.js'
export type { WsEndpointHandler, WsEndpointInputConfig, WsConnection } from './modules/routes/controller/ws.js'
export type { ResponseOutput } from './types/response.output.js'
export type { EndpointConfig, HttpEndpointConfig, BaseEndpointConfig } from './modules/routes/types/endpoint.config.js'

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
 * RacerEX_F.bootstrap(app, [
 *   { path: '/api', route: userController }
 * ]).port(3000)
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

    /**
     * Bootstrap routes ke Express app
     * Ambil semua endpoint configs dari routes dan register ke Express
     *
     * @example
     * const app = RacerEX_F.App()
     * app.middleware(express.json())
     *
     * RacerEX_F.bootstrap(app, [
     *   { path: '/api/users', route: userController },
     *   { path: '/api/admin', route: adminController }
     * ])
     *
     * app.port(3000)
     */
    static bootstrap(
        app: AppModules,
        routes: Array<{ path: string; route: Route }>
    ): void {
        for (const { path, route } of routes) {
            const router = Router()
            const configs = route.getConfigs()

            for (const config of configs) {
                if (config.type === 'http') {
                    registerHttpEndpoint(router, config)
                } else if (config.type === 'ws') {
                    registerWsEndpoint(router, config)
                }
            }

            app.router(path, router, { type: 'http' })
        }
    }
}

export default new RacerEX_F()
