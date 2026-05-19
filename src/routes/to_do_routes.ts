import { Router } from 'express'
import {
  list_todos,
  create_todo,
  update_todo,
  check_todo,
  delete_todo,
} from '../controllers/to_do_controller'
import { auth_middleware } from '../middlewares/auth_middleware'

const to_do_router = Router()

to_do_router.use(auth_middleware)

to_do_router.get('/', list_todos)
to_do_router.post('/', create_todo)
to_do_router.put('/:id', update_todo)
to_do_router.patch('/:id/check', check_todo)
to_do_router.delete('/:id', delete_todo)

export { to_do_router }
