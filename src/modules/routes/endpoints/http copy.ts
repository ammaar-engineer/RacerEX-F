import type { RoutesModules } from "../main.js";
import type { RcfServices } from "../services/rcf.service.js";
import type { routesType } from "../types/routes.types.js";

type httpModuleConfig = {
    method: 'post' | 'get'
    url: string
}
type fnMainType = (data: any[], rcf: RcfServices) => Promise<any> | any

export class HttpModules {
    private routes: RoutesModules;
    currentConfig = {} as routesType
    constructor(routes: RoutesModules) {
        this.routes = routes
    }
    config(config: httpModuleConfig) {
        this.currentConfig = {
            ...this.currentConfig,
            ...config
        }
    }
    async main(fnMain: fnMainType) {
        this.currentConfig.main = fnMain
        this.routes.routesStorage.push(this.currentConfig)
    }
    extract(key: string[]) {
        this.currentConfig.extract = key
    }
    guards() {

    }
    middleware() {

    }
}