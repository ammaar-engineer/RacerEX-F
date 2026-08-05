import { errorService } from "../../../services/error.service.js";

/**
 * Tipe error yang tersedia untuk RcfServices.Reject()
 */
export type ErrorType =
  | "badRequest"
  | "validationFailed"
  | "unauthorized"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "tooManyRequests"
  | "internalServerError"
  | "serviceUnavailable";

/**
 * RacerEX Core Framework Services
 * Menyediakan utility methods untuk response handling
 */
export class RcfServices {
  private errorHandlers = {
    badRequest: errorService.badRequest.bind(errorService),
    validationFailed: errorService.validationFailed.bind(errorService),
    unauthorized: errorService.unauthorized.bind(errorService),
    forbidden: errorService.forbidden.bind(errorService),
    notFound: errorService.notFound.bind(errorService),
    conflict: errorService.conflict.bind(errorService),
    tooManyRequests: errorService.tooManyRequests.bind(errorService),
    internalServerError: errorService.internalServerError.bind(errorService),
    serviceUnavailable: errorService.serviceUnavailable.bind(errorService),
  };

  Reject(type: ErrorType, message?: string, data?: any) {
    const handler = this.errorHandlers[type];

    if (!handler) {
      errorService.internalServerError(
        "Unknown error type",
        { requestedType: type }
      );
    }

    handler(message, data);
  }
}

export const rcf = new RcfServices();