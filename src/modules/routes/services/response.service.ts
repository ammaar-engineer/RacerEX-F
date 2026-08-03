import type { Response } from 'express'
import type { ResponseOutput } from '../../../types/response.output.js'

/**
 * ResponseService - Wrapper untuk Express Response
 * Menyediakan API yang lebih clean untuk mengirim response
 */
export class ResponseService {
    constructor(private res: Response) {}

    /**
     * Get raw Express response
     */
    getRaw(): Response {
        return this.res
    }

    /**
     * Send JSON response dengan format ResponseOutput
     */
    json<D = any>(data: ResponseOutput<D>): void {
        this.res.status(data.statusCode).json(data)
    }

    /**
     * Send success response dengan shorthand
     */
    success<D = any>(data: D, message?: string, statusCode: number = 200): void {
        this.json({
            success: true,
            statusCode,
            errorCode: '',
            message,
            data
        })
    }

    /**
     * Send error response dengan shorthand
     */
    error(errorCode: string, message: string, statusCode: number = 400, data?: any): void {
        this.json({
            success: false,
            statusCode,
            errorCode,
            message,
            data
        })
    }

    /**
     * Set response header
     */
    setHeader(key: string, value: string | number | readonly string[]): this {
        this.res.setHeader(key, value)
        return this
    }

    /**
     * Set multiple headers
     */
    setHeaders(headers: Record<string, string | number | readonly string[]>): this {
        Object.entries(headers).forEach(([key, value]) => {
            this.res.setHeader(key, value)
        })
        return this
    }

    /**
     * Set status code
     */
    status(code: number): this {
        this.res.status(code)
        return this
    }

    /**
     * Send raw data (untuk non-JSON response)
     */
    send(data: any): void {
        this.res.send(data)
    }

    /**
     * Redirect to another URL
     */
    redirect(url: string, statusCode: number = 302): void {
        this.res.redirect(statusCode, url)
    }

    /**
     * Download file
     */
    download(path: string, filename?: string): void {
        if (filename) {
            this.res.download(path, filename)
        } else {
            this.res.download(path)
        }
    }

    /**
     * Send file
     */
    sendFile(path: string): void {
        this.res.sendFile(path)
    }
}
