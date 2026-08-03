import crypto from 'crypto'
import type { User, Session, RegisterDTO, UserResponseDTO, AuthResponseDTO } from '../types/user.types.js'

/**
 * AuthService - Business logic untuk authentication
 * Menggunakan in-memory store sebagai pengganti database
 */
export class AuthService {
    private users: User[] = []
    private sessions: Session[] = []

    // === User Operations ===

    findUserByEmail(email: string): User | undefined {
        return this.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    }

    findUserById(id: string): User | undefined {
        return this.users.find(u => u.id === id)
    }

    createUser(dto: RegisterDTO): User {
        const now = new Date()
        const user: User = {
            id: crypto.randomUUID(),
            email: dto.email.toLowerCase(),
            name: dto.name,
            passwordHash: this.hashPassword(dto.password),
            createdAt: now,
            updatedAt: now
        }
        this.users.push(user)
        return user
    }

    verifyPassword(user: User, password: string): boolean {
        return user.passwordHash === this.hashPassword(password)
    }

    // === Session Operations ===

    createSession(userId: string): Session {
        const session: Session = {
            token: crypto.randomBytes(32).toString('hex'),
            userId,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
        }
        this.sessions.push(session)
        return session
    }

    findSessionByToken(token: string): Session | undefined {
        return this.sessions.find(
            s => s.token === token && s.expiresAt > new Date()
        )
    }

    deleteSession(token: string): boolean {
        const index = this.sessions.findIndex(s => s.token === token)
        if (index === -1) return false
        this.sessions.splice(index, 1)
        return true
    }

    // === DTO Helpers ===

    toUserResponse(user: User): UserResponseDTO {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        }
    }

    toAuthResponse(user: User, session: Session): AuthResponseDTO {
        return {
            user: this.toUserResponse(user),
            token: session.token,
            expiresAt: session.expiresAt
        }
    }

    // === Private Helpers ===

    private hashPassword(password: string): string {
        return crypto.createHash('sha256').update(password).digest('hex')
    }
}
