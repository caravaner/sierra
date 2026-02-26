import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
});

export type Logger = pino.Logger;

/** Create a child logger pre-bound with a fixed context object. */
export function makeLogger(context: Record<string, unknown>): Logger {
  return logger.child(context);
}
