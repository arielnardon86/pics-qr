import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.on('connection', (socket) => {
    // Join event room
    socket.on('join-event', (eventId: string) => {
      socket.join(`event-${eventId}`)
    })

    // New photo uploaded — broadcast to all in the event room
    socket.on('new-photo', (data: { eventId: string; photo: object }) => {
      io.to(`event-${data.eventId}`).emit('photo-added', data.photo)
    })

    // Slideshow control events
    socket.on('slideshow-control', (data: { eventId: string; action: string }) => {
      socket.to(`event-${data.eventId}`).emit('slideshow-control', data)
    })
  })

  const PORT = process.env.PORT || 3000
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
