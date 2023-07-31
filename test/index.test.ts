import Client = require('..')
import nock = require('nock')
import superagent = require('superagent')
import EventSource from 'eventsource'

beforeAll(() => {
  nock.disableNetConnect()
  nock.enableNetConnect('localhost')
})

describe('client', () => {
  describe('createChannel', () => {
    test('returns a new channel', async () => {
      const req = nock('https://smee.io').head('/new').reply(302, '', {
        Location: 'https://smee.io/abc123'
      })

      const channel = await Client.createChannel()
      expect(channel).toEqual('https://smee.io/abc123')
      expect(req.isDone()).toBe(true)
    })
  })
  describe('start', () => {
    test('returns an event source', async () => {

      const client = new Client({
        source: 'https://smee.io/abc123',
        target: 'https://example.com',
        host: 'smee.io'
      })

      let events = client.start()
      expect(events).toBeInstanceOf(EventSource)

      await client.stop()
    })

    test('starts a listener on localhost:3000/health', async () => {

      nock('https://smee.io').get('/abc123').reply(200, '')

      const client = new Client({
        source: 'https://smee.io/abc123',
        target: 'https://example.com',
        host: 'smee.io'
      })

      client.start()

      // expect response that is not a 404
      await superagent.get('localhost:3000/health').catch((err) => {
        expect(err.status).not.toEqual(404)
      })

      await client.stop()

    })

    test('returns a 503 if the event source is not connected', async () => {

      nock('https://smee.io').get('/abc123').reply(200, '')

      const client = new Client({
        source: 'https://smee.io/abc123',
        target: 'https://example.com',
        host: 'smee.io'
      })

      const events = client.start()
      events.close()

      // expect a 503 response
      await superagent.get('localhost:3000/health').catch((err) => {
        expect(err.message).toContain('Service Unavailable')
      })

      await client.stop()
    })
  })
})
