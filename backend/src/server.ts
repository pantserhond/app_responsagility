import formbody from '@fastify/formbody'
import Fastify from 'fastify'
import dbPlugin from './plugins/db'
import envPlugin from './plugins/env'
import authPlugin from './plugins/auth'
import { healthRoutes } from './api/routes/health'
import { practiceRoutes } from './api/routes/practice'
import { accountRoutes } from './api/routes/account'
import { scheduleWeeklySummaries } from './schedulers/weeklySummaries'

export function buildServer() {
  const app = Fastify({ logger: true })

  app.register(formbody)
  app.register(envPlugin)
  app.register(dbPlugin)
  app.register(authPlugin)
  app.register(healthRoutes)
  app.register(practiceRoutes)
  app.register(accountRoutes)

  app.ready().then(() => scheduleWeeklySummaries(app))

  return app
}
