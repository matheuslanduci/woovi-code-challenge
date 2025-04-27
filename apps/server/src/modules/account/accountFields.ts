import { connectionArgs } from 'graphql-relay'
import { AccountLoader } from './AccountLoader'
import { AccountConnection, AccountType } from './AccountType'
import { IAccount } from './AccountModel'
import { BaseContext } from '@entria/graphql-mongo-helpers/lib/createLoader'

export const accountField = (key: string) => ({
  [key]: {
    type: AccountType,
    resolve: async (
      parent: Record<string, unknown>,
      _: unknown,
      context: BaseContext<'AccountLoader', IAccount>
    ) => {
      return AccountLoader.load(context, parent.account as string)
    }
  }
})

export const accountConnectionField = (key: string) => ({
  [key]: {
    type: AccountConnection.connectionType,
    args: {
      ...connectionArgs
    },
    resolve: async (_: unknown, args: unknown, context: unknown) => {
      return await AccountLoader.loadAll(context, args)
    }
  }
})
