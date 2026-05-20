import { Request, Response } from 'express'
import { z } from 'zod'
import { Todo } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { NotFoundError } from '../errors'
import { parse_or_throw } from '../utils/validate'

const TODO_SELECT = { id: true, text: true, done: true, order: true } as const

const todo_schema = z.object({
  text: z.string().trim().min(1, 'Text is required.'),
})

async function get_todo_or_throw(id: string, user_id: string): Promise<Todo> {
  const todo = await prisma.todo.findUnique({ where: { id } })
  if (!todo || todo.user_id !== user_id) {
    throw new NotFoundError('Item not found.', 'Check the ID and try again.')
  }
  return todo
}

export async function list_todos(req: Request, res: Response): Promise<void> {
  const todos = await prisma.todo.findMany({
    where: { user_id: req.user_id },
    orderBy: [{ done: 'asc' }, { order: 'asc' }, { created_at: 'asc' }],
    select: TODO_SELECT,
  })

  res.json({ todos })
}

export async function create_todo(req: Request, res: Response): Promise<void> {
  const { text } = parse_or_throw(todo_schema, req.body)

  const last_todo = await prisma.todo.findFirst({
    where: { user_id: req.user_id },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  const todo = await prisma.todo.create({
    data: {
      text,
      user_id: req.user_id as string,
      order: (last_todo?.order ?? -1) + 1,
    },
    select: TODO_SELECT,
  })

  res.status(201).json({ todo })
}

export async function update_todo(req: Request, res: Response): Promise<void> {
  const { text } = parse_or_throw(todo_schema, req.body)
  const id = req.params.id as string
  await get_todo_or_throw(id, req.user_id as string)

  const updated = await prisma.todo.update({
    where: { id },
    data: { text },
    select: TODO_SELECT,
  })

  res.json({ todo: updated })
}

export async function check_todo(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const todo = await get_todo_or_throw(id, req.user_id as string)

  const updated = await prisma.todo.update({
    where: { id },
    data: { done: !todo.done },
    select: TODO_SELECT,
  })

  res.json({ todo: updated })
}

export async function delete_todo(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  await get_todo_or_throw(id, req.user_id as string)

  await prisma.todo.delete({ where: { id } })

  res.status(204).send()
}
