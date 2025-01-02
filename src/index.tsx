import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { PackageForm, renderer } from "./components";
import { Bindings } from "hono/types";
import { Store } from "./Store";
import { OrtScan } from "./ort-scan";

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
      data: Store.getInstance().toString(),
      event: "process-update",
      id: String(new Date().getTime()),
    });
  });
});

app.get("/clear", async (c) => {
  Store.getInstance().clearMessages();
  return c.text("Messages cleared");
});

app.post("/package", async (c) => {
  const { name, version } = await c.req.parseBody();
  await ortScan.scan(name as string, version as string);
  return c.json({ name, version });
});

export default app;
