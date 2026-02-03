"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocketEmitter = initializeSocketEmitter;
exports.emitEvent = emitEvent;
exports.sendWebhook = sendWebhook;
const env_1 = __importDefault(require("../config/env"));
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
let socketServer = null;
function initializeSocketEmitter(server) {
    socketServer = server;
}
function emitEvent(event, sessionId, data, status = "success", message) {
    if (env_1.default.ENABLE_WEBHOOK) {
        sendWebhook(event, sessionId, data, status, message);
    }
    if (!socketServer) {
        console.error("Socket server not initialized. Call initializeSocketEmitter first.");
        return;
    }
    socketServer.emitEvent(event, sessionId, { status, message, data });
}
const axiosClient = axios_1.default.create({
    httpsAgent: new https_1.default.Agent({
        rejectUnauthorized: false,
    }),
});
function sendWebhook(event_1, sessionId_1, data_1) {
    return __awaiter(this, arguments, void 0, function* (event, sessionId, data, status = "success", message) {
        try {
            yield axiosClient.post(`${env_1.default.BASE_URL}/api/whatsapp-web/webhook`, {
                sessionId,
                event,
                data,
                status,
                message,
            });
        }
        catch (e) {
            console.error("Error sending webhook", e);
        }
    });
}
