/* global self, ReadableStream, Response */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

const map = new Map()

self.onmessage = event => {
  if (event.data === 'ping') {
    if (event.waitUntil) {
      event.waitUntil(Promise.resolve())
    }

    return
  }

  const data = event.data
  const downloadUrl = data.url || self.registration.scope + Math.random() + '/' + (typeof data === 'string' ? data : data.filename)
  const port = event.ports[0]
  const metadata = new Array(3)

  const startDownload = () => {
    map.set(downloadUrl, metadata)
    port.postMessage({ download: downloadUrl })
  }

  metadata[1] = data
  metadata[2] = port

  if (event.data.readableStream) {
    metadata[0] = event.data.readableStream
    startDownload()
  } else if (event.data.transferringReadable) {
    port.onmessage = event => {
      port.onmessage = null
      metadata[0] = event.data.readableStream
      startDownload()
    }
  } else {
    metadata[0] = createStream(port)
    startDownload()
  }
}

function createStream (port) {
  return new ReadableStream({
    start (controller) {
      port.onmessage = ({ data }) => {
        if (data === 'end') {
          return controller.close()
        }

        if (data === 'abort') {
          controller.error('Aborted the download')
          return
        }

        controller.enqueue(data)
      }
    },
    cancel (reason) {
      console.log('user aborted', reason)
      port.postMessage({ abort: true })
    }
  })
}

self.onfetch = event => {
  const url = event.request.url

  if (url.endsWith('/ping')) {
    return event.respondWith(new Response('pong'))
  }

  const metadata = map.get(url)

  if (!metadata) {
    return null
  }

  const [stream, data, port] = metadata

  map.delete(url)

  const responseHeaders = new Headers({
    'Content-Type': 'application/octet-stream; charset=utf-8',
    'Content-Security-Policy': "default-src 'none'",
    'X-Content-Security-Policy': "default-src 'none'",
    'X-WebKit-CSP': "default-src 'none'",
    'X-XSS-Protection': '1; mode=block'
  })

  const headers = new Headers(data.headers || {})

  if (headers.has('Content-Length')) {
    responseHeaders.set('Content-Length', headers.get('Content-Length'))
  }

  if (headers.has('Content-Disposition')) {
    responseHeaders.set('Content-Disposition', headers.get('Content-Disposition'))
  }

  event.respondWith(new Response(stream, { headers: responseHeaders }))

  port.postMessage({ debug: 'Download started' })
}
