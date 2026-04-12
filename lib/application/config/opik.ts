import { OpikCallbackHandler } from "opik-langchain";

export function createOpikHandler() {
  return new OpikCallbackHandler({
    projectName: process.env.OPIK_PROJECT_NAME ?? "10ms-analytics",
  });
}