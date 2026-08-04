import { HttpEndpointBuilder, type GuardFn } from './endpoints/http.js'
import { WsEndpointBuilder } from './endpoints/ws.js'
import type { EndpointConfig } from './types/endpoint.config.js'

/**
 * Route - Container untuk multiple endpoints dengan DI dan guards support
 * Tidak memiliki Express Router — hanya menyimpan endpoint configs
 */
export class Route {
    private endpoints: EndpointConfig[] = []
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
     * @example
     * route.http()
     *   .config({ method: 'get', url: '/hello' })
     *   .main((req, res) => { ... })
     */
    http(): HttpEndpointBuilder {
        return new HttpEndpointBuilder(
            this,
            this.injectedDependencies,
            this.globalGuards
        )
    }

    /**
     * Create new WebSocket endpoint builder
     * @example
     * route.ws()
     *   .config({ url: '/chat' })
     *   .main((socket, req) => { ... })
     */
    ws(): WsEndpointBuilder {
        return new WsEndpointBuilder(
            this,
            this.injectedDependencies,
            this.globalGuards
        )
    }

    /**
     * Internal: Add endpoint config (called by builders)
     */
    addEndpoint(config: EndpointConfig): void {
        this.endpoints.push(config)
    }

    /**
     * Get all endpoint configs (used by bootstrap)
     */
    getConfigs(): EndpointConfig[] {
        return this.endpoints
    }
}
