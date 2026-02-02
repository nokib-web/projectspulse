import { NextResponse } from 'next/server'

export async function POST() {
    const response = NextResponse.json(
        { success: true },
        { status: 200 }
    )

    // Clear the cookie
    response.cookies.set('projectpulse_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
    })

    return response
}
