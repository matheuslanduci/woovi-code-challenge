import mongoose from 'mongoose'

import { config } from './config'

async function connectDatabase() {
  await mongoose.connect(config.MONGO_URI)
}

export { connectDatabase }
