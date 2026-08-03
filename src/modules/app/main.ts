import express, { type ErrorRequestHandler, type RequestHandler } from 'express'
import { standardErrorMiddleware } from './middleware/error.middleware.js'

export class AppModules {
    private app = express()
    private customErrorHandler: ErrorRequestHandler | null = null

    /**
     * Register global middleware(s)
     */
    middleware(...middlewares: RequestHandler[]) {
        middlewares.forEach(mw => this.app.use(mw))
        return this
    }

    /**
     * Register router under specific path
     */
    router(path: string, router: any, {type}: {type: 'ws' | 'http'}) {
        this.app.use(path, router)
        return this
    }

    /**
     * Set custom error handler
     * Jika tidak di-set, akan pakai standardErrorMiddleware
     */
    errorHandler(handler: ErrorRequestHandler) {
        this.customErrorHandler = handler
        return this
    }

    /**
     * Get raw Express app instance (untuk advanced usage)
     */
    getExpressApp() {
        return this.app
    }

    /**
     * Start server pada port tertentu
     */
    port(port_number: number) {
        // Mount error handler sebelum listen
        // Error handler harus di-register paling akhir
        const finalErrorHandler = this.customErrorHandler ?? standardErrorMiddleware
        this.app.use(finalErrorHandler)

        this.app.listen(port_number, () => {
            console.log(`Server now running in port ${port_number}`)
        })

        return this
    }
}
