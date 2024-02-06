import fastify from "fastify";
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const app = fastify()

const prisma = new PrismaClient()

app.post('/polls', async (request, reply) => {
    // Formado desejado
    const createPollBody = z.object({
        title: z.string()
    })

    // Vai pegar meu createPollBody e verificar se ele está no formato informado
    const { title } = createPollBody.parse(request.body)

    const poll = await prisma.poll.create({
        data: {
            title,
        }
    })

    return reply.status(201).send({ pollId: poll.id })
})

app.listen({ port: 3333 }).then(() => {
    console.log('HTTPS server running')
})


