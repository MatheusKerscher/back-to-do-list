import { prisma } from '../src/lib/prisma'

jest.mock('axios', () => ({ post: jest.fn().mockResolvedValue({}) }))

beforeEach(async () => {
  await prisma.todo.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
