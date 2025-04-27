import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import { IAccount } from './AccountModel'
import {
  connectionArgs,
  connectionDefinitions,
  globalIdField
} from 'graphql-relay'
import { nodeInterface, registerTypeLoader } from '../node/typeRegister'
import { AccountLoader } from './AccountLoader'
import { TransactionConnection } from '../transaction/TransactionType'
import { TransactionLoader } from '../transaction/TransactionLoader'

export const AccountType = new GraphQLObjectType<IAccount>({
  name: 'Account',
  description: 'Represents an account',
  fields: () => ({
    id: globalIdField('Account'),
    name: {
      type: GraphQLString,
      resolve: (account) => account.name
    },
    readonlyBalance: {
      type: GraphQLInt,
      resolve: (account) => account.readonlyBalance
    },
    createdAt: {
      type: GraphQLString,
      resolve: (account) => account.createdAt.toISOString()
    },
    updatedAt: {
      type: GraphQLString,
      resolve: (account) => account.updatedAt.toISOString()
    },
    transactions: {
      type: TransactionConnection.connectionType,
      args: {
        ...connectionArgs
      },
      resolve: async (account, args, context) => {
        return TransactionLoader.loadAll(context, {
          filters: {
            'entries.accountId': account._id.toString()
          },
          ...args
        })
      }
    }
  }),
  interfaces: () => [nodeInterface]
})

export const AccountConnection = connectionDefinitions({
  name: 'Account',
  nodeType: AccountType
})

registerTypeLoader(AccountType, AccountLoader.load)
