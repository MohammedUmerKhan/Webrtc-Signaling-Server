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

      // Iterate over all connected sockets
      socketServer.fetchSockets().then((sockets) => {
        sockets.forEach((connectedSocket) => {
          if (connectedSocket.user === userIdFromQuery) {
            // Disconnect the socket if the user is already connected
            connectedSocket.disconnect();
          }
        });
      });

      next();
    }
  });

  socketServer.on("connection", (socket) => {
    console.log("Connected User Id : ", socket.user);
    socket.join(socket.user);
    console.log("------------------------------");
    // Display the list of connected users
    printConnectedSockets();

    // New event handler for ringing functionality
    // socket.on("call", handleCall);
    socket.on("ringOnly", (data) => handleRingOnly(socket, data));
    socket.on("ringResponse", (data) => handleRingResponse(socket, data));
    socket.on("endRinging", (data) => handleEndRinging(socket, data));
    socket.on("call", (data) => handleCall(socket, data));
    socket.on("answerCall", (data) => handleAnswerCall(socket, data));
    socket.on("ICEcandidate", (data) => handleICEcandidate(socket, data));
    socket.on("disconnect", () => handleDisconnect(socket));
  });
};
//functions
const handleRingOnly = (socket, data) => {
  let { calleeId, callerData } = data;
  console.log(typeof data);
  // console.log("test" + calleeId + callerData);
  console.log("Ringing client with ID:", calleeId);
  // Find the socket ID associated with the calleeId
  let targetSocketId;
  socketServer
    .fetchSockets()
    .then((sockets) => {
      sockets.forEach((socket) => {
        if (socket.user == calleeId) {
          targetSocketId = socket.id;
        }
        console.log(
          "Socket: " +
            safeStringify(socket.id) +
            " userId: " +
            safeStringify(socket.user) +
            " TargetId : " +
            targetSocketId
        );
      });
      // Check for targetSocketId after the promise has resolved
      if (targetSocketId) {
        console.log("----------");
        console.log(targetSocketId);
        // Send a message to the specific user
        socket.to(targetSocketId).emit("ringing", {
          calleeId: calleeId,
          callerData: callerData,
        });
      } else {
        console.log("Target socket not found.");
        //emit a response back to client
        socket.emit("clientOffline", "Offline");
      }
    })
    .catch(console.log);
};
//complete it also add the reject from caller
const handleRingResponse = (socket, data) => {
  let { response, userData, callerId } = data;
  console.log("test" + response + userData);
  console.log("Response from client with ID:", userData.Id);
  // Find the socket ID associated with the calleeId
  let targetSocketId;
  socketServer
    .fetchSockets()
    .then((sockets) => {
      sockets.forEach((socket) => {
        if (socket.user == callerId) {
          targetSocketId = socket.id;
        }
        console.log(
          "Socket: " +
            safeStringify(socket.id) +
            " userId: " +
            safeStringify(socket.user) +
            " TargetId : " +
            targetSocketId
        );
      });
      // Check for targetSocketId after the promise has resolved
      if (targetSocketId) {
        console.log("----------");
        console.log(targetSocketId);
        // Send a message to the specific user
        socket.to(targetSocketId).emit("response", {
          response: response,
          userData: userData,
          callerId: callerId,
        });
      } else {
        console.log("Target socket not found.");
        //emit a response back to client
        socket.emit("clientOffline", "Offline");
      }
    })
    .catch(console.log);
};
//caller stop Ringing
const handleEndRinging = (socket, data) => {
  let { calleeId, callerId } = data;
  // console.log(typeof data);  // console.log("test" + calleeId + callerData);
  console.log("End Ringing client with ID:", calleeId);
  // Find the socket ID associated with the calleeId
  let targetSocketId;
  socketServer
    .fetchSockets()
    .then((sockets) => {
      sockets.forEach((socket) => {
        if (socket.user == calleeId) {
          targetSocketId = socket.id;
        }
        console.log(
          "Socket: " +
            safeStringify(socket.id) +
            " userId: " +
            safeStringify(socket.user) +
            " TargetId : " +
            targetSocketId
        );
      });
      // Check for targetSocketId after the promise has resolved
      if (targetSocketId) {
        console.log("----------");
        console.log(targetSocketId);
        // Send a message to the specific user
        socket.to(targetSocketId).emit("endRinging", {
          calleeId: calleeId,
          callerId: callerId,
        });
      } else {
        console.log("Target socket not found.");
        //emit a response back to client
        socket.emit("clientOffline", "Offline");
      }
    })
    .catch(console.log);
};

const handleCall = (socket, data) => {
  let { calleeId, rtcMessage } = data;
  socket.to(calleeId).emit("newCall", {
    callerId: socket.user,
    rtcMessage: rtcMessage,
  });
};

const handleAnswerCall = (socket, data) => {
  let { callerId, rtcMessage } = data;
  socket.to(callerId).emit("callAnswered", {
    callee: socket.user,
    rtcMessage: rtcMessage,
  });
};

const handleICEcandidate = (socket, data) => {
  console.log("ICEcandidate data.calleeId", data.calleeId);
  let { calleeId, rtcMessage } = data;
  console.log("socket.user emit", socket.user);
  socket.to(calleeId).emit("ICEcandidate", {
    sender: socket.user,
    rtcMessage: rtcMessage,
  });
};

const handleDisconnect = (socket) => {
  console.log(`User ${socket.user} disconnected`);
  printConnectedSockets();
};
// this is only to display the clients connected
async function printConnectedSockets() {
  const sockets = await socketServer.fetchSockets();
  let clientConnected = [];
  // console.log("array test: " + clientConnected);
  sockets.forEach((socketInstance) => {
    clientConnected.push(socketInstance.user);
  });
  console.log("All Connected Clients: " + clientConnected);
}
function safeStringify(obj) {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (cache.has(value)) {
        // Duplicate reference found, discard key
        return;
      }
      // Store value in our set
      cache.add(value);
    }
    return value;
  });
}

export const getSocketServer = () => {
  if (!socketServer) {
    throw Error("Socket server not initialized.");
  } else {
    return socketServer;
  }
};
