import formbody from '@fastify/formbody'
import Fastify from 'fastify'
import dbPlugin from './plugins/db'
import envPlugin from './plugins/env'
import { healthRoutes } from './api/routes/health'
import { practiceRoutes } from './api/routes/practice'

export function buildServer() {
  const app = Fastify({ logger: true })

  app.register(formbody)
  app.register(envPlugin)
  app.register(dbPlugin)
  app.register(healthRoutes)
  app.register(practiceRoutes)

  return app
}
