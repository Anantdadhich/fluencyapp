const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

class RoomController {
  constructor() {
    this.rooms = new Map();
    this.roomIdCounter = 1;
  }

  createRoom(user1, user2) {
    const roomId = (this.roomIdCounter++).toString();
    this.rooms.set(roomId, { user1, user2 });

    user1.socket.emit("send-offer", { roomId });
    user2.socket.emit("send-answer", { roomId });
  }

  onOffer(roomId, sdp, senderSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
    receivingUser.socket.emit("offer", { sdp, roomId });
  }

  onAnswer(roomId, sdp, senderSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
    receivingUser.socket.emit("answer", { sdp, roomId });
  }

  onIceCandidates(roomId, senderSocketId, candidate, type) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
    receivingUser.socket.emit("add-ice-candidate", { candidate, type });
  }

  onChatMessage(roomId, senderSocketId, message, senderName) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const receivingUser = room.user1.socket.id === senderSocketId ? room.user2 : room.user1;
    receivingUser.socket.emit("chat-message", {
      message,
      senderName,
      timestamp: new Date().toISOString(),
    });
  }
}

class UserController {
  constructor() {
    this.users = [];
    this.queue = [];
    this.roomManager = new RoomController();
  }

  addUser(name, socket) {
    this.users.push({ name, socket });
    this.queue.push(socket.id);
    socket.emit("lobby");
    this.clearQueue();
  }

  removeUser(socketId) {
    this.users = this.users.filter((x) => x.socket.id !== socketId);
    this.queue = this.queue.filter((x) => x !== socketId);
  }

  clearQueue() {
    if (this.queue.length < 2) {
      return;
    }
    const id1 = this.queue.pop();
    const id2 = this.queue.pop();
    const user1 = this.users.find((x) => x.socket.id === id1);
    const user2 = this.users.find((x) => x.socket.id === id2);

    if (!user1 || !user2) {
      return;
    }

    this.roomManager.createRoom(user1, user2);
    this.clearQueue();
  }
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  const userController = new UserController();

  io.on('connection', (socket) => {
    console.log("Websocket user connected:", socket.id);
    
    // Automatically register user for matching queue
    userController.addUser("random", socket);

    socket.on("offer", ({ sdp, roomId }) => {
      userController.roomManager.onOffer(roomId, sdp, socket.id);
    });

    socket.on("answer", ({ sdp, roomId }) => {
      userController.roomManager.onAnswer(roomId, sdp, socket.id);
    });

    socket.on("add-ice-candidate", ({ roomId, candidate, type }) => {
      userController.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
    });

    socket.on("chat-message", ({ roomId, message, senderName }) => {
      userController.roomManager.onChatMessage(roomId, socket.id, message, senderName);
    });

    socket.on("disconnect", () => {
      console.log("Websocket user disconnected:", socket.id);
      userController.removeUser(socket.id);
    });
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Server ready on http://${hostname}:${port}`);
  });
});
