/**
 * Security headers.
 *
 * This is a government-facing prototype, so the browser is told the same things
 * a deployment would tell it. The headers are set here rather than left to the
 * host, so they travel with the application whoever runs it.
 *
 * HSTS is sent only in production. On a development machine it would pin
 * localhost to HTTPS in the browser's preload cache and make the next `npm run
 * dev` unreachable.
 */
const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  // No MIME sniffing: a file we serve as JSON is read as JSON.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Nothing here should ever be framed, so clickjacking has nothing to work with.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the origin to other sites, the full path only to ourselves. An
  // approval id in a URL is not something to hand to a third party.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The product asks for none of these, so it should not be able to take them.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // Force HTTPS for two years, subdomains included, once we are on a real host.
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,

  optimizeFonts: false,

  // An accidental trailing header is worse than none: this replaces, it does
  // not append, and it covers every route including the API.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
