import fp from 'fastify-plugin'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { FastifyRequest, FastifyReply } from 'fastify'

export interface AuthUser {
  id: string
  email: string
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser
  }
}

export default fp(async (app) => {
  const supabaseUrl = app.env.supabase.url
  const jwksUrl = new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`)
  const JWKS = createRemoteJWKSet(jwksUrl)

  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `${supabaseUrl}/auth/v1`,
        audience: 'authenticated',
      })

      // Extract user info from JWT payload
      const user: AuthUser = {
        id: payload.sub as string,
        email: payload.email as string,
      }

      request.user = user
    } catch (error) {
      app.log.error('JWT verification failed:', error)
      return reply.status(401).send({ error: 'Invalid or expired token' })
    }
  }

  app.decorate('authenticate', authenticate)
})
