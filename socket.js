import { Server } from "socket.io";

let socketServer;

export const initSocketServer = (httpServer) => {
  socketServer = new Server(httpServer);

  socketServer.use((socket, next) => {
    console.log("------------------------------");
    console.log("Connecting User.... \nProcessing Middleware....");
    if (socket.handshake.query) {
      console.log(socket.handshake.query);
      let userIdFromQuery = socket.handshake.query.query;
      socket.user = userIdFromQuery;
      console.log(socket.user);
      next();
    }
  });

  socketServer.on("connection", (socket) => {
    console.log("Connected User Id : ", socket.user);
    socket.join(socket.user);
    console.log("------------------------------");

    socket.on("call", (data) => {
      let { calleeId, rtcMessage } = data;
      socket.to(calleeId).emit("newCall", {
        callerId: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on("answerCall", (data) => {
      let { callerId, rtcMessage } = data;
      socket.to(callerId).emit("callAnswered", {
        callee: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on("ICEcandidate", (data) => {
      console.log("ICEcandidate data.calleeId", data.calleeId);
      let { calleeId, rtcMessage } = data;
      console.log("socket.user emit", socket.user);
      socket.to(calleeId).emit("ICEcandidate", {
        sender: socket.user,
        rtcMessage: rtcMessage,
      });
    });
  });
};

export const getSocketServer = () => {
  if (!socketServer) {
    throw Error("Socket server not initialized.");
  } else {
    return socketServer;
  }
};
