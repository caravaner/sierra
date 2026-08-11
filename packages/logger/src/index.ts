import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

// Pino transports run the pretty-printer in a worker thread, and thread-stream
// resolves that worker (pino/lib/worker.js) by real filesystem path. Next
// bundles server code, which rewrites the path into .next/server/vendor-chunks/
// where the worker doesn't exist — so inside Next we emit plain JSON instead.
// Standalone Node scripts (seeds, workers, CLIs) still get pretty output.
const insideNextBundle = Boolean(process.env.NEXT_RUNTIME);

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isDev &&
    !insideNextBundle && {
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
