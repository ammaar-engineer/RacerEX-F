/**
 * User domain types
 */
export interface User {
    id: string
    email: string
    name: string
    passwordHash: string
    createdAt: Date
    updatedAt: Date
}

export interface Session {
    token: string
    userId: string
    expiresAt: Date
}

/**
 * DTOs
 */
export interface RegisterDTO {
    email: string
    password: string
    name: string
}

export interface LoginDTO {
    email: string
    password: string
}

export interface UserResponseDTO {
    id: string
    email: string
    name: string
    createdAt: Date
}

export interface AuthResponseDTO {
    user: UserResponseDTO
    token: string
    expiresAt: Date
}
