import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import cors from 'kcors'
import { graphqlHTTP } from 'koa-graphql'
import Router from 'koa-router'

import { schema } from '../schema/schema'
import { getContext } from './getContext'
import { createWebsocketMiddleware } from './websocketMiddleware'
import KoaLogger from 'koa-logger'

const app = new Koa()

app.use(cors({ origin: '*' }))

if (process.env.NODE_ENV !== 'test') {
  app.use(KoaLogger())
}

app.use(
  bodyParser({
    onerror(err, ctx) {
      ctx.throw(err, 422)
    }
  })
)

app.use(createWebsocketMiddleware())

const routes = new Router()

// routes.all('/graphql/ws', wsServer);

routes.all(
  '/graphql',
  graphqlHTTP(async (req) => ({
    schema,
    graphiql: {
      headerEditorEnabled: true,
      shouldPersistHeaders: true
    },
    context: await getContext(req)
  }))
)

app.use(routes.routes())
app.use(routes.allowedMethods())

export { app }
