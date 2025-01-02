import { spawnSync } from "node:child_process";
import { CmdResponse } from "./types";

export function getChunks(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => reject(err));
  });
}

export function cmd(command: string): CmdResponse {
  return spawnSync(command,{
    shell: true,
    stdio: "inherit",
    cwd: process.cwd(),
    encoding: "utf-8",
    env: process.env
  });
}