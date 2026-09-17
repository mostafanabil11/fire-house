import type { NextConfig } from "next";

// Where the API really lives. Server Components talk to it directly (no browser
// involved, so no cookie or CORS question), and the rewrite below points at it.
//
// The localhost default is a development convenience and nothing more. Deployed
// without API_ORIGIN set it became a trap: the rewrite pointed at a loopback
// address, the host refused to proxy there (Vercel answers
// DNS_HOSTNAME_RESOLVED_PRIVATE), and every /api/backend call came back 404.
// The site still built and still rendered, so it looked alive while no data
// loaded and no session could be established — the visitor just saw an empty
// menu and a sign-in page. Failing the build says which variable is missing
// instead of shipping that.
function resolveApiOrigin(): string {
  // Empty string counts as unset: a platform that declares a variable it was
  // never given passes "" rather than nothing, and "" is not an origin.
  const configured = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_URL;
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "API_ORIGIN (or NEXT_PUBLIC_API_URL) must be set to the deployed API origin — " +
        "without it every /api/backend request resolves to localhost and fails.",
    );
  }

  return "http://localhost:3100";
}

const API_ORIGIN = resolveApiOrigin();

const nextConfig: NextConfig = {
  // Next 16 serves /_next/* dev resources only to the origin the dev server
  // was addressed by, so opening the site as 127.0.0.1 instead of localhost
  // silently blocks every client chunk — the HTML renders but nothing
  // hydrates. Both spellings point at this machine, so both are allowed.
  // Dev-only setting; it has no effect on a production build.
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // No remotePatterns and no dangerouslyAllowLocalIP: product and category
  // images are stored as root-relative paths and served by this app out of
  // public/, so the optimizer never makes an outbound request. Both settings
  // existed only to permit fetching from http://localhost:3101, which is what
  // the database used to store — and which resolved, in production, to the
  // visitor's own machine.
  //
  // Moving images to a real host later means adding that host here; it does
  // not mean bringing back the local-IP escape hatch.

  // The browser talks to the API through this app's own origin.
  //
  // Deployed, the site and the API sit on unrelated domains (vercel.app and
  // onrender.com), which makes the session cookie a *third-party* cookie.
  // Safari blocks those outright and Chrome is removing them, so signing in
  // appeared to work and then every following request arrived anonymous:
  // refreshing signed you out, the cart refused to add anything, and the admin
  // area came back empty. It looked like a mobile bug because desktop Chrome
  // still permits third-party cookies today.
  //
  // Proxying through /api/backend makes the cookie first-party — same origin as
  // the page — which no browser has any reason to drop.
  // The storefront this project grew out of shelved things under /products
  // and hung menu sections off the site root. A restaurant has one menu, so
  // both now live under /menu — these keep any link that was already shared
  // (or indexed) working instead of turning it into a 404.
  async redirects() {
    return [
      { source: "/products", destination: "/menu", permanent: true },
      { source: "/products/:slug", destination: "/menu/:slug", permanent: true },
      { source: "/sale", destination: "/menu", permanent: true },
      { source: "/size-guide", destination: "/menu", permanent: true },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${API_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
