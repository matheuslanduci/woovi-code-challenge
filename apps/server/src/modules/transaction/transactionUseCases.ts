import { z } from 'zod'
import { Transaction } from './TransactionModel'
import { GraphQLError } from 'graphql'
import { randomUUID } from 'node:crypto'
import { broker } from '~/broker'
import { fromGlobalId } from 'graphql-relay'
import { Account } from '../account/AccountModel'

const getAccountBalanceResponseSchema = z.array(
  z.object({
    balance: z.number()
  })
)

export async function getAccountBalanceUseCase(accountId: string) {
  const result = await Transaction.aggregate([
    {
      $unwind: '$entries'
    },
    {
      $match: {
        'entries.accountId': accountId
      }
    },
    {
      $group: {
        _id: null,
        balance: {
          $sum: {
            $subtract: ['$entries.debit', '$entries.credit']
          }
        }
      }
    }
  ])

  const parsedResult = getAccountBalanceResponseSchema.safeParse(result)

  if (!parsedResult.success) {
    // Ideally, we should have a custom error and log to a monitoring service
    throw new GraphQLError('Internal server error')
  }

  return parsedResult.data[0].balance
}

const createInitialBalanceTransactionSchema = z.object({
  accountId: z.string(),
  amount: z.number().min(0)
})

export async function createInitialBalanceTransactionUseCase(
  args: z.infer<typeof createInitialBalanceTransactionSchema>
) {
  const parsedArgs = createInitialBalanceTransactionSchema.safeParse(args)

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

  const transaction = new Transaction({
    description: 'Initial balance',
    entries: [
      {
        accountId: data.accountId,
        debit: data.amount,
        credit: 0,
        description: 'Initial balance'
      }
    ],
    idempotencyKey: randomUUID()
  })

  await transaction.save()

  await broker.publish('transaction.created', JSON.stringify(transaction))
}

const withdrawMutationSchema = z.object({
  amount: z.number().min(0),
  sourceId: z.string(),
  idempotencyKey: z.string().uuid()
})

export async function withdrawUseCase(
  args: z.infer<typeof withdrawMutationSchema>
) {
  const parsedArgs = withdrawMutationSchema.safeParse(args)

  if (!parsedArgs.success) {
    throw new GraphQLError('Invalid input', {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidArgs: args,
        errors: parsedArgs.error.flatten().fieldErrors
      }
    })
  }

  const { sourceId, amount, idempotencyKey } = parsedArgs.data

  const parsedId = fromGlobalId(sourceId)

  if (parsedId.type !== 'Account') {
    throw new GraphQLError('Invalid ID type')
  }

  const sourceAccount = await Account.findById(parsedId.id)

  if (!sourceAccount) {
    throw new GraphQLError('Account not found')
  }

  const existingTransaction = await Transaction.findOne({
    idempotencyKey
  })

  if (existingTransaction) {
    if (
      existingTransaction.entries.some(
        (entry) => entry.accountId === sourceAccount.id
      )
    ) {
      return {
        transaction: existingTransaction._id.toString()
      }
    }

    throw new GraphQLError(
      'Transaction already exists with this idempotency key'
    )
  }

  const balance = await getAccountBalanceUseCase(sourceAccount.id)

  if (balance < amount) {
    throw new GraphQLError('Insufficient funds')
  }

  const transaction = new Transaction({
    description: 'Withdrawal',
    entries: [
      {
        accountId: sourceAccount.id,
        debit: 0,
        credit: amount,
        description: `Withdrawal from ${sourceAccount.name}`
      }
    ],
    idempotencyKey
  })

  await transaction.save()

  await Promise.all([
    broker.publish('withdrawal.created', JSON.stringify(transaction)),
    broker.publish('transaction.created', JSON.stringify(transaction))
  ])

  return {
    transaction: transaction._id.toString()
  }
}

const transferMutationSchema = z.object({
  amount: z.number().min(0),
  sourceId: z.string(),
  destinationId: z.string(),
  idempotencyKey: z.string().uuid()
})

export async function transferUseCase(
  args: z.infer<typeof transferMutationSchema>
) {
  const parsedArgs = transferMutationSchema.safeParse(args)

  if (!parsedArgs.success) {
    throw new GraphQLError('Invalid input', {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidArgs: args,
        errors: parsedArgs.error.flatten().fieldErrors
      }
    })
  }

  const { sourceId, destinationId, amount, idempotencyKey } = parsedArgs.data

  const parsedSourceId = fromGlobalId(sourceId)
  const parsedDestinationId = fromGlobalId(destinationId)

  if (
    parsedSourceId.type !== 'Account' ||
    parsedDestinationId.type !== 'Account'
  ) {
    throw new GraphQLError('Invalid ID type')
  }

  if (parsedSourceId.id === parsedDestinationId.id) {
    throw new GraphQLError('Source and destination accounts cannot be the same')
  }

  const sourceAccount = await Account.findById(parsedSourceId.id)

  if (!sourceAccount) {
    throw new GraphQLError('Source account not found')
  }

  const destinationAccount = await Account.findById(parsedDestinationId.id)

  if (!destinationAccount) {
    throw new GraphQLError('Destination account not found')
  }

  const existingTransaction = await Transaction.findOne({
    idempotencyKey
  })

  if (existingTransaction) {
    if (
      existingTransaction.entries.some(
        (entry) => entry.accountId === sourceAccount.id
      ) &&
      existingTransaction.entries.some(
        (entry) => entry.accountId === destinationAccount.id
      )
    ) {
      return {
        transaction: existingTransaction._id.toString()
      }
    }

    throw new GraphQLError(
      'Transaction already exists with this idempotency key'
    )
  }

  const balance = await getAccountBalanceUseCase(sourceAccount.id)

  if (balance < amount) {
    throw new GraphQLError('Insufficient funds')
  }

  const transaction = new Transaction({
    description: 'Transfer',
    entries: [
      {
        accountId: sourceAccount.id,
        debit: 0,
        credit: amount,
        description: `Deposit to ${sourceAccount.name}`
      },
      {
        accountId: destinationAccount.id,
        debit: amount,
        credit: 0,
        description: `Transfer from ${destinationAccount.name}`
      }
    ],
    idempotencyKey
  })

  await transaction.save()

  await Promise.all([
    broker.publish('deposit.created', JSON.stringify(transaction)),
    broker.publish('transaction.created', JSON.stringify(transaction))
  ])

  return {
    transaction: transaction._id.toString()
  }
}
