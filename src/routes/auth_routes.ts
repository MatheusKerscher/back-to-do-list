import { Router } from 'express'
import { register, login, logout, me } from '../controllers/auth_controller'
import { auth_middleware } from '../middlewares/auth_middleware'

const auth_router = Router()

auth_router.post('/register', register)
auth_router.post('/login', login)
auth_router.post('/logout', logout)
auth_router.get('/me', auth_middleware, me)

export { auth_router }
