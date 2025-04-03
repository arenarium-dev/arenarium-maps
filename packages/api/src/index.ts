import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello, welcome to the Arenarium Maps API!')
})

export default app
