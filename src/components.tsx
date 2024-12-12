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
        <script src="https://unpkg.com/htmx.org@2.0.3"></script>
        <script src="https://unpkg.com/hyperscript.org@0.9.9"></script>
        <title>ORT Deep Scan</title>
      </head>
      <body>
        ${children}
      </body>
    </html>
  `;
});

export const PackageForm = () => {
  return html`
    <form hx-post="/package" hx-trigger="submit" hx-swap="outerHTML">
      <fieldset class="grid">
        <input type="text" placeholder="Name of the package" aria-label="Package" name="name" />
        <input type="text" placeholder="Version of the package" aria-label="Package Version" name="version" />
        <button type="submit">Submit</button>
      </fieldset>
    </form>
  `;
};
