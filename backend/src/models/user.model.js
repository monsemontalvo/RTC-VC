import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
            minleghth: 6,
        },
        profilePic: {
            type: String,
            default: "",
        },

        // --- NUEVOS CAMPOS PARA LOGROS ---
        achievements: [{ type: String }], // Array de IDs de logros: ["founder", "secret_agent"]

        stats: {
            messagesSent: { type: Number, default: 0 },
            groupsCreated: { type: Number, default: 0 },
            tasksCompleted: { type: Number, default: 0 },
            emailsSent: { type: Number, default: 0 },
            videoCallsDuration: { type: Number, default: 0 }, // Opcional, o simplemente un flag
        },

        hasWonPredictionBadge: {
            type: Boolean,
            default: false,
        },

    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;