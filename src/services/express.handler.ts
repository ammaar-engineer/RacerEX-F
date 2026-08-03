import { Router } from 'express'
import { RequestService } from '../modules/routes/services/request.service.js'
import { ResponseService } from '../modules/routes/services/response.service.js'
import { RacerError } from '../types/error.class.js'
import type { HttpEndpointConfig } from '../modules/routes/types/endpoint.config.js'

/**
 * Register HTTP endpoint ke Express Router
 * Handles guard execution, request/response wrapping, dan error forwarding
 */
export function registerHttpEndpoint(router: Router, config: HttpEndpointConfig): void {
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
export function registerWsEndpoint(router: Router, config: any): void {
    console.warn(`[RacerEX-F] WS endpoint "${config.url}" registered but not active — install ws/express-ws to enable`)
}
