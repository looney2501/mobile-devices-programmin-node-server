const Koa = require('koa')
const app = new Koa()
const server = require('http').createServer(app.callback())
const WebSocket = require('ws')
const wss = new WebSocket.Server({server})
const Router = require('koa-router')
const cors = require('koa-cors')
const bodyparser = require('koa-bodyparser')

app.use(bodyparser())
app.use(cors())
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} ${ctx.response.status} - ${ms}ms`)
})

app.use(async (ctx, next) => {
  await new Promise(resolve => setTimeout(resolve, 2000))
  await next()
})

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.response.body = {issue: [{error: err.message || 'Unexpected error'}]}
    ctx.response.status = 500
  }
})

class Hotel {
  constructor({id, name, capacity, isAvailable, dateRegistered}) {
    this.id = id
    this.name = name
    this.capacity = capacity
    this.isAvailable = isAvailable
    this.dateRegistered = dateRegistered
  }
}

const hotels = []
for (let i = 0; i < 4; i++) {
  hotels.push(new Hotel({
    id: `${i}`, name: `Hotel ${i}`,
    capacity: i * 100, isAvailable: i % 2 === 0,
    dateRegistered: new Date(Date.now() + i)
  }))
}
let lastId = hotels[hotels.length - 1].id

const broadcast = data =>
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data))
    }
  })

const router = new Router()

router.get('/hotels', ctx => {
  ctx.response.body = hotels
  ctx.response.status = 200
})

const createItem = async (ctx) => {
  const hotel = ctx.request.body
  if (!hotel.name || !hotel.capacity || !hotel.isAvailable || !hotel.dateRegistered) { // validation
    ctx.response.body = {issue: [{error: 'Attributes are missing'}]}
    ctx.response.status = 400 //  BAD REQUEST
    return
  }
  hotel.id = `${parseInt(lastId) + 1}`
  lastId = hotel.id
  hotels.push(hotel)
  ctx.response.body = hotel
  ctx.response.status = 201 // CREATED
  broadcast({event: 'created', payload: {item: hotel}})
}

router.post('/hotels', async (ctx) => {
  await createItem(ctx)
})


// setInterval(() => {
//   lastId = `${parseInt(lastId) + 1}`
//   const newId = lastId + 1
//   const hotel = new Hotel({
//     id: newId,
//     name: `Hotel ${newId}`,
//     capacity: lastId * 100,
//     isAvailable: newId % 2 === 0,
//     dateRegistered: new Date(Date.now() + newId)
//   })
//   hotels.push(hotel)
//   console.log(`
//    ${hotel.name}`)
//   broadcast({event: 'created', payload: {item: hotel}})
// }, 1000)

app.use(router.routes())
app.use(router.allowedMethods())

server.listen(3000)
