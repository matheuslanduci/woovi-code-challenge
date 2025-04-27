import { GraphQLError } from 'graphql'
import { z } from 'zod'
import { Account } from './AccountModel'
import { broker } from '~/broker'
import {
  createInitialBalanceTransactionUseCase,
  getAccountBalanceUseCase
} from '../transaction/transactionUseCases'
import { fromGlobalId } from 'graphql-relay'

const addMutationSchema = z.object({
  name: z.string().max(100),
  initialBalance: z.number().min(0).max(10_000_00)
})

export async function createAccountUseCase(
  args: z.infer<typeof addMutationSchema>
) {
  const parsedArgs = addMutationSchema.safeParse(args)

  if (!parsedArgs.success) {
    throw new GraphQLError('Invalid input', {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidArgs: args,
        errors: parsedArgs.error.flatten().fieldErrors
      }
    })
  }

  const { data } = parsedArgs

  const account = new Account({
    name: data.name,
    readonlyBalance: data.initialBalance
  })

  await account.save()

  if (data.initialBalance > 0) {
    await createInitialBalanceTransactionUseCase({
      accountId: account.id,
      amount: data.initialBalance
    })
  }

  await broker.publish('account.created', JSON.stringify(account))

  return {
    account: account.id.toString()
  }
}

const refreshAccountBalanceSchema = z.object({
  sourceId: z.string()
})

export async function refreshAccountBalanceUseCase(
  args: z.infer<typeof refreshAccountBalanceSchema>
) {
  const parsedId = fromGlobalId(args.sourceId)

  if (parsedId.type !== 'Account') {
    throw new GraphQLError('Invalid ID type')
  }

  const sourceAccount = await Account.findById(parsedId.id)

  if (!sourceAccount) {
    throw new GraphQLError('Account not found')
  }

  const balance = await getAccountBalanceUseCase(sourceAccount.id)

  sourceAccount.readonlyBalance = balance
  await sourceAccount.save()

  return {
    account: sourceAccount.id
  }
}
