import { execute, subscribe, validate, parse } from 'graphql'
import { useServer } from 'graphql-ws/lib/use/ws'

import { schema } from '../schema/schema'
import { getContext } from './getContext'
import { Context } from 'koa'

export type ConnectionParams = { Authorization: string }

type WsContext = {
  connectionInitReceived: boolean
  acknowledged: boolean
  subscriptions: any
  extra: { socket: [WebSocket]; request: any }
  connectionParams: ConnectionParams
}

export const ws = async (ctx: Context) => {
  if (ctx.wss) {
    // handle upgrade
    const client = await ctx.ws()

    useServer(
      {
        schema,
        context: async (wsContext: WsContext) => getContext(),
        execute,
        subscribe,
        // @ts-ignore
        onConnect: async (wsContext: WsContext) => {},
        // @ts-ignore
        onSubscribe: async (wsContext: WsContext, message) => {
          const { operationName, query, variables } = message.payload

          const document = typeof query === 'string' ? parse(query) : query

          const args = {
            schema,
            contextValue: {},
            operationName,
            document,
            variableValues: variables
          }

          const validationErrors = validate(args.schema, args.document)

          if (validationErrors.length > 0) {
            return validationErrors // return `GraphQLError[]` to send `ErrorMessage` and stop Subscription
          }

          return args
        }
        // onNext: async ({ connectionParams }) => {
        //   const token = getTokenFromConnectionParams(connectionParams);

        //   if (!(await isTokenValid(token))) {
        //     return ctx.extra.socket.close(4403, 'Forbidden');
        //   }
        // },
        // onError: (ctx, msg, errors) => {
        //   console.error('Error', { ctx, msg, errors });
        // },
        // onComplete: (ctx, msg) => {
        //   console.log('Complete', { ctx, msg });
        // },
      },
      ctx.wss
    )

    // connect to websocket
    ctx.wss.emit('connection', client, ctx.req)
  }
}
