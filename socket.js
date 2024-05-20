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
    socket.on("offer", (data) => handleOffer(socket, data));
    socket.on("answer", (data) => handleAnswer(socket, data));
    socket.on("ICEcandidate", (data) => handleICEcandidate(socket, data));
    socket.on("hangupCall", (data) => handleHangupCall(socket, data));
    socket.on("speechToText", (data) => handleSpeechToText(socket, data));

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

const handleOffer = (socket, data) => {
  let { otherUserId, callerId, offer } = data;
  // finding the other user
  let targetSocketId;
  socketServer
    .fetchSockets()
    .then((sockets) => {
      sockets.forEach((socket) => {
        if (socket.user == otherUserId) {
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
        console.log("Sending offer to User : " + otherUserId);
        console.log(targetSocketId);
        socket.to(targetSocketId).emit("offer", {
          otherUserId: otherUserId,
          callerId: callerId,
          offer: offer,
        });
      } else {
        console.log("Target socket not found.");
        //emit a response back to client
        socket.emit("clientOffline", "Offline");
      }
    })
    .catch(console.log);
};

const handleAnswer = (socket, data) => {
  let { otherUserId, callerId, answer } = data;
  // finding the other user
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
        console.log("Sending answer to User : " + callerId);
        console.log(targetSocketId);
        socket.to(targetSocketId).emit("answer", {
          otherUserId: otherUserId,
          callerId: callerId,
          answer: answer,
        });
      } else {
        console.log("Target socket not found.");
        //emit a response back to client
        socket.emit("clientOffline", "Offline");
      }
    })
    .catch(console.log);
};

const handleICEcandidate = (socket, data) => {
  let { otherUserId, candidate } = data;
  console.log("$$$$$");
  console.log("ICEcandidate for User : ", otherUserId);
  //
  // finding the other user
  let targetSocketId;
  socketServer
    .fetchSockets()
    .then((sockets) => {
      sockets.forEach((socket) => {
        if (socket.user == otherUserId) {
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
        console.log("Sending Candidate to User : " + otherUserId);
        console.log(targetSocketId);
        socket.to(targetSocketId).emit("ICEcandidate", {
          otherUserId: otherUserId,
          candidate: candidate,
        });
      } else {
        console.log("Target socket not found.");
        //emit a response back to client
        socket.emit("clientOffline", "Offline");
      }
    })
    .catch(console.log);
  //

  //
};

const handleSpeechToText = (socket, data) => {
  let { userId, speechToTextData } = data;
  // finding the other user
  let targetSocketId;
  socketServer
    .fetchSockets()
    .then((sockets) => {
      sockets.forEach((socket) => {
        if (socket.user == userId) {
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
        console.log("Sending speech to text data to User : " + userId);
        console.log(targetSocketId);
        socket.to(targetSocketId).emit("speechToTextResults", {
          userId: userId,
          speechToTextData: speechToTextData,
        });
      } else {
        console.log("Target socket not found.");
        //emit a response back to client
        socket.emit("clientOffline", "Offline");
      }
    })
    .catch(console.log);
};

const handleDisconnect = (socket) => {
  console.log(`User ${socket.user} disconnected`);
  printConnectedSockets();
};

const handleHangupCall = (socket, data) => {
  // console.log("data" + data);
  let userId = data;
  // finding the other user
  let targetSocketId;
  socketServer
    .fetchSockets()
    .then((sockets) => {
      sockets.forEach((socket) => {
        if (socket.user == userId) {
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
        console.log("Sending HangUp Call to User : " + userId);
        console.log(targetSocketId);
        socket.to(targetSocketId).emit("hangup", {
          userId: userId,
        });
      } else {
        console.log("Target socket not found. UserID:" + userId);
        //emit a response back to client
        socket.emit("clientOffline", "Offline");
      }
    })
    .catch(console.log);
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
