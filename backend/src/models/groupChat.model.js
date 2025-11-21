// backend/src/models/groupChat.model.js (Nuevo archivo)
import mongoose from 'mongoose';

const groupChatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  tasks: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: [] // Inicializar como un array vacío
  }]
  // createdAt: {
  //   type: Date,
  //   default: Date.now
  // }
}, { timestamps: true });

export const GroupChat = mongoose.model('GroupChat', groupChatSchema);