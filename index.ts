import validator from 'validator'
import EventSource from 'eventsource'
import superagent from 'superagent'
import url from 'url'
import express from 'express'
import querystring from 'querystring'
import 'global-agent/bootstrap'
import http from 'http'

type Severity = 'info' | 'error'

interface Options {
  source: string
  target: string
  host: string
  logger?: Pick<Console, Severity>
}

class Client {
  source: string;
  target: string;
  host: string;
  logger: Pick<Console, Severity>;
  events!: EventSource;
  server!: http.Server;

  constructor ({ source, target, host, logger = console }: Options) {
    this.source = source
    this.target = target
    this.host = host
    this.logger = logger!

    if (!validator.isURL(this.source)) {
      throw new Error('The provided URL is invalid.')
    }
  }

  static async createChannel () {
    return superagent.head('https://smee.io/new').redirects(0).catch((err) => {
      console.log(err)
      return err.response.headers.location
    })
  }

  createHealthListener () {

    const app = express()

    app.get('/health', (req, res) => {
      this.logger.info('health check')
      this.logger.info(this.events.readyState, this.events.OPEN)
      if (this.events.readyState == this.events.CLOSED || this.events.readyState == this.events.CONNECTING) {
        res.status(503).send('Event source is not connected')
        return res
      }
      res.status(200).send('OK')
      return res
    })

    return app
  }

  onmessage (msg: any) {
    const data = JSON.parse(msg.data)

    const target = url.parse(this.target, true)
    const mergedQuery = Object.assign(target.query, data.query)
    target.search = querystring.stringify(mergedQuery)

    delete data.query

    data.host = target.host
    data['disguised-host'] = target.host

    const req = superagent.post(url.format(target)).send(data.body)

    delete data.body

    Object.keys(data).forEach(key => {
      req.set(key, data[key])
      console.log(key, data[key])
    })

    req.end((err, res) => {
      if (err) {
        this.logger.error(err)
      } else {
        this.logger.info(`${req.method} ${req.url} - ${res.status}`)
      }
    })
  }

  onopen () {
    // this.logger.info('Connected', this.events.url)
  }

  onerror (err: any) {
    // this.logger.error(err)
  }

  start () {
    const events = new EventSource(this.source);

    // Reconnect immediately
    // (events as any).reconnectInterval = 0 // This isn't a valid property of EventSource

    events.addEventListener('message', this.onmessage.bind(this))
    events.addEventListener('open', this.onopen.bind(this))
    events.addEventListener('error', this.onerror.bind(this))

    this.logger.info(`Forwarding ${this.source} to ${this.target}`)
    this.logger.info(`Setting host to ${this.host}`)
    this.events = events

    const app = this.createHealthListener()

    this.server = app.listen(3000, () => {
      this.logger.info('Health listener started on port 3000')
    })

    return events
  }

  async stop () {
    this.events.close()
    await this.server.close()
}

}

export = Client
