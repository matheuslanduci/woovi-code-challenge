import { GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql'
import { mutationWithClientMutationId } from 'graphql-relay'
import { accountField } from '../accountFields'
import { createAccountUseCase } from '../accountUseCases'

export type AddAccountInput = {
  name: string
  initialBalance: number
}

export const AddAccountMutation = mutationWithClientMutationId({
  name: 'AddAccount',
  inputFields: {
    name: {
      description: 'Name of the account',
      type: new GraphQLNonNull(GraphQLString)
    },
    initialBalance: {
      description: 'Initial balance of the account',
      type: new GraphQLNonNull(GraphQLInt)
    }
  },
  mutateAndGetPayload: async (args: AddAccountInput) => {
    return createAccountUseCase(args)
  },
  outputFields: {
    ...accountField('account')
  }
})
