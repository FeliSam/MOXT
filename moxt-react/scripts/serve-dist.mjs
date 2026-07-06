import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const root = normalize(join(import.meta.dirname, '..', 'dist'))
const port = Number(process.env.PORT || 4173)
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
}

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  const requestedPath = normalize(join(root, pathname))
  const safePath = requestedPath.startsWith(root) ? requestedPath : root
  const filePath =
    existsSync(safePath) && statSync(safePath).isFile() ? safePath : join(root, 'index.html')

  response.setHeader('Content-Type', mimeTypes[extname(filePath)] || 'application/octet-stream')
  createReadStream(filePath).pipe(response)
}).listen(port, '127.0.0.1', () => {
  console.log(`MOXT preview: http://127.0.0.1:${port}`)
})

function shutdown() {
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
