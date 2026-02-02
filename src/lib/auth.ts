import jwt, { Secret, SignOptions } from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { Role } from '@/types'

interface TokenPayload {
    id: string
    role: Role
    email: string
}

export function signToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables')
    }

    const expiry = process.env.JWT_EXPIRY || '7d'

    return jwt.sign(payload, secret as Secret, { expiresIn: expiry } as SignOptions)
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        const secret = process.env.JWT_SECRET
        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables')
        }

        const decoded = jwt.verify(token, secret as Secret) as TokenPayload
        return decoded
    } catch (error) {
        return null
    }
}

export async function getTokenFromRequest(req: NextRequest): Promise<string | null> {
    // Check Authorization header first
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7)
    }

    // Fall back to cookie
    const cookieToken = req.cookies.get('projectpulse_token')
    if (cookieToken) {
        return cookieToken.value
    }

    return null
}

export async function getAuthenticatedUser(req: NextRequest): Promise<TokenPayload | null> {
    const token = await getTokenFromRequest(req)
    if (!token) {
        return null
    }

    return verifyToken(token)
}
