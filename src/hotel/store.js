import dataStore from 'nedb-promise'

export class HotelStore {
  constructor({ filename, autoload }) {
    this.store = dataStore({ filename, autoload })
  }

  async find(props) {
    return this.store.find(props)
  }

  async insert(hotel) {
    if (hotel.name == null || hotel.capacity == null || hotel.isAvailable == null || hotel.dateRegistered == null) { // validation
      throw new Error('Missing attributes')
    }
    return this.store.insert(hotel)
  }
}

export default new HotelStore({ filename: './db/hotels.json', autoload: true })