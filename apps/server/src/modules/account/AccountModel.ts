import type { Document, Model } from 'mongoose'
import mongoose from 'mongoose'

// All accounts are of the type 'asset' in the system, so debit means adding
// money and credit means removing money.
const Schema = new mongoose.Schema<IAccount>(
  {
    name: {
      type: String,
      description: 'The name of the account'
    },
    readonlyBalance: {
      type: Number,
      description: 'The balance of the account in cents'
    }
  },
  {
    collection: 'Account',
    timestamps: true
  }
)

export type IAccount = {
  name: string
  // To avoid recalculating every-read, we store a readonly version
  // of the account balance in the account
  readonlyBalance: number
  createdAt: Date
  updatedAt: Date
} & Document

export const Account: Model<IAccount> = mongoose.model('Account', Schema)
