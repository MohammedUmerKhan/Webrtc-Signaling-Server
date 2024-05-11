const handleRingOnly = (data) => {
  let { calleeId, callerId } = data;
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
