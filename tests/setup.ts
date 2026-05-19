import { prisma } from '../src/lib/prisma'

beforeEach(async () => {
  await prisma.todo.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
