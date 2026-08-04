import type { RequestHandler } from 'express'
import type { RequestService } from '../services/request.service.js'
import type { ResponseService } from '../services/response.service.js'
import type { HttpEndpointConfig } from '../types/endpoint.config.js'

export type GuardFn = (
    req: RequestService,
    res: ResponseService
) =>
    | boolean
    | { success: boolean; message?: string; data?: any }
    | Promise<boolean | { success: boolean; message?: string; data?: any }>

export type HttpEndpointHandler = (
    req: RequestService,
    res: ResponseService,
    injected: any[]
) => void | Promise<void>

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

type HttpConfigInput = {
    method: HttpMethod
    url: string
}

// Interface minimal untuk menghindari circular import
interface RouteReceiver {
    addEndpoint(config: HttpEndpointConfig): void
}

/**
 * HttpEndpointBuilder - Builder pattern untuk konfigurasi HTTP endpoint
 * Tidak ada Express dependency — hanya kumpulkan config lalu inject ke Route
 *
 * @example
 * route.CreateEndpoint({ type: 'http' })
 *   .config({ type: 'http', method: 'post', url: '/register' })
 *   .guards(validateBody(Schema))
 *   .middleware(logger)
 *   .main(async (req, res, [userService]) => {
 *     const body = req.getBody()
 *     res.success(body, 'Created', 201)
 *   })
 */
export class HttpEndpointBuilder {
    private cfg: HttpConfigInput | null = null
    private endpointGuards: GuardFn[] = []
    private endpointMiddlewares: RequestHandler[] = []

    constructor(
        private route: RouteReceiver,
        private injected: any[],
        private controllerGuards: GuardFn[]
    ) {}

    config(cfg: HttpConfigInput): this {
        this.cfg = cfg
        return this
    }

    guards(...guardFns: GuardFn[]): this {
        this.endpointGuards.push(...guardFns)
        return this
    }

    middleware(...middlewares: RequestHandler[]): this {
        this.endpointMiddlewares.push(...middlewares)
        return this
    }

    /**
     * Terminal method — inject config ke Route object
     */
    main(handler: HttpEndpointHandler): void {
        if (!this.cfg) {
            throw new Error('HttpEndpointBuilder: .config() harus dipanggil sebelum .main()')
        }

        const config: HttpEndpointConfig = {
            type: 'http',
            method: this.cfg.method,
            url: this.cfg.url,
            guards: [...this.controllerGuards, ...this.endpointGuards],
            middlewares: this.endpointMiddlewares,
            injected: this.injected,
            handler
        }

        this.route.addEndpoint(config)
    }
}
