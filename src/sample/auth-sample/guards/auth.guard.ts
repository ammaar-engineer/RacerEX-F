import { RacerError } from '../../../main.js'
import type { RequestService } from '../../../modules/routes/services/request.service.js'
import type { AuthService } from '../services/auth.service.js'

/**
 * Factory guard: validasi Bearer token dari Authorization header
 * Menerima AuthService sebagai dependency agar bisa verifikasi session
 *
 * @example
 * route.guards(isAuthenticated(authService))
 */
export function isAuthenticated(authService: AuthService) {
    return (req: RequestService) => {
        const authHeader = req.getHeader('Authorization')

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new RacerError({
                statusCode: 401,
                errorCode: 'UNAUTHORIZED',
                message: 'Missing or invalid Authorization header'
            })
        }

        const token = authHeader.slice(7) // Remove "Bearer "
        const session = authService.findSessionByToken(token)

        if (!session) {
            throw new RacerError({
                statusCode: 401,
                errorCode: 'INVALID_TOKEN',
                message: 'Token is invalid or has expired'
            })
        }

        return true
    }
}
