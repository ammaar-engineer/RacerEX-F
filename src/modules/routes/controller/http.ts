import type { Router, RequestHandler } from 'express'
import { RequestService } from '../services/request.service.js'
import { ResponseService } from '../services/response.service.js'
import { RacerError } from '../../../types/error.class.js'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export type HttpEndpointConfig = {
    type: 'http'
    method: HttpMethod
    url: string
}

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

/**
 * HttpEndpointBuilder - Builder pattern untuk konfigurasi HTTP endpoint
 *
 * @example
 * route.CreateEndpoint({ type: 'http' })
 *   .config({ type: 'http', method: 'post', url: '/register' })
 *   .guards(validateBody)
 *   .middleware(logger)
 *   .main(async (req, res, [userService]) => {
 *     const body = req.getBody<RegisterDTO>()
 *     res.success(body, 'Created', 201)
 *   })
 */
export class HttpEndpointBuilder {
    private cfg: HttpEndpointConfig | null = null
    private endpointGuards: GuardFn[] = []
    private endpointMiddlewares: RequestHandler[] = []

    constructor(
        private router: Router,
        private injected: any[],
        private controllerGuards: GuardFn[]
    ) {}

    config(cfg: HttpEndpointConfig): this {
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

    main(handler: HttpEndpointHandler): void {
        if (!this.cfg) {
            throw new Error('HttpEndpointBuilder: .config() harus dipanggil sebelum .main()')
        }

        const { method, url } = this.cfg
        const allGuards = [...this.controllerGuards, ...this.endpointGuards]
        const injected = this.injected

        const expressHandler = async (req: any, res: any, next: any) => {
            try {
                const request = new RequestService(req)
                const response = new ResponseService(res)

                for (const guard of allGuards) {
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

        this.router[method](url, ...this.endpointMiddlewares, expressHandler)
    }
}
