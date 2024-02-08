import {z} from "zod";
import {prisma} from "../lib/prisma";
import {FastifyInstance} from "fastify";
import {redis} from "../lib/redis";

export async function getPoll(app: FastifyInstance) {
    app.get('/polls/:pollId', async (request, reply) => {
        // Formado desejado
        const getPollParams = z.object({
            pollId: z.string().uuid(),
        })

        // Vai pegar meu createPollBody e verificar se ele está no formato informado
        const { pollId } = getPollParams.parse(request.params)

        const poll = await prisma.poll.findUnique({
            where: {
                id: pollId,
            },
            /*Seleciono os dados que gostaria de trazer junto com o Poll
            * Poderia deixar como está o trecho abaixo mas ele traria também o id do poll em cada option (dado desnecessário),
            * pois ele já vem no Poll*/
            /*include: {
                options: true
            }*/

            /*Aqui eu especifico somente o que quero trazer das options*/
            include: {
                options: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        })

        if(!poll) {
            return reply.status(400).send({ message: 'Poll not found' })
        }

        /*O retorno do redis traz a pontuacao de cada opçao*/
        const result = await redis.zrange(pollId, 0, -1, 'WITHSCORES')

        const votes = result.reduce((obj, line, index) => {
            if(index % 2 === 0) {
                const score = result[index + 1]

                Object.assign(obj, { [line]: Number(score) })
            }

            return obj
        }, {} as Record<string, number>)

        return reply.send({
            poll: {
                id: poll.id,
                title: poll.title,
                options: poll.options.map(option => {
                    return {
                        id: option.id,
                        title: option.title,
                        score: (option.id in votes) ? votes[option.id] : 0
                    }
                })
            }
        })
    })
}
