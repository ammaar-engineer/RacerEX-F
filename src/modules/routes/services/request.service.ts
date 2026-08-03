import type { Request } from 'express'

/**
 * RequestService - Wrapper untuk Express Request
 * Menyediakan API yang lebih clean untuk akses request data
 */
export class RequestService<T = any> {
    constructor(private req: Request) {}

    /**
     * Get typed request object
     * Menggabungkan DTO type dengan Express Request
     */
    getRequest<DTO = T>(): DTO & Request {
        return this.req as DTO & Request
    }

    /**
     * Get raw Express request
     */
    getRaw(): Request {
        return this.req
    }

    /**
     * Get route parameter
     * @example rcf.getParam('id') // from /user/:id
     */
    getParam(key: string): string {
        return this.req.params[key]
    }

    /**
     * Get all route parameters
     */
    getParams(): Record<string, string> {
        return this.req.params
    }

    /**
     * Get query parameter
     * @example rcf.getQuery('page') // from ?page=1
     */
    getQuery(key: string): string | undefined {
        return this.req.query[key] as string | undefined
    }

    /**
     * Get all query parameters
     */
    getQueries(): Record<string, any> {
        return this.req.query
    }

    /**
     * Get typed request body
     */
    getBody<B = T>(): B {
        return this.req.body as B
    }

    /**
     * Get header value
     */
    getHeader(key: string): string | undefined {
        return this.req.get(key)
    }

    /**
     * Get all headers
     */
    getHeaders(): Record<string, string | string[] | undefined> {
        return this.req.headers
    }

    /**
     * Get request method (GET, POST, etc)
     */
    getMethod(): string {
        return this.req.method
    }

    /**
     * Get request path
     */
    getPath(): string {
        return this.req.path
    }

    /**
     * Get full URL
     */
    getUrl(): string {
        return this.req.originalUrl
    }

    /**
     * Get client IP address
     */
    getIp(): string | undefined {
        return this.req.ip
    }
}
