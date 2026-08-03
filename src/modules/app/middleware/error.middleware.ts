import type { NextFunction, Request, Response } from "express";
import type { ResponseOutput } from "../../../types/response.output.js";

export function standardErrorMiddleware(err: Error, req: Request, res: Response, next: NextFunction) {
    const rcfError = err as unknown as ResponseOutput

    const response: ResponseOutput = {
        errorCode: rcfError.errorCode ?? 'INTERNAL_ERROR',
        statusCode: rcfError.statusCode ?? 500,
        message: rcfError.message ?? 'Unexpected internal error',
        success: false,
        data: rcfError.data ?? null
    }

    res.status(response.statusCode).json(response)
}
