import { Elysia, t } from 'elysia'
import { websocket } from '@elysiajs/websocket'
import { compile as c } from '../src'

import { initTRPC } from '@trpc/server'
import { observable } from '@trpc/server/observable'
import { EventEmitter } from 'stream'

const p = initTRPC.create()
const ee = new EventEmitter()

const router = p.router({
    mirror: p.procedure.input(c(t.String())).query(({ input }) => {
        ee.emit('listen', input)

        return input
    }),
    listen: p.procedure.subscription(() =>
        observable<string>((emit) => {
            ee.on('listen', (input) => {
                emit.next(input)
            })
        })
    )
})

export type Router = typeof router

new Elysia()
    .use(websocket())
    .get('/', () => 'tRPC')
    .trpc(router)
    .listen(8080, ({ hostname, port }) => {
        console.log(`🦊 running at http://${hostname}:${port}`)
    })
