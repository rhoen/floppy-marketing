# Floppy Marketing

Static landing page for the Floppy software application.

## Local preview

Open `src/index.html` in a browser, or serve `src/` with any static file server.

## Cloudflare Workers Static Assets

This project is configured for Cloudflare Workers Static Assets through
`wrangler.jsonc`.

- Build command: leave blank
- Deploy command: `npx wrangler deploy`
- Assets directory: `src/`

Wrangler needs one public deployment target:

- Register a `workers.dev` subdomain in Cloudflare, or
- Add a custom domain/route for this Worker in Cloudflare and `wrangler.jsonc`.

The current failure happens after assets upload because the account does not
yet have a `workers.dev` subdomain and no Worker route is configured.

Replace the placeholder video URL in `src/index.html` when the production video
is ready.
