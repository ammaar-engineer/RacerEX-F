export type ResponseOutput<T = any> = {
    statusCode: number
    message?: string
    success: boolean
    data?: T
    errorCode: string
}
