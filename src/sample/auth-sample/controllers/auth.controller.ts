import { RacerError, RacerEX_F, validateBody } from '../../../main.js'
import { Route } from '../../../modules/routes/main.js'
import type { RequestService } from '../../../modules/routes/services/request.service.js'
import type { ResponseService } from '../../../modules/routes/services/response.service.js'
import { isAuthenticated } from '../guards/auth.guard.js'
import type { AuthService } from '../services/auth.service.js'
import type { LoginDTO, RegisterDTO } from '../types/user.types.js'
import { LoginSchema, RegisterSchema } from '../types/validation.schemas.js'

/**
 * Factory function untuk create AuthController
 * Menerima AuthService sebagai dependency
 *
 * @example
 * const authService = new AuthService()
 * const authController = createAuthController(authService)
 */
export function createAuthController(authService: AuthService): Route {
    const route = RacerEX_F.Route()

    // Inject AuthService ke semua endpoints
    route.inject(
        authService
    )

    // POST /register - Create new user
    route.http()
        .config({ method: 'post', url: '/register' })
        .guards(validateBody(RegisterSchema))
        .main((req: RequestService, res: ResponseService, injected) => {
            const [authSvc] = injected as [AuthService]
            const dto = req.getBody<RegisterDTO>()

            // Check if user already exists
            if (authSvc.findUserByEmail(dto.email)) {
                throw new RacerError({
                    statusCode: 409,
                    errorCode: 'USER_EXISTS',
                    message: 'User with this email already exists'
                })
            }

            // Create user and session
            const user = authSvc.createUser(dto)
            const session = authSvc.createSession(user.id)

            res.success(
                authSvc.toAuthResponse(user, session),
                'Registration successful',
                201
            )
        })

    // POST /login - Authenticate user
    route.http()
        .config({ method: 'post', url: '/login' })
        .guards(validateBody(LoginSchema))
        .main((req: RequestService, res: ResponseService, injected) => {
            const [authSvc] = injected as [AuthService]
            const { email, password } = req.getBody<LoginDTO>()

            const user = authSvc.findUserByEmail(email)
            if (!user || !authSvc.verifyPassword(user, password)) {
                throw new RacerError({
                    statusCode: 401,
                    errorCode: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                })
            }

            const session = authSvc.createSession(user.id)
            res.success(authSvc.toAuthResponse(user, session), 'Login successful')
        })

    // GET /me - Get current user (protected)
    route.http()
        .config({ method: 'get', url: '/me' })
        .guards(isAuthenticated(authService))
        .main((req: RequestService, res: ResponseService, injected) => {
            const [authSvc] = injected as [AuthService]
            const token = req.getHeader('Authorization')!.slice(7) // Remove "Bearer "
            const session = authSvc.findSessionByToken(token)!
            const user = authSvc.findUserById(session.userId)!

            res.success(authSvc.toUserResponse(user))
        })

    // POST /logout - Invalidate session (protected)
    route.http()
        .config({ method: 'post', url: '/logout' })
        .guards(isAuthenticated(authService))
        .main((req: RequestService, res: ResponseService, injected) => {
            const [authSvc] = injected as [AuthService]
            const token = req.getHeader('Authorization')!.slice(7)
            authSvc.deleteSession(token)

            res.success(null, 'Logout successful')
        })

    return route
}
