import request from 'supertest-graphql'
import { gql } from 'graphql-tag'
import { app } from '../server/app'
import { broker } from '~/broker'

describe('AddAccountMutation', () => {
  it('should return an error when the input is invalid', async () => {
    const response = await request(app.callback()).mutate(gql`
      mutation {
        AddAccount(
          input: {
            name: "Main Account"
            initialBalance: -1
            clientMutationId: "caee36e9-2993-4861-8ba6-8a0eb65f652c"
          }
        ) {
          account {
            id
            name
            readonlyBalance
          }
        }
      }
    `)

    expect(response.errors).toBeDefined()
    expect(response.errors?.[0].extensions.code).toBe('BAD_USER_INPUT')
  })

  it('should create an account and return the account data', async () => {
    const response = await request(app.callback()).mutate(gql`
      mutation {
        AddAccount(
          input: {
            name: "Main Account"
            initialBalance: 0
            clientMutationId: "caee36e9-2993-4861-8ba6-8a0eb65f652c"
          }
        ) {
          account {
            id
            name
            readonlyBalance
          }
        }
      }
    `)

    expect(response.data).toBeDefined()
    expect((response.data as any)?.AddAccount?.account.name).toBe(
      'Main Account'
    )
    expect((response.data as any)?.AddAccount?.account.readonlyBalance).toBe(0)
  })

  it('should create an account with an initial balance and return the account data', async () => {
    const response = await request(app.callback())
      .mutate(gql`
        mutation {
          AddAccount(
            input: {
              name: "Main Account"
              initialBalance: 1000
              clientMutationId: "caee36e9-2993-4861-8ba6-8a0eb65f652c"
            }
          ) {
            account {
              id
              name
              readonlyBalance
              createdAt
              updatedAt
              transactions {
                edges {
                  node {
                    id
                    entries {
                      accountId
                      debit
                    }
                  }
                }
              }
            }
          }
        }
      `)
      .expectNoErrors()

    expect(response.data).toBeDefined()
    expect((response.data as any)?.AddAccount?.account.name).toBe(
      'Main Account'
    )
    expect((response.data as any)?.AddAccount?.account.readonlyBalance).toBe(
      1000
    )
    expect(
      (response.data as any)?.AddAccount?.account.transactions.edges
    ).toHaveLength(1)
    expect(
      (response.data as any)?.AddAccount?.account.transactions.edges[0].node
        .entries
    ).toHaveLength(1)
    expect(
      (response.data as any)?.AddAccount?.account.transactions.edges[0].node
        .entries[0].accountId
    ).toBe((response.data as any)?.AddAccount?.account.id)
    expect(
      (response.data as any)?.AddAccount?.account.transactions.edges[0].node
        .entries[0].debit
    ).toBe(1000)
  })

  it('should call the broker to publish the account.created event', async () => {
    const publishSpy = jest.spyOn(broker, 'publish')

    await request(app.callback())
      .mutate(gql`
        mutation {
          AddAccount(
            input: {
              name: "Main Account"
              initialBalance: 0
              clientMutationId: "caee36e9-2993-4861-8ba6-8a0eb65f652c"
            }
          ) {
            account {
              id
              name
              readonlyBalance
            }
          }
        }
      `)
      .expectNoErrors()

    expect(publishSpy).toHaveBeenCalledWith(
      'account.created',
      expect.any(String)
    )
  })

  it('should be able to query the account after creation', async () => {
    await request(app.callback())
      .mutate(gql`
        mutation {
          AddAccount(
            input: {
              name: "Main Account"
              initialBalance: 500
              clientMutationId: "caee36e9-2993-4861-8ba6-8a0eb65f652c"
            }
          ) {
            account {
              id
              name
              readonlyBalance
            }
          }
        }
      `)
      .expectNoErrors()

    const response = await request(app.callback())
      .query(gql`
        query {
          accounts {
            edges {
              node {
                id
                name
                readonlyBalance
              }
            }
          }
        }
      `)
      .expectNoErrors()

    expect(response.data).toBeDefined()
    expect((response.data as any)?.accounts.edges).toHaveLength(1)
    expect((response.data as any)?.accounts.edges[0].node.name).toBe(
      'Main Account'
    )
    expect((response.data as any)?.accounts.edges[0].node.readonlyBalance).toBe(
      500
    )
  })
})
