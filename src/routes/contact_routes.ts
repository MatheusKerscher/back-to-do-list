import { Router } from 'express'
import { contact } from '../controllers/contact_controller'

const contact_router = Router()

contact_router.post('/', contact)

export { contact_router }
