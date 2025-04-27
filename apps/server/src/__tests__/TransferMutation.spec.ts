import request from 'supertest-graphql'
import { gql } from 'graphql-tag'
import { app } from '../server/app'
import { Account, IAccount } from '../modules/account/AccountModel'
import { toGlobalId } from 'graphql-relay'
import { Transaction } from '../modules/transaction/TransactionModel'
import { randomUUID } from 'node:crypto'
import { ObjectId } from 'mongodb'

describe('TransferMutation', () => {
  let source: IAccount
  let sourceId: string
  let destination: IAccount
  let destinationId: string

  beforeEach(async () => {
    source = await new Account({
      name: 'Main Account',
      readonlyBalance: 0
    }).save()
    sourceId = toGlobalId('Account', source.id)
    destination = await new Account({
      name: 'Destination Account',
      readonlyBalance: 0
    }).save()
    destinationId = toGlobalId('Account', destination.id)
    await new Transaction({
      description: 'Initial balance',
      entries: [
        {
          accountId: source.id,
          debit: 1000,
          credit: 0,
          description: 'Initial balance'
        }
      ],
      idempotencyKey: randomUUID()
    }).save()
    await new Transaction({
      description: 'Test transaction',
      entries: [
        {
          accountId: source.id,
          debit: 0,
          credit: 500,
          description: 'Test transaction'
        }
      ],
      idempotencyKey: randomUUID()
    }).save()
  })

  it('should return an error if the arguments are invalid', async () => {
    const response = await request(app.callback()).mutate(
      gql`
          mutation {
            Transfer(
              input: {
                amount: -100
                sourceId: "${sourceId}"
                destinationId: "${destinationId}"                    
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

    expect(response.errors).toBeDefined()
    expect(response.errors?.[0].extensions.code).toBe('BAD_USER_INPUT')
  })

  it('should return an error if the source account is invalid', async () => {
    const sourceAccount = toGlobalId('Transaction', new ObjectId().toString())
    const response = await request(app.callback())
      .mutate(
        gql`
          mutation {
            Transfer(
              input: {
                amount: 100
                sourceId: "${sourceAccount}"
                destinationId: "${destinationId}"                    
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

  it('should return an error if the destination account is invalid', async () => {
    const destinationAccount = toGlobalId(
      'Transaction',
      new ObjectId().toString()
    )

    const response = await request(app.callback())
      .mutate(
        gql`
          mutation {
            Transfer(
              input: {
                amount: 100
                sourceId: "${sourceId}"
                destinationId: "${destinationAccount}"                    
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

  it('should return an error if the source and destination accounts are the same', async () => {
    const response = await request(app.callback())
      .mutate(
        gql`
          mutation {
            Transfer(
              input: {
                amount: 100
                sourceId: "${sourceId}"
                destinationId: "${sourceId}"                    
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
    expect(response.errors?.[0].message).toBe(
      'Source and destination accounts cannot be the same'
    )
  })

  it('should return an error if the source account is not found', async () => {
    const sourceAccount = toGlobalId('Account', new ObjectId().toString())
    const response = await request(app.callback())
      .mutate(
        gql`
          mutation {
            Transfer(
              input: {
                amount: 100
                sourceId: "${sourceAccount}"
                destinationId: "${destinationId}"                    
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
    expect(response.errors?.[0].message).toBe('Source account not found')
  })

  it('should return an error if the destination account is not found', async () => {
    const destinationAccount = toGlobalId('Account', new ObjectId().toString())

    const response = await request(app.callback())
      .mutate(
        gql`
          mutation {
            Transfer(
              input: {
                amount: 100
                sourceId: "${sourceId}"
                destinationId: "${destinationAccount}"                    
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
    expect(response.errors?.[0].message).toBe('Destination account not found')
  })

  it('should return the same transaction if the idempotency key is the same and both accounts are the present in it', async () => {
    const idempotencyKey = randomUUID()

    const transaction = await new Transaction({
      description: 'Test transaction',
      entries: [
        {
          accountId: source.id,
          debit: 0,
          credit: 100,
          description: 'Test transaction'
        },
        {
          accountId: destination.id,
          debit: 100,
          credit: 0,
          description: 'Test transaction'
        }
      ],
      idempotencyKey
    }).save()

    const response = await request(app.callback())
      .mutate(
        gql`
          mutation {
            Transfer(
              input: {
                amount: 250
                sourceId: "${sourceId}"
                destinationId: "${destinationId}"                    
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
      .set('x-idempotency-key', idempotencyKey)

    expect(response.data).toBeDefined()
    expect((response.data as any)?.Transfer?.transaction.id).toBe(
      toGlobalId('Transaction', transaction.id)
    )
    expect((response.data as any)?.Transfer?.transaction.entries).toHaveLength(
      2
    )
    expect(
      (response.data as any)?.Transfer?.transaction.entries[0].accountId
    ).toBe(toGlobalId('Account', source.id))
    expect((response.data as any)?.Transfer?.transaction.entries[0].debit).toBe(
      0
    )
    expect(
      (response.data as any)?.Transfer?.transaction.entries[0].credit
    ).toBe(100)
    expect(
      (response.data as any)?.Transfer?.transaction.entries[1].accountId
    ).toBe(toGlobalId('Account', destination.id))
    expect((response.data as any)?.Transfer?.transaction.entries[1].debit).toBe(
      100
    )
    expect(
      (response.data as any)?.Transfer?.transaction.entries[1].credit
    ).toBe(0)
  })

  it('should return an error if the idempotency key is the same and the accounts are not present in it', async () => {
    const idempotencyKey = randomUUID()

    const transaction = await new Transaction({
      description: 'Test transaction',
      entries: [
        {
          accountId: source.id,
          debit: 0,
          credit: 100,
          description: 'Test transaction'
        }
      ],
      idempotencyKey
    }).save()

    const response = await request(app.callback())
      .mutate(
        gql`
          mutation {
            Transfer(
              input: {
                amount: 250
                sourceId: "${sourceId}"
                destinationId: "${destinationId}"                    
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
      .set('x-idempotency-key', idempotencyKey)

    expect(response.errors).toBeDefined()
    expect(response.errors?.[0].message).toBe(
      'Transaction already exists with this idempotency key'
    )
  })

  it('should throw an error if the source account has insufficient funds', async () => {
    const response = await request(app.callback())
      .mutate(
        gql`
          mutation {
            Transfer(
              input: {
                amount: 2000
                sourceId: "${sourceId}"
                destinationId: "${destinationId}"                    
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
            Transfer(
              input: {
                amount: 100
                sourceId: "${sourceId}"
                destinationId: "${destinationId}"                    
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

    expect(response.data).toBeDefined()
    expect((response.data as any)?.Transfer?.transaction.id).toBe(
      (response as any).data?.Transfer?.transaction.id
    )
    expect((response.data as any)?.Transfer?.transaction.entries).toHaveLength(
      2
    )
    expect(
      (response.data as any)?.Transfer?.transaction.entries[0].accountId
    ).toBe(toGlobalId('Account', source.id))
    expect((response.data as any)?.Transfer?.transaction.entries[0].debit).toBe(
      0
    )
    expect(
      (response.data as any)?.Transfer?.transaction.entries[0].credit
    ).toBe(100)
    expect(
      (response.data as any)?.Transfer?.transaction.entries[1].accountId
    ).toBe(toGlobalId('Account', destination.id))
    expect((response.data as any)?.Transfer?.transaction.entries[1].debit).toBe(
      100
    )
    expect(
      (response.data as any)?.Transfer?.transaction.entries[1].credit
    ).toBe(0)
  })
})
