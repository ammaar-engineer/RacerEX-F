import type { ResponseOutput } from "./response.output.js"

/**
 * RacerEX Framework Error
 * Gunakan ini untuk throw error dengan format ResponseOutput
 *
 * @example
 * throw new RacerError({
 *   statusCode: 404,
 *   errorCode: 'USER_NOT_FOUND',
 *   message: 'User tidak ditemukan'
 * })
 */
export class RacerError extends Error implements ResponseOutput {
    statusCode: number
    errorCode: string
    success: boolean = false
    data?: any

    constructor(config: {
        statusCode: number
        errorCode: string
        message: string
        data?: any
    }) {
        super(config.message)
        this.statusCode = config.statusCode
        this.errorCode = config.errorCode
        this.data = config.data
        this.name = 'RacerError'

        // Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor)
    }
}
