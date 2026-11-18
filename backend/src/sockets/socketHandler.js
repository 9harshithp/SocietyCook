import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

let ioInstance = null;

export function initSocket(io) {
  ioInstance = io;

  // Socket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.sub;
    const societyId = socket.user.societyId;

    // Join user's personal channel and society channel
    socket.join(`user_${userId}`);
    if (societyId) {
      socket.join(`society_${societyId}`);
    }

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}

export function emitNotificationToUser(userId, notification) {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('notification', notification);
  }
}

export function emitSocietyAnnouncement(societyId, announcement) {
  if (ioInstance) {
    ioInstance.to(`society_${societyId}`).emit('society_announcement', announcement);
  }
}

export function emitGroupUpdate(groupId, updateData) {
  if (ioInstance) {
    ioInstance.emit(`group_${groupId}_update`, updateData);
  }
}
