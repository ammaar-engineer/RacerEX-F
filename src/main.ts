import express, { Router } from 'express'
import { Route } from './modules/routes/main.js'
import { AppModules } from './modules/app/main.js'
import { RequestService } from './modules/routes/services/request.service.js'
import { ResponseService } from './modules/routes/services/response.service.js'
import { RacerError } from './types/error.class.js'
import type { HttpEndpointConfig } from './modules/routes/types/endpoint.config.js'
import type { WsEndpointInputConfig } from './modules/routes/controller/ws.js'

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
     * RacerEX_F.bootstrap(app, [
     *   { path: '/api/users', route: userController },
     *   { path: '/api/admin', route: adminController }
     * ]).port(3000)
     */
    static bootstrap(
        app: AppModules,
        routes: Array<{ path: string; route: Route }>
    ): AppModules {
        for (const { path, route } of routes) {
            const router = Router()
            const configs = route.getConfigs()

            for (const config of configs) {
                if (config.type === 'http') {
                    RacerEX_F.registerHttpEndpoint(router, config)
                } else if (config.type === 'ws') {
                    RacerEX_F.registerWsEndpoint(router, config)
                }
            }

            app.router(path, router, { type: 'http' })
        }

        return app
    }

    /**
     * Register HTTP endpoint ke Express Router
     */
    private static registerHttpEndpoint(router: Router, config: HttpEndpointConfig): void {
        const { method, url, guards, middlewares, handler, injected } = config

        const expressHandler = async (req: any, res: any, next: any) => {
            try {
                const request = new RequestService(req)
                const response = new ResponseService(res)

                // Jalankan semua guards secara sequential
                for (const guard of guards) {
                    const result = await guard(request, response)
                    if (result === false || (typeof result === 'object' && !result.success)) {
                        const msg = typeof result === 'object' ? result.message : undefined
                        const data = typeof result === 'object' ? result.data : undefined
                        throw new RacerError({
                            statusCode: 400,
                            errorCode: 'GUARD_FAILED',
                            message: msg ?? 'Validation failed',
                            data
                        })
                    }
                }

                await handler(request, response, injected)
            } catch (error) {
                next(error)
            }
        }

        router[method](url, ...middlewares, expressHandler)
    }

    /**
     * Register WebSocket endpoint ke Express Router
     * TODO: aktifkan setelah ws/express-ws di-install
     */
    private static registerWsEndpoint(router: Router, config: any): void {
        console.warn(`[RacerEX-F] WS endpoint "${config.url}" registered but not active — install ws/express-ws to enable`)
    }
}

export default new RacerEX_F()
