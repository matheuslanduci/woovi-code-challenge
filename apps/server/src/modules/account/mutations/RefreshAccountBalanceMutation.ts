import { mutationWithClientMutationId } from 'graphql-relay'
import { accountField } from '../accountFields'
import { GraphQLNonNull, GraphQLString } from 'graphql'
import { refreshAccountBalanceUseCase } from '../accountUseCases'

export type RefreshAccountBalanceInput = {
  sourceId: string
}

export const RefreshAccountBalanceMutation = mutationWithClientMutationId({
  name: 'RefreshAccountBalance',
  inputFields: {
    sourceId: {
      description: 'ID of the account to refresh',
      type: new GraphQLNonNull(GraphQLString)
    }
  },
  mutateAndGetPayload: async (args: RefreshAccountBalanceInput) => {
    return refreshAccountBalanceUseCase(args)
  },
  outputFields: {
    ...accountField('account')
  }
})
