import type { RequestHandler } from 'express'
import type { GuardFn, HttpEndpointHandler } from '../controller/http.js'
import type { WsEndpointHandler } from '../controller/ws.js'

/**
 * Base config untuk semua endpoint types
 */
export interface BaseEndpointConfig {
    type: 'http' | 'ws'
    url: string
    guards: GuardFn[]
    middlewares: RequestHandler[]
    injected: any[]
}

/**
 * Config untuk HTTP endpoint
 */
export interface HttpEndpointConfig extends BaseEndpointConfig {
    type: 'http'
    method: 'get' | 'post' | 'put' | 'patch' | 'delete'
    handler: HttpEndpointHandler
}

/**
 * Config untuk WebSocket endpoint
 */
export interface WsEndpointConfig extends BaseEndpointConfig {
    type: 'ws'
    handler: WsEndpointHandler
}

/**
 * Union type untuk semua endpoint configs
 */
export type EndpointConfig = HttpEndpointConfig | WsEndpointConfig
