import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * The enforcement table in `_AI_CONTEXT/01_RULES.md`, wired.
 *
 * These rules exist because the mistakes they catch are silent. A `DELETE` on
 * a content table destroys material a student paid for and raises no error; a
 * Drizzle import in a client component fails at build time only sometimes; an
 * `any` in a server module hides a schema change until production. None of
 * them announce themselves in review.
 */
export default tseslint.config(
  { ignores: [".next", "dist", "node_modules", "out"] },

  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  /**
   * The data layer. Soft delete is the deletion policy: `archived_at`, never a
   * removed row, because an entitlement must never resolve to a missing one.
   *
   * The two legitimate exceptions, both revoking a permission grant rather
   * than removing content, carry an inline disable and a comment saying why.
   */
  {
    files: ["src/server/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression > MemberExpression[property.name='delete']",
          message:
            "Content, catalogue, orders, codes and entitlements are soft-deleted with archived_at. See _AI_CONTEXT/04_DATA.md. If this row is genuinely not one of those, disable this line and say why.",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },

  /**
   * `app/` renders. It calls `src/server/`, and never the database directly.
   * One direction: app → server → schema.
   */
  {
    files: ["app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}", "src/lib/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "drizzle-orm",
              message:
                "The database is reached through src/server/. A component that queries directly is a component that cannot be rendered on the client and cannot be tested without a database.",
            },
            {
              name: "@/db",
              message: "Import a function from src/server/ instead of the connection.",
            },
          ],
          patterns: [
            {
              group: ["@/db/*", "drizzle-orm/*"],
              message: "The database is reached through src/server/.",
            },
          ],
        },
      ],
    },
  },

  /**
   * The directional-property ban, at the layer this codebase actually writes
   * layout in.
   *
   * Stylelint covers `src/styles.css`, but almost no layout lives there:
   * spacing and position are Tailwind utilities in JSX, and `ml-4` compiles to
   * `margin-left` just as surely as the property does. Under `dir="rtl"` a
   * logical utility mirrors itself and a directional one does not, which is
   * how an Arabic page ends up with its chevron on the wrong side and its
   * text crowding the wrong edge.
   *
   * Use the logical form: `ms-` `me-` `ps-` `pe-` `start-` `end-`
   * `text-start` `text-end` `border-s` `border-e` `rounded-s` `rounded-e`.
   */
  {
    files: [
      "app/**/*.tsx",
      "src/components/{account,admin,lms,site}/**/*.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name=/^(className|class)$/] Literal[value=/(^|[\\s:'\"`])-?(ml|mr|pl|pr)-|(^|[\\s:'\"`])-?(left|right)-|(^|[\\s:'\"`])text-(left|right)\\b|(^|[\\s:'\"`])border-[lr]\\b|(^|[\\s:'\"`])rounded-[lr]\\b/]",
          message:
            "Directional Tailwind utility in a className. Use the logical form (ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/border-e). RTL is a `dir` attribute here, not a rewrite. See _AI_CONTEXT/01_RULES.md.",
        },
        {
          selector:
            "JSXAttribute[name.name=/^(className|class)$/] TemplateElement[value.raw=/(^|[\\s:'\"`])-?(ml|mr|pl|pr)-|(^|[\\s:'\"`])-?(left|right)-|(^|[\\s:'\"`])text-(left|right)\\b|(^|[\\s:'\"`])border-[lr]\\b|(^|[\\s:'\"`])rounded-[lr]\\b/]",
          message:
            "Directional Tailwind utility in a className. Use the logical form (ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/border-e). See _AI_CONTEXT/01_RULES.md.",
        },
      ],
    },
  },

  /**
   * `src/components/ui` is vendored shadcn/ui. Its 121 directional utilities
   * are upstream's, they are re-vendored whenever a primitive is updated, and
   * rewriting them is a change to somebody else's code rather than to ours.
   * Recorded rather than hidden: every RTL problem traced to a primitive is
   * fixed at the call site with a logical override.
   */
  {
    files: ["src/components/ui/**/*.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },

  /**
   * Two files that predate the rule and genuinely query the database from the
   * `app/` layer. Recorded as debt rather than hidden: the queries belong in
   * `src/server/admin-content.ts` and `src/server/access-requests.ts`, and
   * moving them is a contained change nobody has made yet.
   *
   * The gate stays on for everything written after this.
   */
  {
    // Globbed loosely on purpose: the real paths contain `[locale]` and
    // `(admin)`, and both are glob syntax.
    files: ["**/admin/content/page.tsx", "**/admin/receipt/**/route.ts"],
    rules: { "no-restricted-imports": "off" },
  },
);
