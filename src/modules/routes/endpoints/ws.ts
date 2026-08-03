import type { RequestHandler } from 'express'
import type { WsEndpointConfig as WsEndpointConfigType } from '../types/endpoint.config.js'

export interface WsConnection {
    send(data: string | Buffer): void
    close(code?: number, reason?: string): void
    on(event: 'message', listener: (data: string | Buffer) => void): void
    on(event: 'close', listener: (code: number, reason: string) => void): void
    on(event: 'error', listener: (error: Error) => void): void
}

export type WsEndpointHandler = (
    socket: WsConnection,
    req: any,
    injected: any[]
) => void | Promise<void>

export type WsEndpointInputConfig = {
    url: string
}

// Interface minimal untuk menghindari circular import
interface RouteReceiver {
    addEndpoint(config: WsEndpointConfigType): void
}

/**
 * WsEndpointBuilder - Builder pattern untuk WebSocket endpoint
 * Guards di-skip untuk WS (sesuai design.v1.md)
 *
 * @example
 * route.CreateEndpoint({ type: 'ws' })
 *   .config({ type: 'ws', url: '/chat' })
 *   .middleware(logger)
 *   .main(async (socket, req, [chatService]) => {
 *     socket.on('message', (msg) => chatService.broadcast(msg))
 *   })
 */
export class WsEndpointBuilder {
    private cfg: WsEndpointInputConfig | null = null
    private endpointMiddlewares: RequestHandler[] = []

    constructor(
        private route: RouteReceiver,
        private injected: any[],
        // Guards di-skip untuk WS — parameter ada tapi tidak digunakan
        private _controllerGuards: Function[]
    ) {}

    config(cfg: WsEndpointInputConfig): this {
        this.cfg = cfg
        return this
    }

    /**
     * Guards tidak berlaku untuk WebSocket — method ini ada untuk konsistensi API
     */
    guards(..._guardFns: Function[]): this {
        return this
    }

    middleware(...middlewares: RequestHandler[]): this {
        this.endpointMiddlewares.push(...middlewares)
        return this
    }

    /**
     * Terminal method — inject config ke Route object
     */
    main(handler: WsEndpointHandler): void {
        if (!this.cfg) {
            throw new Error('WsEndpointBuilder: .config() harus dipanggil sebelum .main()')
        }

        const config: WsEndpointConfigType = {
            type: 'ws',
            url: this.cfg.url,
            guards: [],
            middlewares: this.endpointMiddlewares,
            injected: this.injected,
            handler
        }

        this.route.addEndpoint(config)
    }
}
