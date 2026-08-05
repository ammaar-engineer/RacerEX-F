import { HttpModules } from "./endpoints/http.js"
import type { routesType } from "./types/routes.types.js"

type guardsComponentType = () => {}

export class RoutesModules {
    routesStorage = [] as routesType[]
    http() {
        return new HttpModules(this)
    }
    ws() {

    }
    inject() {

    }
}