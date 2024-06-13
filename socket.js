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
    socket.on("textToSpeech", (data) => handleTextToSpeech(socket, data));
    // New event handler for checking connected sockets
    socket.on("checkConnectedSockets", () =>
      handleCheckConnectedSockets(socket)
    );
    // event handler for group chat
    socket.on("groupRingOnly", (data) => handleGroupRingOnly(socket, data));
    socket.on("endGroupRinging", (data) => handleGroupEndRinging(socket, data));
    socket.on("ringGroupResponse", (data) =>
      handleRingGroupResponse(socket, data)
    );

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

const handleTextToSpeech = (socket, data) => {
  let { userId, textToSpeechData } = data;
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
        console.log("Sending text to speech data to User : " + userId);
        console.log(targetSocketId);
        socket.to(targetSocketId).emit("textToSpeechResults", {
          userId: userId,
          textToSpeechData: textToSpeechData,
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

const handleCheckConnectedSockets = (socket) => {
  socketServer
    .fetchSockets()
    .then((sockets) => {
      const connectedUsers = sockets.map((s) => s.user);
      socket.emit("connectedUsers", connectedUsers);
    })
    .catch(console.log);
};

const handleGroupRingOnly = (socket, data) => {
  const { callerData, user1, user2 } = data;
  console.log(
    "Group Ringing initiated by:",
    callerData.Id + " " + callerData.fname
  );

  // Function to find the socket ID for a given user ID
  const findSocketIdForUser = (userId) => {
    return socketServer.fetchSockets().then((sockets) => {
      for (const socket of sockets) {
        // console.log(socket);
        // console.log(
        //   "socket.user: " + socket.user + "  Type of : " + typeof socket.user
        // );
        // console.log("userId: " + userId + "  Type of : " + typeof userId);
        if (String(socket.user) === String(userId)) {
          // console.log("matched : " + socket.id);
          return socket.id;
        }
      }
      return null;
    });
  };

  // Find and send to user1 first
  findSocketIdForUser(user1.userId)
    .then((user1SocketId) => {
      if (user1SocketId) {
        console.log(`Ringing user1 with ID: ${user1.userId}`);
        socket.to(user1SocketId).emit("groupRinging", {
          callerData,
          user: user2, // Send user2 data to user1
        });
      } else {
        console.log(`User1 with ID ${user1.userId} is offline.`);
        socket.emit("clientOffline", {
          userId: user1.userId,
          status: "Offline",
        });
      }

      // Find and send to user2 next
      return findSocketIdForUser(user2.userId);
    })
    .then((user2SocketId) => {
      if (user2SocketId) {
        console.log(`Ringing user2 with ID: ${user2.userId}`);
        socket.to(user2SocketId).emit("groupRinging", {
          callerData,
          user: user1, // Send user1 data to user2
        });
      } else {
        console.log(`User2 with ID ${user2.userId} is offline.`);
        socket.emit("clientOffline", {
          userId: user2.userId,
          status: "Offline",
        });
      }
    })
    .catch((err) => {
      console.error("Error finding socket IDs:", err);
    });
};

const handleGroupEndRinging = (socket, data) => {
  const { initiatorId, id1, id2 } = data;
  console.log("End Group Ringing initiated by: " + initiatorId);

  // Function to find the socket ID for a given user ID
  const findSocketIdForUser = (userId) => {
    return socketServer.fetchSockets().then((sockets) => {
      for (const socket of sockets) {
        if (String(socket.user) === String(userId)) {
          return socket.id;
        }
      }
      return null;
    });
  };

  // Find and send to user1 first
  findSocketIdForUser(id1)
    .then((user1SocketId) => {
      if (user1SocketId) {
        console.log(`End Ringing user with ID: ${id1}`);
        socket.to(user1SocketId).emit("endGroupChatRinging", {
          initiatorId: initiatorId,
          id1: id1,
          id2: id2,
        });
      } else {
        console.log(`User with ID ${id1} is offline.`);
        // socket.emit("clientOffline", {
        //   userId: user1.userId,
        //   status: "Offline",
        // });
      }

      // Find and send to user2 next
      return findSocketIdForUser(id2);
    })
    .then((user2SocketId) => {
      if (user2SocketId) {
        console.log(`End Ringing user with ID: ${id2}`);
        socket.to(user2SocketId).emit("endGroupChatRinging", {
          initiatorId: initiatorId,
          id1: id1,
          id2: id2,
        });
      } else {
        console.log(`User with ID ${id2} is offline.`);
        // socket.emit("clientOffline", {
        //   userId: user2.userId,
        //   status: "Offline",
        // });
      }
    })
    .catch((err) => {
      console.error("Error finding socket IDs:", err);
    });
};

const handleRingGroupResponse = (socket, data) => {
  const { response, initiatorId, otherUserId1, otherUserId2 } = data;
  console.log("Call accepted by user : " + initiatorId);

  // Function to find the socket ID for a given user ID
  const findSocketIdForUser = (userId) => {
    return socketServer.fetchSockets().then((sockets) => {
      for (const socket of sockets) {
        if (String(socket.user) === String(userId)) {
          return socket.id;
        }
      }
      return null;
    });
  };

  // Find and send to user1 first
  findSocketIdForUser(otherUserId1)
    .then((user1SocketId) => {
      if (user1SocketId) {
        console.log(
          `Sending Group chat accepted response to ID: ${otherUserId1}`
        );
        socket.to(user1SocketId).emit("groupChatRingingResponse", {
          response: response,
          initiatorId: initiatorId,
          otherUserId1: otherUserId1,
          otherUserId2: otherUserId2,
        });
      } else {
        console.log(`User with ID ${otherUserId1} is offline.`);
      }

      // Find and send to user2 next
      return findSocketIdForUser(otherUserId2);
    })
    .then((user2SocketId) => {
      if (user2SocketId) {
        console.log(
          `Sending Group chat accepted response to ID: ${otherUserId2}`
        );
        socket.to(user2SocketId).emit("groupChatRingingResponse", {
          response: response,
          initiatorId: initiatorId,
          otherUserId1: otherUserId1,
          otherUserId2: otherUserId2,
        });
      } else {
        console.log(`User with ID ${otherUserId2} is offline.`);
      }
    })
    .catch((err) => {
      console.error("Error finding socket IDs:", err);
    });
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
