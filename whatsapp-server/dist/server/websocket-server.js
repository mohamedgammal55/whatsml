"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServer = void 0;
const env_1 = __importDefault(require("../config/env"));
const socket_io_1 = require("socket.io");
class SocketServer {
    constructor(httpServer) {
        this.clients = new Map();
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
            },
        });
        this.setupConnectionHandler();
    }
    setupConnectionHandler() {
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token
                ? socket.handshake.auth.token
                : socket.handshake.headers.token;
            if (!token || token !== env_1.default.API_KEY) {
                return next(new Error("Invalid API key"));
            }
            next();
        });
        this.io.on("connection", (socket) => {
            const { session_id } = socket.handshake.query;
            if (!session_id) {
                console.log(`Invalid connection attempt: session_id=${session_id}`);
                socket.disconnect(true);
                return;
            }
            this.addClient(session_id, socket.id);
            socket.join(session_id);
            console.log(`New Socket.IO connection: session_id=${session_id}`);
            socket.emit("connected", { session_id });
            socket.on("disconnect", () => {
                this.removeClient(session_id, socket.id);
                console.log(`Socket disconnected: session_id=${session_id}`);
            });
        });
    }
    addClient(session_id, socketId) {
        if (!this.clients.has(session_id)) {
            this.clients.set(session_id, new Set());
        }
        this.clients.get(session_id).add(socketId);
    }
    removeClient(session_id, socketId) {
        const clientSet = this.clients.get(session_id);
        if (clientSet) {
            clientSet.delete(socketId);
            if (clientSet.size === 0) {
                this.clients.delete(session_id);
            }
        }
    }
    emitEvent(event, session_id, data) {
        console.log(`Emitting event ${event} to session ${session_id}`);
        this.io.to(session_id).emit(event, { event, session_id, data });
    }
    getConnectedClients(session_id) {
        var _a;
        return ((_a = this.clients.get(session_id)) === null || _a === void 0 ? void 0 : _a.size) || 0;
    }
}
exports.SocketServer = SocketServer;
