import {
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import { ITransaction, ITransactionEntry } from './TransactionModel'
import { connectionDefinitions, globalIdField, toGlobalId } from 'graphql-relay'
import { nodeInterface, registerTypeLoader } from '../node/typeRegister'
import { TransactionLoader } from './TransactionLoader'
import { AccountType } from '../account/AccountType'
import { AccountLoader } from '../account/AccountLoader'

export const TransactionEntryType = new GraphQLObjectType<ITransactionEntry>({
  name: 'TransactionEntry',
  description: 'Represents a transaction entry',
  fields: () => ({
    accountId: {
      type: GraphQLString,
      resolve: (entry) => toGlobalId('Account', entry.accountId)
    },
    account: {
      type: AccountType,
      resolve: async (entry, ctx) => {
        return AccountLoader.load(ctx, entry.accountId)
      }
    },
    debit: {
      type: GraphQLInt,
      resolve: (entry) => entry.debit
    },
    credit: {
      type: GraphQLInt,
      resolve: (entry) => entry.credit
    },
    description: {
      type: GraphQLString,
      resolve: (entry) => entry.description
    }
  })
})

export const TransactionType = new GraphQLObjectType<ITransaction>({
  name: 'Transaction',
  description: 'Represents a transaction',
  fields: () => ({
    id: globalIdField('Transaction'),
    description: {
      type: GraphQLString,
      resolve: (transaction) => transaction.description
    },
    entries: {
      type: new GraphQLList(TransactionEntryType),
      resolve: (transaction) => transaction.entries
    },
    createdAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (transaction) => transaction.createdAt.toISOString()
    },
    updatedAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (transaction) => transaction.updatedAt.toISOString()
    }
  }),
  interfaces: () => [nodeInterface]
})

export const TransactionConnection = connectionDefinitions({
  name: 'Transaction',
  nodeType: TransactionType
})

registerTypeLoader(TransactionType, TransactionLoader.load)
