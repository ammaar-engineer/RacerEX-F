import type { Request, Response } from 'express'
import { RequestService } from './services/request.service.js'
import { ResponseService } from './services/response.service.js'
import type { ResponseOutput } from '../../types/response.output.js'

/**
 * RacerContext (RCF) - Main context object untuk handler
 * Menggabungkan RequestService dan ResponseService dengan shorthand methods
 */
export class RacerContext<T = any> {
    readonly request: RequestService<T>
    readonly response: ResponseService

    constructor(req: Request, res: Response) {
        this.request = new RequestService(req)
        this.response = new ResponseService(res)
    }

    // === Shorthand aliases untuk kemudahan akses ===

    /**
     * Alias untuk request.getRequest()
     */
    getRequest<DTO = T>(): DTO & Request {
        return this.request.getRequest<DTO>()
    }

    /**
     * Alias untuk response.json()
     */
    json<D = any>(data: ResponseOutput<D>): void {
        return this.response.json(data)
    }

    /**
     * Alias untuk response.success()
     */
    success<D = any>(data: D, message?: string, statusCode: number = 200): void {
        return this.response.success(data, message, statusCode)
    }

    /**
     * Alias untuk response.error()
     */
    error(errorCode: string, message: string, statusCode: number = 400, data?: any): void {
        return this.response.error(errorCode, message, statusCode, data)
    }

    /**
     * Alias untuk request.getParam()
     */
    getParam(key: string): string {
        return this.request.getParam(key)
    }

    /**
     * Alias untuk request.getQuery()
     */
    getQuery(key: string): string | undefined {
        return this.request.getQuery(key)
    }

    /**
     * Alias untuk request.getBody()
     */
    getBody<B = T>(): B {
        return this.request.getBody<B>()
    }
}
