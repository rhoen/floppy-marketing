# Floppy Marketing

Static landing page for the Floppy software application.

## Local preview

Open `index.html` in a browser, or serve the directory with any static file
server.

## Cloudflare Pages

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `.`

Do not use `npx wrangler deploy` as the Pages build/deploy command for this
site. That command deploys a Cloudflare Worker, and Wrangler will fail unless
the account has a `workers.dev` subdomain or explicit Worker routes configured.

In Cloudflare Pages, leave the build command empty and let Pages publish the
static files from the output directory above.

Replace the placeholder video URL in `index.html` when the production video is
ready.
