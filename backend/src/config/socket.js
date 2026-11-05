
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
        : "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Verify JWT before allowing a socket connection.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      const user = await User.findById(decoded.id).select(
        "_id name role isActive"
      );

      if (!user || !user.isActive) {
        return next(new Error("Unauthorized user"));
      }

      socket.user = user;

      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  // Connection is allowed only after authentication.
  io.on("connection", (socket) => {
    const role = socket.user.role;

    // Join a room based on the verified database role.
    socket.join(role);

    console.log(
      `${socket.user.name} connected as ${role}`
    );

    socket.on("disconnect", () => {
      console.log(
        `${socket.user.name} disconnected`
      );
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};

module.exports = {
  initSocket,
  getIO
};
