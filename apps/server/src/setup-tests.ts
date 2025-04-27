import { Account } from './modules/account/AccountModel'
import { Transaction } from './modules/transaction/TransactionModel'
import { connectDatabase } from './database'
import mongoose from 'mongoose'
import { broker } from './broker'

beforeAll(async () => {
  await connectDatabase()
})

afterAll(async () => {
  await mongoose.disconnect()
  broker.disconnect()
})

beforeEach(async () => {
  await Account.deleteMany({})
  await Transaction.deleteMany({})
})

afterEach(async () => {
  await Account.deleteMany({})
  await Transaction.deleteMany({})
})
