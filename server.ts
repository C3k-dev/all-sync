import { Server } from 'socket.io';
import http from 'http';

const server = http.createServer();
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', socket => {
  console.log('User connected', socket.id);
  socket.on('ping', cb => cb('pong'));
});

server.listen(4000, () => console.log('Socket.IO running on 4000'));
