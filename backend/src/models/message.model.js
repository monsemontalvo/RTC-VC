import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    text: {
        type: String,
    },
    image: {
        type: String,
    },
    // --- AÑADIR ESTO ---
    isEncrypted: {
        type: Boolean,
        default: false
    }
    // --- FIN DE LO AÑADIDO ---
  },
    {timestamps: true}
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
