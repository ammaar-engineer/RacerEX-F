import express, { Router } from 'express'
import { HttpEndpointBuilder, type GuardFn } from './controller/http.js'
import { WsEndpointBuilder } from './controller/ws.js'

/**
 * Route - Container untuk multiple endpoints dengan DI dan guards support
 */
export class Route {
    private router: Router = express.Router()
    private injectedDependencies: any[] = []
    private globalGuards: GuardFn[] = []

    /**
     * Inject dependencies yang akan tersedia di semua endpoint
     * @example
     * const route = new Route()
     *   .inject(userService, tokenValidator)
     */
    inject(...dependencies: any[]): this {
        this.injectedDependencies.push(...dependencies)
        return this
    }

    /**
     * Register guards global yang akan dijalankan di semua endpoint
     * @example
     * route.guards(isAuthenticated, isAdmin)
     */
    guards(...guardFns: GuardFn[]): this {
        this.globalGuards.push(...guardFns)
        return this
    }

    /**
     * Create new HTTP endpoint builder
     */
    CreateEndpoint(options: { type: 'http' }): HttpEndpointBuilder

    /**
     * Create new WebSocket endpoint builder
     */
    CreateEndpoint(options: { type: 'ws' }): WsEndpointBuilder

    /**
     * Create new endpoint builder based on type
     * @example
     * // HTTP endpoint
     * route.CreateEndpoint({ type: 'http' })
     *   .config({ type: 'http', method: 'get', url: '/hello' })
     *   .main((req, res) => { ... })
     *
     * // WebSocket endpoint
     * route.CreateEndpoint({ type: 'ws' })
     *   .config({ type: 'ws', url: '/chat' })
     *   .main((socket, req) => { ... })
     */
    CreateEndpoint({ type }: { type: 'http' | 'ws' }): HttpEndpointBuilder | WsEndpointBuilder {
        if (type === 'ws') {
            return new WsEndpointBuilder(
                this.router,
                this.injectedDependencies,
                this.globalGuards
            )
        }

        return new HttpEndpointBuilder(
            this.router,
            this.injectedDependencies,
            this.globalGuards
        )
    }

    /**
     * Get Express Router instance untuk integration dengan AppModules
     */
    getRouter(): Router {
        return this.router
    }
}
