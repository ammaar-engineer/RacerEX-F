import express from 'express';
import { AppModules } from "./modules/app/main.js";
import { RoutesModules } from "./modules/routes/main.js";

type bootstrapParam = {
    type: 'http' | 'ws'
    url: string
    route: ReturnType<RacerEX_F['Routes']>
}

export class RacerEX_F {
    app = express()
    App() {
        return new AppModules(this.app)
    }
    Routes() {
        return new RoutesModules()
    }
    bootstrap(paramArr: bootstrapParam[]) {
        paramArr.forEach(({route, type, url}) => {
            this.app.use(url, )
        })
    }
    
}