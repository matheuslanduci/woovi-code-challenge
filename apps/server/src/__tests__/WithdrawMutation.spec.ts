import request from 'supertest-graphql'
import { gql } from 'graphql-tag'
import { app } from '../server/app'
import { Account, IAccount } from '../modules/account/AccountModel'
import { Transaction } from '../modules/transaction/TransactionModel'
import { toGlobalId } from 'graphql-relay'
import { randomUUID } from 'node:crypto'
import { ObjectId } from 'mongodb'
import { broker } from '~/broker'

describe('WithdrawMutation', () => {
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

  it('should return an error if the arguments are invalid', async () => {
    const response = await request(app.callback())
      .mutate(
        gql`
        mutation {
          Withdraw(
            input: {
              sourceId: "${accountId}",
              amount: -100,
              clientMutationId: "${randomUUID()}"
            }
          ) {
            transaction {
              id
              description
              entries {
                accountId
                debit
                credit
                description
              }
            }
          }
        }
      `
      )
      .set('x-idempotency-key', randomUUID())

    expect(response.errors).toBeDefined()
    expect(response.errors?.[0].extensions.code).toBe('BAD_USER_INPUT')
  })

  it('should return an error if the account id is invalid', async () => {
    const accountId = toGlobalId('Transaction', new ObjectId().toString())
    const response = await request(app.callback())
      .mutate(
        gql`
        mutation {
          Withdraw(
            input: {
              sourceId: "${accountId}",
              amount: 100,
              clientMutationId: "${randomUUID()}"
            }
          ) {
            transaction {
              id
              description
              entries {
                accountId
                debit
                credit
                description
              }
            }
          }
        }
      `
      )
      .set('x-idempotency-key', randomUUID())

    expect(response.errors).toBeDefined()
    expect(response.errors?.[0].message).toBe('Invalid ID type')
  })

  it('should return an error if the account is not found', async () => {
    const accountId = toGlobalId('Account', new ObjectId().toString())
    const response = await request(app.callback())
      .mutate(
        gql`
        mutation {
          Withdraw(
            input: {
              sourceId: "${accountId}",
              amount: 100,
              clientMutationId: "${randomUUID()}"
            }
          ) {
            transaction {
              id
              description
              entries {
                accountId
                debit
                credit
                description
              }
            }
          }
        }
      `
      )
      .set('x-idempotency-key', randomUUID())

    expect(response.errors).toBeDefined()
    expect(response.errors?.[0].message).toBe('Account not found')
  })

  it('should return an error if the transaction already exists with the idempotency key', async () => {
    const uuid = randomUUID()

    await new Transaction({
      description: 'Test transaction',
      entries: [
        {
          accountId: new ObjectId(),
          debit: 500,
          credit: 0,
          description: 'Test transaction'
        }
      ],
      idempotencyKey: uuid
    }).save()

    const response = await request(app.callback())
      .mutate(
        gql`
        mutation {
          Withdraw(
            input: {
              sourceId: "${accountId}",
              amount: 100,
              clientMutationId: "${uuid}"
            }
          ) {
            transaction {
              id
              description
              entries {
                accountId
                debit
                credit
                description
              }
            }
          }
        }
      `
      )
      .set('x-idempotency-key', uuid)

    expect(response.errors).toBeDefined()
    expect(response.errors?.[0].message).toBe(
      'Transaction already exists with this idempotency key'
    )
  })

  it('should return the same transaction if the idempotency key is the same but the account is present in the entries', async () => {
    const uuid = randomUUID()

    const transaction = await new Transaction({
      description: 'Test transaction',
      entries: [
        {
          accountId: account.id,
          debit: 500,
          credit: 0,
          description: 'Test transaction'
        }
      ],
      idempotencyKey: uuid
    }).save()

    const response = await request(app.callback())
      .mutate(
        gql`
        mutation {
          Withdraw(
            input: {
              sourceId: "${accountId}",
              amount: 100,
              clientMutationId: "${uuid}"
            }
          ) {
            transaction {
              id
              description
              entries {
                accountId
                debit
                credit
                description
              }
            }
          }
        }
      `
      )
      .set('x-idempotency-key', uuid)
      .expectNoErrors()

    expect(response.data).toBeDefined()
    expect((response.data as any)?.Withdraw?.transaction.id).toBe(
      toGlobalId('Transaction', transaction._id.toString())
    )
    expect(
      (response.data as any)?.Withdraw?.transaction.entries[0].accountId
    ).toBe(toGlobalId('Account', account.id))
  })

  it('should return an error if the account has insufficient funds', async () => {
    const response = await request(app.callback())
      .mutate(
        gql`
        mutation {
          Withdraw(
            input: {
              sourceId: "${accountId}",
              amount: 2000,
              clientMutationId: "${randomUUID()}"
            }
          ) {
            transaction {
              id
              description
              entries {
                accountId
                debit
                credit
                description
              }
            }
          }
        }
      `
      )
      .set('x-idempotency-key', randomUUID())

    expect(response.errors).toBeDefined()
    expect(response.errors?.[0].message).toBe('Insufficient funds')
  })

  it('should return the transaction data', async () => {
    const response = await request(app.callback())
      .mutate(
        gql`
        mutation {
          Withdraw(
            input: {
              sourceId: "${accountId}",
              amount: 100,
              clientMutationId: "${randomUUID()}"
            }
          ) {
            transaction {
              id
              description
              entries {
                accountId
                debit
                credit
                description
              }
            }
          }
        }
      `
      )
      .set('x-idempotency-key', randomUUID())
      .expectNoErrors()

    expect(response.data).toBeDefined()
    expect((response.data as any)?.Withdraw?.transaction.id).toBeDefined()
    expect((response.data as any)?.Withdraw?.transaction.description).toBe(
      'Withdrawal'
    )
    expect((response.data as any)?.Withdraw?.transaction.entries[0].debit).toBe(
      0
    )
    expect(
      (response.data as any)?.Withdraw?.transaction.entries[0].credit
    ).toBe(100)
    expect(
      (response.data as any)?.Withdraw?.transaction.entries[0].description
    ).toBe(`Withdrawal from ${account.name}`)
  })

  it('should call the broker with the events', async () => {
    const publishSpy = jest.spyOn(broker, 'publish')

    await request(app.callback())
      .mutate(
        gql`
        mutation {
          Withdraw(
            input: {
              sourceId: "${accountId}",
              amount: 100,
              clientMutationId: "${randomUUID()}"
            }
          ) {
            transaction {
              id
              description
              entries {
                accountId
                debit
                credit
                description
              }
            }
          }
        }
      `
      )
      .set('x-idempotency-key', randomUUID())
      .expectNoErrors()

    expect(publishSpy).toHaveBeenCalledWith(
      'withdrawal.created',
      expect.any(String)
    )
  })
})
