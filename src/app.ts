import express from 'express'
import cors from 'cors'
import cookie_parser from 'cookie-parser'
import { apiReference } from '@scalar/express-api-reference'

import { auth_router } from './routes/auth_routes'
import { to_do_router } from './routes/to_do_routes'
import { contact_router } from './routes/contact_routes'
import { error_handler } from './middlewares/error_handler'
import { openapi_spec } from './docs/openapi'

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
)
app.use(express.json())
app.use(cookie_parser())

app.use('/auth', auth_router)
app.use('/to-do', to_do_router)
app.use('/contact', contact_router)

app.use('/docs', apiReference({ spec: { content: openapi_spec } }))

app.use(error_handler)

export { app }
