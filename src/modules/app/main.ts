import express, { Router, type ErrorRequestHandler, type RequestHandler } from 'express'
import { standardErrorMiddleware } from './middleware/error.middleware.js'
import { registerHttpEndpoint, registerWsEndpoint } from './express.handler.js'
import { Route } from '../routes/main.js'

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
     * Bootstrap routes into this Express app
     * Register semua endpoint configs dari routes ke Express
     *
     * @example
     * app.bootstrap([
     *   { path: '/api/users', route: userController },
     *   { path: '/api/admin', route: adminController }
     * ]).port(3000)
     */
    bootstrap(routes: Array<{ path: string; route: Route }>): this {
        for (const { path, route } of routes) {
            const router = Router()
            const configs = route.getConfigs()

            for (const config of configs) {
                if (config.type === 'http') {
                    registerHttpEndpoint(router, config)
                } else if (config.type === 'ws') {
                    registerWsEndpoint(router, config)
                }
            }

            this.router(path, router, { type: 'http' })
        }

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
