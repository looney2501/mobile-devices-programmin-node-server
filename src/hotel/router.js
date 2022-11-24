import Router from 'koa-router'
import hotelStore from './store'
import { broadcast } from '../utils'

export const router = new Router()

router.get('/', async ctx => {
  const response = ctx.response
  const userId = ctx.state.user._id
  response.body = await hotelStore.find({ userId })
  response.status = 200
})

const createHotel = async (ctx, hotel, response) => {
  try {
    const userId = ctx.state.user._id
    hotel.userId = userId
    const insertedHotel = await hotelStore.insert(hotel)
    response.body = insertedHotel
    response.status = 201 //created
    broadcast(userId, { event: 'created', payload: { hotel: insertedHotel } })
  } catch (e) {
    response.body = { message: e.message }
    response.status = 400 //bad request
  }
}

router.post('/', async (ctx) => await createHotel(ctx, ctx.request.body, ctx.response))
