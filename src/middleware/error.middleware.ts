import type { NextFunction, Request, Response } from "express";
import type { ResponseOutput } from "../types/response.output.js";

/**
 * Standard error middleware untuk RacerEX Framework
 * Menangani semua error yang di-throw dan mengembalikan response dengan format ResponseOutput
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const racerError = err as unknown as ResponseOutput;

  const response: ResponseOutput = {
    errorCode: racerError.errorCode ?? "INTERNAL_ERROR",
    statusCode: racerError.statusCode ?? 500,
    message: racerError.message ?? "Unexpected internal error",
    success: false,
    data: racerError.data ?? null,
  };

  res.status(response.statusCode).json(response);
}