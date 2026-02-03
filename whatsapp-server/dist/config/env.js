"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Types_1 = require("../Types");
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z
    .object({
    PORT: zod_1.z.number(),
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    BASE_URL: zod_1.z.string().optional(),
    ENABLE_WEBHOOK: zod_1.z.boolean(),
    ENABLE_WEBSOCKET: zod_1.z.boolean(),
    BOT_NAME: zod_1.z.string().optional().default("Baileys Bot"),
    DATABASE_URL: zod_1.z.string(),
    LOG_LEVEL: zod_1.z.nativeEnum(Types_1.LogLevel).default(Types_1.LogLevel.INFO),
    RECONNECT_INTERVAL: zod_1.z.number().default(0),
    MAX_RECONNECT_RETRIES: zod_1.z.number().default(5),
    SSE_MAX_QR_GENERATION: zod_1.z.number().default(5),
    SESSION_CONFIG_ID: zod_1.z.string().optional().default("session-config"),
    API_KEY: zod_1.z.string(),
})
    .superRefine((data, ctx) => {
    if (data.ENABLE_WEBHOOK && !data.BASE_URL) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "BASE_URL is required when ENABLE_WEBHOOK is true",
            path: ["BASE_URL"],
        });
    }
});
const processEnv = {
    PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
    NODE_ENV: process.env.NODE_ENV,
    BASE_URL: process.env.BASE_URL,
    ENABLE_WEBHOOK: process.env.ENABLE_WEBHOOK === "true",
    ENABLE_WEBSOCKET: process.env.ENABLE_WEBSOCKET === "true",
    BOT_NAME: process.env.BOT_NAME,
    DATABASE_URL: process.env.DATABASE_URL,
    LOG_LEVEL: process.env.LOG_LEVEL,
    RECONNECT_INTERVAL: process.env.RECONNECT_INTERVAL
        ? Number(process.env.RECONNECT_INTERVAL)
        : undefined,
    MAX_RECONNECT_RETRIES: process.env.MAX_RECONNECT_RETRIES
        ? Number(process.env.MAX_RECONNECT_RETRIES)
        : undefined,
    SSE_MAX_QR_GENERATION: process.env.SSE_MAX_QR_GENERATION
        ? Number(process.env.SSE_MAX_QR_GENERATION)
        : undefined,
    SESSION_CONFIG_ID: process.env.SESSION_CONFIG_ID,
    API_KEY: process.env.API_KEY,
};
let env = process.env;
if (!process.env.SKIP_ENV_VALIDATION) {
    const formatErrors = (errors) => Object.entries(errors)
        .map(([name, value]) => {
        if (value && "_errors" in value)
            return `${name}: ${value._errors.join(", ")}\n`;
        return null;
    })
        .filter(Boolean);
    const parsedEnv = envSchema.safeParse(processEnv);
    if (!parsedEnv.success) {
        const error = formatErrors(parsedEnv.error.format());
        console.error("❌ Invalid environment variables:\n", ...error);
        throw new Error("Invalid environment variables\n" + error.join(""));
    }
    env = parsedEnv.data;
}
else {
    env = processEnv;
}
exports.default = env;
