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
   */
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
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
