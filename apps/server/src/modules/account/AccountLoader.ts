import { createLoader } from '@entria/graphql-mongo-helpers'
import { Account } from './AccountModel'
import { registerLoader } from '../loader/loaderRegister'

const { Wrapper, getLoader, clearCache, load, loadAll } = createLoader({
  model: Account,
  loaderName: 'AccountLoader'
})

registerLoader('AccountLoader', getLoader)

export const AccountLoader = {
  Account: Wrapper,
  getLoader,
  clearCache,
  load,
  loadAll
}
