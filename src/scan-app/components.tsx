import { html } from "hono/html";
import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children }) => {
  return html`
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
        />
        <script src="https://unpkg.com/htmx.org@2.0.4"></script>
        <script src="https://unpkg.com/hyperscript.org@0.9.9"></script>
        <script src="https://unpkg.com/htmx-ext-sse@2.2.2/sse.js"></script>
        <title>ORT Deep Scan</title>
      </head>
      <body>
        <header>${children}</header>
        <div id="notfound" style="display: none"></div>
        <main
          id="main"
          class="container"
          hx-ext="sse"
          sse-connect="/notifications"
          sse-swap="process-update"
        >
          Process log goes here...
        </main>
      </body>
    </html>
  `;
});

export const PackageForm = () => {
  return html`
    <form
      hx-post="/package"
      hx-trigger="submit"
      hx-swap="body"
      hx-target="#notfound"
    >
      <fieldset class="grid">
        <input
          type="text"
          placeholder="Name of the package"
          aria-label="Package"
          name="name"
        />
        <input
          type="text"
          placeholder="Version of the package"
          aria-label="Package Version"
          name="version"
        />
      </fieldset>
      <fieldset class="grid">
        <input
          type="url"
          value="https://github.com/senthanal/ort-config.git"
          placeholder="Git clone repo url for the ORT config"
          aria-label="Git clone repo url"
          name="ortConfigRepo"
        />
      </fieldset>
      <fieldset class="grid">
        <button type="submit">Submit</button>
        <button type="reset" hx-get="/clear" hx-target="#status">Clear</button>
      </fieldset>
    </form>
    <p>
      <mark
        id="violations"
        class="container"
        hx-ext="sse"
        sse-connect="/violations"
        sse-swap="violations-update"
        >Violations found</mark
      >
    </p>
  `;
};
