import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /*
   * The production image runs `.next/standalone/server.js`, which is a self
   * contained bundle of the server and only the dependencies it traced. It is
   * what makes the runtime stage of the Dockerfile a few hundred megabytes
   * instead of a `node_modules` on a KVM 2 with 8 GB of disk to share between
   * the image, the database and every uploaded PDF.
   *
   * `next dev` and `next start` are unaffected.
   */
  output: "standalone",

  /*
   * Every upload in this app — receipts, product images, avatars,
   * testimonial screenshots, roster photos, and course resources up to
   * MAX_RESOURCE_BYTES (200 MB) — goes through a Server Action as
   * `FormData`, not a dedicated API route. Next's default body limit for
   * that path is 1 MB, which is smaller than almost any real phone photo;
   * left at the default, every one of those uploads 500s in production
   * while working locally against a small test file.
   *
   * 220 MB here, not 200: Next parses this string with the `bytes` package,
   * where "mb" is decimal (1000^2), so "200mb" is 200,000,000 bytes.
   * MAX_RESOURCE_BYTES in `src/server/storage.ts` is binary (200 * 1024 *
   * 1024 = 209,715,200 bytes). A file the app calls "under 200 MB" and
   * accepts could be over Next's decimal 200mb, which raw-limits the
   * request before the Server Action ever runs -- no friendly "too large"
   * message, just a raw multipart parse failure ("Unexpected end of
   * form") thrown by Next's own body reader. 220mb clears
   * MAX_RESOURCE_BYTES with room for multipart boundary/header overhead on
   * a multi-file batch, so the app's own size check is always what fires.
   */
  experimental: {
    serverActions: {
      bodySizeLimit: "220mb",
    },
  },

  /*
   * The app sits behind Caddy, which terminates TLS and adds the security
   * headers it can. These are the ones that belong to the application because
   * they describe the application.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // No page in this product needs a camera, a microphone or a
          // location, and saying so is cheaper than auditing that it stays true.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Receipts and resources are served through checked routes. Neither
          // should ever be framed by another origin, and nor should the admin.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
