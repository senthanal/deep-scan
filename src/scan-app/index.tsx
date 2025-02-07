import {Hono} from "hono";
import {streamSSE} from "hono/streaming";
import {PackageForm, renderer} from "./components";
import {Bindings} from "hono/types";
import {ScanPackage, ScanPackageOptions, UILogger} from "@senthanal/deep-scan-lib";

const app = new Hono<{ Bindings: Bindings }>();
const logger = new UILogger();

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
        <PackageForm/>
      </div>
    </main>
  );
});

app.get("/notifications", async (c) => {
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      data: logger.formatTaskLogAsString(),
      event: "process-update",
      id: String(new Date().getTime()),
    });
  });
});

app.get("/violations", async (c) => {
  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      data: logger.formatViolationLogAsString(),
      event: "violations-update",
      id: String(new Date().getTime()),
    });
  });
});

app.get("/clear", async (c) => {
  logger.resetLog();
  return c.text("Messages cleared");
});

app.post("/package", async (c) => {
  const {name, version, ortConfigRepo} = await c.req.parseBody();
  const options: ScanPackageOptions = {
    packageName: name as string,
    packageVersion: version as string,
    ortConfigRepoUrl: ortConfigRepo as string
  };
  const ortScan = new ScanPackage(logger, options);
  ortScan.scan();
  return c.json({name, version, ortConfigRepo});
});

export default app;
