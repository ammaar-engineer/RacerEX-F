import type { NextFunction, Request, Response } from 'express'
import express from 'express'
type csErrorHandleFn = (err: Error, req: Request, res: Response, next: NextFunction) => Promise<any> | any
type storageAppModulesType = {
    csErrorHandleFn: csErrorHandleFn
}

export class AppModules {
    private app;
    private storageObject = {} as storageAppModulesType
    constructor(app: ReturnType<typeof express>) {
        this.app = app
    }
    port(portNumber: number) {
        this.app.listen(portNumber ?? 3000, () => {
            console.log(`Now RacerEX_F running in port ${portNumber}`)
        })
    }
    async csErrorHandle(builtInFn: csErrorHandleFn) {
        this.storageObject.csErrorHandleFn = builtInFn
    }
    middleware(...middlewareFn: any[]) {
        middlewareFn.forEach(fn => this.app.use(fn))
    }
}