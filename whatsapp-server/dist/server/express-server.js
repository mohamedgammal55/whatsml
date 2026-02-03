"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("../routes"));
class ExpressServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
    }
    setupRoutes() {
        this.app.use("/", routes_1.default);
        this.app.all("*", (_, res) => res.status(404).json({ error: "URL not found" }));
    }
    getApp() {
        return this.app;
    }
}
exports.ExpressServer = ExpressServer;
