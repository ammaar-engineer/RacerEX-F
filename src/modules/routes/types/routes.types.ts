import type { Request } from "express"

export type routesType = {
    url: string,
    method: 'get' | 'post',
    extract?: string[]
    main: (data: any[], rcf: any) => Promise<any> | any
    middleware: (data: any) => void | Promise<void>
    guard: (req: Request, res: Response) => void | Promise<void>
}