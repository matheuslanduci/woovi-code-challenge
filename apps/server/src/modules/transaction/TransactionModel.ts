import type { Document, Model } from 'mongoose'
import mongoose from 'mongoose'

const Schema = new mongoose.Schema<ITransaction>(
  {
    description: {
      type: String,
      description: 'The description of the transaction'
    },
    entries: [
      {
        accountId: {
          type: String,
          description: 'The ID of the account'
        },
        debit: {
          type: Number,
          description: 'The amount to debit in cents'
        },
        credit: {
          type: Number,
          description: 'The amount to credit in cents'
        },
        description: {
          type: String,
          description: 'The description of the entry'
        }
      }
    ],
    idempotencyKey: {
      type: String,
      description: 'The idempotency key of the transaction',
      unique: true
    }
  },
  {
    collection: 'Transaction',
    timestamps: true
  }
)

export type ITransactionEntry = {
  accountId: string
  debit: number
  credit: number
  description: string
}

export type ITransaction = {
  description: string
  entries: ITransactionEntry[]
  idempotencyKey: string
  createdAt: Date
  updatedAt: Date
} & Document

export const Transaction: Model<ITransaction> = mongoose.model(
  'Transaction',
  Schema
)
