import { createLoader } from '@entria/graphql-mongo-helpers'
import { Transaction } from './TransactionModel'
import { registerLoader } from '../loader/loaderRegister'

const { Wrapper, getLoader, clearCache, load, loadAll } = createLoader({
  model: Transaction,
  loaderName: 'TransactionLoader'
})

registerLoader('TransactionLoader', getLoader)

export const TransactionLoader = {
  Transaction: Wrapper,
  getLoader,
  clearCache,
  load,
  loadAll
}
