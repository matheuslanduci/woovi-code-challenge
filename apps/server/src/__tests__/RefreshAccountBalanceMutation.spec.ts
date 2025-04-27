import request from 'supertest-graphql'
import { gql } from 'graphql-tag'
import { app } from '../server/app'
import { Account, IAccount } from '../modules/account/AccountModel'
import { Transaction } from '../modules/transaction/TransactionModel'
import { toGlobalId } from 'graphql-relay'
import { ObjectId } from 'mongodb'

describe('RefreshAccountBalanceMutation', () => {
  let account: IAccount
  let accountId: string

  beforeEach(async () => {
    account = await new Account({
      name: 'Main Account',
      readonlyBalance: 0
    }).save()
    accountId = toGlobalId('Account', account.id)
    await new Transaction({
      description: 'Initial balance',
      entries: [
        {
          accountId: account.id,
          debit: 1000,
          credit: 0,
          description: 'Initial balance'
        }
      ]
    }).save()
    await new Transaction({
      description: 'Test transaction',
      entries: [
        {
          accountId: account.id,
          debit: 0,
          credit: 500,
          description: 'Test transaction'
        }
      ]
    }).save()
  })

  it('should refresh the account balance and return the account data', async () => {
    const response = await request(app.callback())
      .mutate(
        gql`
        mutation {
          RefreshAccountBalance(
            input: { 
              clientMutationId: "caee36e9-2993-4861-8ba6-8a0eb65f652c",
              sourceId: "${accountId}"
            }             
          ) {
            account {
              id
              name
              readonlyBalance
            }
          }
        }
      `
      )
      .expectNoErrors()

    expect(response.data).toBeDefined()
    expect(
      (response as any).data?.['RefreshAccountBalance']?.account.name
    ).toBe('Main Account')
    expect(
      (response as any).data?.['RefreshAccountBalance']?.account.readonlyBalance
    ).toBe(500)
  })

  it('should throw an error if the id is not of type Account', async () => {
    const accountId = toGlobalId('Transaction', account.id)

    const response = await request(app.callback()).mutate(
      gql`
        mutation {
          RefreshAccountBalance(
            input: { 
              clientMutationId: "caee36e9-2993-4861-8ba6-8a0eb65f652c",
              sourceId: "${accountId}"
            }             
          ) {
            account {
              id
              name
              readonlyBalance
            }
          }
        }
      `
    )

    expect(response.errors).toBeDefined()
    expect((response as any).errors[0].message).toBe('Invalid ID type')
  })

  it('should throw an error if the account is not found', async () => {
    const accountId = toGlobalId('Account', new ObjectId().toString())

    const response = await request(app.callback()).mutate(
      gql`
        mutation {
          RefreshAccountBalance(
            input: { 
              clientMutationId: "caee36e9-2993-4861-8ba6-8a0eb65f652c",
              sourceId: "${accountId}"
            }             
          ) {
            account {
              id
              name
              readonlyBalance
            }
          }
        }
      `
    )

    expect(response.errors).toBeDefined()
    expect((response as any).errors[0].message).toBe('Account not found')
  })
})
