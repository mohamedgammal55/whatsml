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
exports.Server = void 0;
const http_1 = __importDefault(require("http"));
const express_server_1 = require("./express-server");
const env_1 = __importDefault(require("../config/env"));
const websocket_server_1 = require("./websocket-server");
const service_1 = __importDefault(require("../whatsapp/service"));
const utils_1 = require("../utils");
class Server {
    constructor() {
        this.httpPort = env_1.default.PORT;
        this.httpServer = new express_server_1.ExpressServer();
        this.server = http_1.default.createServer(this.httpServer.getApp());
        this.setupSocketServer();
    }
    setupSocketServer() {
        if (env_1.default.ENABLE_WEBSOCKET) {
            this.socketServer = new websocket_server_1.SocketServer(this.server);
        }
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            new service_1.default();
            this.server.listen(this.httpPort, () => {
                console.log(`Server is running on port ${this.httpPort}`);
            });
            if (this.socketServer) {
                (0, utils_1.initializeSocketEmitter)(this.socketServer);
                console.log("WebSocket server is running");
            }
        });
    }
}
exports.Server = Server;
