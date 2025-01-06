import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { PackageForm, renderer } from "./components";
import { Bindings } from "hono/types";
import { ScanLogger } from "../scan-lib/ScanLogger";
import { OrtScan } from "../scan-lib/ort-scan";
import { ViolationsStore } from "../scan-lib/ViolationsStore";

const app = new Hono<{ Bindings: Bindings }>();
const ortScan = new OrtScan();

app.use("/notify/*", async (c, next) => {
  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");
  await next();
});

app.get("*", renderer);

app.get("/", (c) => {
  return c.render(
    <main class="container">
      <h1>Home</h1>
      <div>
        <PackageForm />
      </div>
    </main>
  );
});

app.get("/notifications", async (c) => {
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      data: ScanLogger.getInstance().formatLogAsString(),
      event: "process-update",
      id: String(new Date().getTime()),
    });
  });
});

app.get("/violations", async (c) => {
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      data: ViolationsStore.getInstance().toString(),
      event: "violations-update",
      id: String(new Date().getTime()),
    });
  });
});

app.get("/clear", async (c) => {
  ScanLogger.getInstance().resetLog();
  ViolationsStore.getInstance().clearMessages();
  return c.text("Messages cleared");
});

app.post("/package", async (c) => {
  const { name, version, ortConfigRepo } = await c.req.parseBody();
  await ortScan.scan(name as string, version as string, ortConfigRepo as string);
  return c.json({ name, version, ortConfigRepo });
});

export default app;
