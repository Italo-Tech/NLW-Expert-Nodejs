import {z} from "zod";
import {prisma} from "../lib/prisma";
import {FastifyInstance} from "fastify";

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

        return reply.send({ poll })
    })
}
