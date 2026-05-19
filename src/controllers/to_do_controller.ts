import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { ValidationError, NotFoundError } from '../errors'

const create_schema = z.object({
  text: z.string().min(1, 'Text is required.'),
})

const update_schema = z.object({
  text: z.string().min(1, 'Text is required.'),
})

export async function list_todos(req: Request, res: Response): Promise<void> {
  const todos = await prisma.todo.findMany({
    where: { user_id: req.user_id },
    orderBy: [{ done: 'asc' }, { order: 'asc' }, { created_at: 'asc' }],
  })

  res.json({ todos })
}

export async function create_todo(req: Request, res: Response): Promise<void> {
  const parsed = create_schema.safeParse(req.body)

  if (!parsed.success) {
    throw new ValidationError(
      'Invalid input data.',
      'Fix the highlighted fields and try again.',
      parsed.error.flatten().fieldErrors,
    )
  }

  const last_todo = await prisma.todo.findFirst({
    where: { user_id: req.user_id },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  const todo = await prisma.todo.create({
    data: {
      text: parsed.data.text,
      user_id: req.user_id!,
      order: (last_todo?.order ?? -1) + 1,
    },
  })

  res.status(201).json({ todo })
}

export async function update_todo(req: Request, res: Response): Promise<void> {
  const parsed = update_schema.safeParse(req.body)

  if (!parsed.success) {
    throw new ValidationError(
      'Invalid input data.',
      'Fix the highlighted fields and try again.',
      parsed.error.flatten().fieldErrors,
    )
  }

  const id = req.params.id as string
  const todo = await prisma.todo.findUnique({ where: { id } })

  if (!todo || todo.user_id !== req.user_id) {
    throw new NotFoundError('Item not found.', 'Check the ID and try again.')
  }

  const updated = await prisma.todo.update({
    where: { id },
    data: { text: parsed.data.text },
  })

  res.json({ todo: updated })
}

export async function check_todo(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const todo = await prisma.todo.findUnique({ where: { id } })

  if (!todo || todo.user_id !== req.user_id) {
    throw new NotFoundError('Item not found.', 'Check the ID and try again.')
  }

  const updated = await prisma.todo.update({
    where: { id },
    data: { done: !todo.done },
  })

  res.json({ todo: updated })
}

export async function delete_todo(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string
  const todo = await prisma.todo.findUnique({ where: { id } })

  if (!todo || todo.user_id !== req.user_id) {
    throw new NotFoundError('Item not found.', 'Check the ID and try again.')
  }

  await prisma.todo.delete({ where: { id } })

  res.status(204).send()
}
