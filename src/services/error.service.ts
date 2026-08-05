import { RacerError } from "../types/error.class.js";

/**
 * Service untuk throw standardized errors di RacerEX Framework
 * Menggunakan RacerError class yang sudah ada
 */
export class ErrorService {
  // --- CLIENT ERRORS (4xx) ---

  /**
   * 400 Bad Request - Input tidak valid secara umum
   */
  badRequest(message: string = "Request tidak valid.", data?: any): never {
    throw new RacerError({
      message,
      statusCode: 400,
      errorCode: "BAD_REQUEST",
      data,
    });
  }

  /**
   * 400 Bad Request - Khusus gagal validasi skema/form
   */
  validationFailed(message: string = "Validasi input gagal.", data?: any): never {
    throw new RacerError({
      message,
      statusCode: 400,
      errorCode: "VALIDATION_FAILED",
      data,
    });
  }

  /**
   * 401 Unauthorized - Belum login / Token hangus
   */
  unauthorized(message: string = "Autentikasi diperlukan.", data?: any): never {
    throw new RacerError({
      message,
      statusCode: 401,
      errorCode: "UNAUTHORIZED",
      data,
    });
  }

  /**
   * 403 Forbidden - Sudah login, tapi tidak punya hak akses (Role tidak sesuai)
   */
  forbidden(
    message: string = "Anda tidak memiliki akses ke resource ini.",
    data?: any
  ): never {
    throw new RacerError({
      message,
      statusCode: 403,
      errorCode: "FORBIDDEN",
      data,
    });
  }

  /**
   * 404 Not Found - Data / Route tidak ditemukan
   */
  notFound(message: string = "Resource tidak ditemukan.", data?: any): never {
    throw new RacerError({
      message,
      statusCode: 404,
      errorCode: "NOT_FOUND",
      data,
    });
  }

  /**
   * 409 Conflict - Data duplikat (misal: email sudah terdaftar)
   */
  conflict(
    message: string = "Resource sudah ada atau konflik terjadi.",
    data?: any
  ): never {
    throw new RacerError({
      message,
      statusCode: 409,
      errorCode: "CONFLICT",
      data,
    });
  }

  /**
   * 429 Too Many Requests - Rate limiting
   */
  tooManyRequests(
    message: string = "Terlalu banyak permintaan. Silakan coba lagi nanti.",
    data?: any
  ): never {
    throw new RacerError({
      message,
      statusCode: 429,
      errorCode: "TOO_MANY_REQUESTS",
      data,
    });
  }

  // --- SERVER ERRORS (5xx) ---

  /**
   * 500 Internal Server Error - Crash tidak terduga atau error database
   */
  internalServerError(
    message: string = "Terjadi kesalahan internal pada server.",
    data?: any
  ): never {
    throw new RacerError({
      message,
      statusCode: 500,
      errorCode: "INTERNAL_SERVER_ERROR",
      data,
    });
  }

  /**
   * 503 Service Unavailable - Server overload atau sedang maintenance
   */
  serviceUnavailable(
    message: string = "Layanan sedang tidak tersedia.",
    data?: any
  ): never {
    throw new RacerError({
      message,
      statusCode: 503,
      errorCode: "SERVICE_UNAVAILABLE",
      data,
    });
  }
}

/**
 * Instance singleton ErrorService untuk digunakan di seluruh aplikasi
 *
 * @example
 * import { errorService } from '@/services/error.service'
 *
 * // Throw error
 * errorService.notFound('User tidak ditemukan')
 * errorService.unauthorized('Token expired')
 * errorService.badRequest('Email sudah digunakan', { field: 'email' })
 */
export const errorService = new ErrorService();