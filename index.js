const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('./firebase');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware for authentication (Optional but recommended)
// io.use(async (socket, next) => {
//   const token = socket.handshake.auth.token;
//   try {
//     const decodedToken = await admin.auth().verifyIdToken(token);
//     socket.uid = decodedToken.uid;
//     next();
//   } catch (error) {
//     next(new Error("Authentication error"));
//   }
// });

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', (uid) => {
    if (uid) {
      userSockets.set(uid, socket.id);
      socket.uid = uid;
      console.log(`User ${uid} authenticated`);
    }
  });

  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`User ${socket.uid} joined conversation: ${conversationId}`);
    }
  });

  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(conversationId);
      console.log(`User ${socket.uid} left conversation: ${conversationId}`);
    }
  });

  socket.on('send_message', async (data) => {
    const { conversationId, text, senderUid, senderName, senderPhoto, imageUrl } = data;
    
    if (!conversationId || !senderUid) return;

    try {
      const db = admin.firestore();
      
      const msgData = {
        senderUid,
        senderName,
        senderPhoto: senderPhoto || '',
        text: text || '',
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      };
      if (imageUrl) msgData.imageUrl = imageUrl;

      // 1. Save message to Firestore (Subcollection of conversation)
      const msgRef = await db.collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .add(msgData);

      // 2. Fetch the saved message to get the server timestamp back
      const msgSnapshot = await msgRef.get();
      const savedMsg = { 
        id: msgRef.id, 
        ...msgSnapshot.data(),
        sentAt: msgSnapshot.data().sentAt.toDate().toISOString()
      };

      // 3. Update Conversation last message and unread counts
      const convRef = db.collection('conversations').doc(conversationId);
      const convSnap = await convRef.get();
      
      if (convSnap.exists) {
        const convData = convSnap.data();
        const otherParticipant = convData.participants.find(p => p !== senderUid);
        
        const updateData = {
          lastMessage: {
            text: text || (imageUrl ? '📷 صورة' : ''),
            senderUid,
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          }
        };

        if (otherParticipant) {
          updateData[`unreadCount.${otherParticipant}`] = admin.firestore.FieldValue.increment(1);
        }

        await convRef.update(updateData);
      }

      // 4. Emit to everyone in the conversation room
      io.to(conversationId).emit('receive_message', savedMsg);
      
      // 5. Global notification for the other user (if they are online but not in this conversation)
      if (convSnap.exists) {
        const participants = convSnap.data().participants;
        participants.forEach(pUid => {
          if (pUid !== senderUid) {
            const socketId = userSockets.get(pUid);
            if (socketId) {
              // Only emit notification if the user is NOT currently in the conversation room
              const userRooms = io.sockets.adapter.rooms;
              const isInRoom = userRooms.get(conversationId)?.has(socketId);
              
              if (!isInRoom) {
                io.to(socketId).emit('new_message_notification', {
                  conversationId,
                  text: savedMsg.text || 'صورة جديدة',
                  senderName
                });
              }
            }
          }
        });
      }

    } catch (error) {
      console.error('Error in send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    if (socket.uid) {
      userSockets.delete(socket.uid);
      console.log(`User ${socket.uid} disconnected`);
    }
  });
});

app.get('/health', (req, res) => {
  res.send('OK');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
