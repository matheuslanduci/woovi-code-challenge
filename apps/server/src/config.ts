import 'dotenv/config'

const ENV = process.env

const config = {
  PORT: ENV.PORT ?? 4000,
  MONGO_URI: ENV.MONGO_URI ?? 'mongodb://localhost/woovi-playground'
}

export { config }
