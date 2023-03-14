<h2 align="center">smee-client</h2>
<p align="center">Client and CLI for smee.io, a service that delivers webhooks to your local environment - e.g. behind a restrictive company proxy.</p>

<p align="center">Fork of <a href="https://github.com/probot/smee-client">smee-client</a> to add proxy support.</p>

<p align="center"><a href="https://github.com/probot/smee.io">Looking for <strong>probot/smee.io</strong>?</a></p>

## Installation

Install the client with:

```
$ npm install -g smee-client-proxy
```

## Usage

### CLI

The `smee` command will forward webhooks from smee.io to your local development environment.

```
$ smee
```

Run `smee --help` for usage.

### CLI with proxy

Smee client uses [global agent](https://www.npmjs.com/package/global-agent) to do proxied connections 

```
export GLOBAL_AGENT_HTTP_PROXY=http://127.0.0.1:8080
$ smee
```


### Node Client

```js
const SmeeClient = require('smee-client')

const smee = new SmeeClient({
  source: 'https://smee.io/abc123',
  target: 'http://localhost:3000/events',
  logger: console
})

const events = smee.start()

// Stop forwarding events
events.close()
```
