import type { Router, RequestHandler } from 'express'

export type WsEndpointConfig = {
    type: 'ws'
    url: string
}

/**
 * WebSocket connection interface
 * Akan di-replace dengan actual WS type setelah library di-install
 */
export interface WsConnection {
    send(data: string | Buffer): void
    close(code?: number, reason?: string): void
    on(event: 'message', listener: (data: string | Buffer) => void): this
    on(event: 'close', listener: (code: number, reason: string) => void): this
    on(event: 'error', listener: (error: Error) => void): this
}

export type WsEndpointHandler = (
    socket: WsConnection,
    req: any,
    injected: any[]
) => void | Promise<void>

/**
 * WsEndpointBuilder - Builder pattern untuk konfigurasi WebSocket endpoint
 * Note: Guards di-skip untuk WS (sesuai design.v1.md)
 *
 * @example
 * route.CreateEndpoint({ type: 'ws' })
 *   .config({ type: 'ws', url: '/chat' })
 *   .middleware(logger)
 *   .main(async (socket, req, [chatService]) => {
 *     socket.on('message', (msg) => {
 *       chatService.broadcast(msg)
 *     })
 *   })
 */
export class WsEndpointBuilder {
    private cfg: WsEndpointConfig | null = null
    private endpointMiddlewares: RequestHandler[] = []

    constructor(
        private router: Router,
        private injected: any[],
        // Guards di-skip untuk WS — parameter ada tapi tidak digunakan
        private _controllerGuards: Function[]
    ) {}

    config(cfg: WsEndpointConfig): this {
        this.cfg = cfg
        return this
    }

    /**
     * Guards tidak berlaku untuk WebSocket endpoint
     * Method ini ada untuk konsistensi API tapi tidak melakukan apa-apa
     */
    guards(..._guardFns: Function[]): this {
        // intentionally skipped for WS
        return this
    }

    middleware(...middlewares: RequestHandler[]): this {
        this.endpointMiddlewares.push(...middlewares)
        return this
    }

    /**
     * Terminal method — register WebSocket endpoint ke Router
     * Actual WS registration akan aktif setelah ws library di-install
     */
    main(handler: WsEndpointHandler): void {
        if (!this.cfg) {
            throw new Error('WsEndpointBuilder: .config() harus dipanggil sebelum .main()')
        }

        // TODO: aktifkan setelah ws/express-ws di-install
        // this.router.ws(this.cfg.url, ...this.endpointMiddlewares, async (socket, req) => {
        //     await handler(socket, req, this.injected)
        // })

        console.warn(`[RacerEX-F] WS endpoint "${this.cfg.url}" registered but not active — install ws/express-ws to enable`)
    }
}
