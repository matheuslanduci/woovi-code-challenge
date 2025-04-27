import { getDataloaders } from '../modules/loader/loaderRegister'
import { Request } from 'koa'
import { GraphQLError } from 'graphql'

export type PossibleContext = {
  idempotencyKey: string | null
}

const getContext = async (req: Request | undefined = undefined) => {
  let idempotencyKey: string | null = null

  if (req !== undefined) {
    if (req.headers['x-idempotency-key']) {
      const idempotencyKeyHeader = req.headers['x-idempotency-key']

      if (Array.isArray(idempotencyKeyHeader)) {
        throw new GraphQLError(
          'x-idempotency-key header should not be an array'
        )
      }

      idempotencyKey = idempotencyKeyHeader
    }
  }

  const dataloaders = getDataloaders()

  return {
    dataloaders,
    idempotencyKey
  } as const
}

export { getContext }
