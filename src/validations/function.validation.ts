
export class FunctionValidationClass {
    isAsyncFunction(fn: () => any | Promise<any>) {
        return Object.prototype.toString.call(fn) === '[object AsyncFunction]'
    }
}

export const FunctionValidation = new FunctionValidationClass()