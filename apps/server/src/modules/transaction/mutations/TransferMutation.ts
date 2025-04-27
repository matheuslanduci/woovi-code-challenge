import { GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { transactionField } from '../transactionFields'
import { PossibleContext } from '../../../server/getContext'
import { transferUseCase } from '../transactionUseCases'

export type TransferInput = {
  amount: number
  sourceId: string
  destinationId: string
}

export const TransferMutation = mutationWithClientMutationId({
  name: 'Transfer',
  inputFields: {
    amount: {
      description: 'The amount to transfer in cents',
      type: new GraphQLNonNull(GraphQLInt)
    },
    sourceId: {
      description: 'ID of the account to withdraw from',
      type: new GraphQLNonNull(GraphQLString)
    },
    destinationId: {
      description: 'ID of the account to deposit to',
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  mutateAndGetPayload: async (args: TransferInput, ctx: PossibleContext) => {
    return transferUseCase({
      amount: args.amount,
      sourceId: args.sourceId,
      destinationId: args.destinationId,
      idempotencyKey: ctx.idempotencyKey ?? ''
    })
  },
  outputFields: {
    ...transactionField('transaction')
  }
})
