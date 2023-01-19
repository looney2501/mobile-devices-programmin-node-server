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

router.put('/:id', async (ctx) => {
  const item = ctx.request.body;
  const id = ctx.params.id;
  const itemId = item._id;
  const response = ctx.response;
  console.log("item=", item);
  const userId = ctx.state.user._id;
  console.log(userId);

  if (itemId && itemId !== id) {
    response.body = { message: 'Param id and body _id should be the same' };
    response.status = 400; // bad request
    return;
  }
  item.userId = userId;
  const updatedCount = await hotelStore.update({ _id: itemId }, item);
  if (updatedCount === 1) {
    response.body = item;
    response.status = 200; // ok
    broadcast(userId, { type: 'updated', payload: item });
  } else {
    response.body = { message: 'Resource no longer exists' };
    response.status = 405; // method not allowed
  }
});
