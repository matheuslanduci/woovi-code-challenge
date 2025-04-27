import http from 'http'
import { Context, Next } from 'koa'

import { Server, WebSocket, WebSocketServer as WSWebSocketServer } from 'ws'

// work with commonjs and esm
const WebSocketServer = WSWebSocketServer

export const createWebsocketMiddleware = (
  propertyName = 'ws',
  options: {
    server?: http.Server | typeof WebSocketServer
    wsOptions?: Record<string, unknown>
  } = {}
) => {
  if (options instanceof http.Server) options = { server: options }

  // const wsServers = new WeakMap();
  const wsServers: Record<string, unknown> = {}

  const getOrCreateWebsocketServer = (url: string) => {
    // const server = wsServers.get(url);
    const server = wsServers[url] || null

    if (server) {
      return server as Server<typeof WebSocket, typeof http.IncomingMessage>
    }

    const newServer = new WebSocketServer({
      ...(options.wsOptions || {}),
      noServer: true
    })

    wsServers[url] = newServer
    // wsServers.set(url, newServer);

    return newServer
  }

  const websocketMiddleware = async (ctx: Context, next: Next) => {
    const upgradeHeader = (ctx.request.headers.upgrade || '')
      .split(',')
      .map((s) => s.trim())

    if (~upgradeHeader.indexOf('websocket')) {
      const wss = getOrCreateWebsocketServer(ctx.url)

      ctx[propertyName] = () =>
        new Promise((resolve) => {
          wss.handleUpgrade(
            ctx.req,
            ctx.request.socket,
            Buffer.alloc(0),
            (ws) => {
              wss.emit('connection', ws, ctx.req)
              resolve(ws)
            }
          )
          ctx.respond = false
        })
      ctx.wss = wss
    }

    await next()
  }

  return websocketMiddleware
}
