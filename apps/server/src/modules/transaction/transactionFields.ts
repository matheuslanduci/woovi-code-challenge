import { connectionArgs } from 'graphql-relay'
import { TransactionLoader } from './TransactionLoader'
import { TransactionConnection, TransactionType } from './TransactionType'
import { BaseContext } from '@entria/graphql-mongo-helpers/lib/createLoader'
import { ITransaction } from './TransactionModel'

export const transactionField = (key: string) => ({
  [key]: {
    type: TransactionType,
    resolve: async (
      obj: Record<string, unknown>,
      _: unknown,
      context: BaseContext<'TransactionLoader', ITransaction>
    ) => TransactionLoader.load(context, obj.transaction as string)
  }
})

export const transactionConnectionField = (key: string) => ({
  [key]: {
    type: TransactionConnection.connectionType,
    args: {
      ...connectionArgs
    },
    resolve: async (
      _: Record<string, unknown>,
      args: unknown,
      context: unknown
    ) => {
      return await TransactionLoader.loadAll(context, args)
    }
  }
})
