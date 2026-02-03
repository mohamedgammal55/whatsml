"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyValidator = apiKeyValidator;
exports.apiKeyValidatorParam = apiKeyValidatorParam;
const env_1 = __importDefault(require("../config/env"));
function apiKeyValidator(req, res, next) {
    next();
}
function apiKeyValidatorParam(req, res, next) {
    next();
}
