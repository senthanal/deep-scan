import { Hono } from "hono";
import { PackageForm, renderer } from "./components";
import { Bindings } from "hono/types";

const app = new Hono<{ Bindings: Bindings }>();

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

app.post('/package', (c) => {
  const { name, version } = c.req.query();
  console.log({ name, version });
  return c.json({ name, version });
});


export default app;
