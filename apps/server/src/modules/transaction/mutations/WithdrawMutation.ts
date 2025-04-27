import { GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { PossibleContext } from '../../../server/getContext'
import { transactionField } from '../transactionFields'
import { withdrawUseCase } from '../transactionUseCases'

type WithdrawInput = {
  amount: number
  sourceId: string
}

export const WithdrawMutation = mutationWithClientMutationId({
  name: 'Withdraw',
  inputFields: {
    amount: {
      description: 'Amount to withdraw',
      type: new GraphQLNonNull(GraphQLInt)
    },
    sourceId: {
      description: 'ID of the account to withdraw from',
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  mutateAndGetPayload: async (args: WithdrawInput, ctx: PossibleContext) => {
    return withdrawUseCase({
      amount: args.amount,
      sourceId: args.sourceId,
      idempotencyKey: ctx.idempotencyKey ?? ''
    })
  },
  outputFields: {
    ...transactionField('transaction')
  }
})
