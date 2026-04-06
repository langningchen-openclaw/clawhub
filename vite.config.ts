import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type Plugin } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const require = createRequire(import.meta.url);

const convexEntry = require.resolve("convex");
const convexRoot = dirname(dirname(dirname(convexEntry)));
const convexReactPath = join(convexRoot, "dist/esm/react/index.js");
const convexBrowserPath = join(convexRoot, "dist/esm/browser/index.js");
const convexValuesPath = join(convexRoot, "dist/esm/values/index.js");
const convexAuthReactPath = require.resolve("@convex-dev/auth/react");

function handleRollupWarning(
  warning: { code?: string; message: string; id?: string },
  warn: (warning: { code?: string; message: string; id?: string }) => void,
) {
  if (
    warning.code === "MODULE_LEVEL_DIRECTIVE" &&
    warning.id?.includes("node_modules") &&
    /use client/i.test(warning.message)
  ) {
    return;
  }
  if (
    warning.code === "UNUSED_EXTERNAL_IMPORT" &&
    /@tanstack\/start-|@tanstack\/router-core\/ssr\/(client|server)/.test(warning.message)
  ) {
    return;
  }
  if (warning.code === "EMPTY_BUNDLE" || /Generated an empty chunk/i.test(warning.message)) {
    return;
  }
  warn(warning);
}

type SourceReplacement = readonly [from: string, to: string];

const arkSafariInOperatorFixes = [
  {
    suffix: "/node_modules/.vite/deps/arktype.js",
    replacements: [
      [
        '"expression" in value',
        'Object.prototype.hasOwnProperty.call(value, "expression")',
      ],
      ['"toJSON" in o', 'Object.prototype.hasOwnProperty.call(o, "toJSON")'],
      ['"morphs" in schema', 'Object.prototype.hasOwnProperty.call(schema, "morphs")'],
      ['"branches" in schema', 'Object.prototype.hasOwnProperty.call(schema, "branches")'],
      ['"unit" in schema', 'Object.prototype.hasOwnProperty.call(schema, "unit")'],
      ['"reference" in schema', 'Object.prototype.hasOwnProperty.call(schema, "reference")'],
      ['"proto" in schema', 'Object.prototype.hasOwnProperty.call(schema, "proto")'],
      ['"domain" in schema', 'Object.prototype.hasOwnProperty.call(schema, "domain")'],
      [
        '"value" in transformedInner',
        'Object.prototype.hasOwnProperty.call(transformedInner, "value")',
      ],
      ['"default" in this.inner', 'Object.prototype.hasOwnProperty.call(this.inner, "default")'],
      ['"variadic" in schema', 'Object.prototype.hasOwnProperty.call(schema, "variadic")'],
      ['"prefix" in schema', 'Object.prototype.hasOwnProperty.call(schema, "prefix")'],
      [
        '"defaultables" in schema',
        'Object.prototype.hasOwnProperty.call(schema, "defaultables")',
      ],
      ['"optionals" in schema', 'Object.prototype.hasOwnProperty.call(schema, "optionals")'],
      ['"postfix" in schema', 'Object.prototype.hasOwnProperty.call(schema, "postfix")'],
      [
        '"minVariadicLength" in schema',
        'Object.prototype.hasOwnProperty.call(schema, "minVariadicLength")',
      ],
      ['"description" in ctx', 'Object.prototype.hasOwnProperty.call(ctx, "description")'],
      ['"data" in input', 'Object.prototype.hasOwnProperty.call(input, "data")'],
      ['"get" in desc', 'Object.prototype.hasOwnProperty.call(desc, "get")'],
      ['"set" in desc', 'Object.prototype.hasOwnProperty.call(desc, "set")'],
    ] satisfies SourceReplacement[],
  },
  {
    suffix: "/node_modules/@ark/util/out/serialize.js",
    replacements: [
      [
        '"expression" in value',
        'Object.prototype.hasOwnProperty.call(value, "expression")',
      ],
      ['"toJSON" in o', 'Object.prototype.hasOwnProperty.call(o, "toJSON")'],
    ],
  },
  {
    suffix: "/node_modules/@ark/schema/out/parse.js",
    replacements: [
      ['"morphs" in schema', 'Object.prototype.hasOwnProperty.call(schema, "morphs")'],
      ['"branches" in schema', 'Object.prototype.hasOwnProperty.call(schema, "branches")'],
      ['"unit" in schema', 'Object.prototype.hasOwnProperty.call(schema, "unit")'],
      ['"reference" in schema', 'Object.prototype.hasOwnProperty.call(schema, "reference")'],
      ['"proto" in schema', 'Object.prototype.hasOwnProperty.call(schema, "proto")'],
      ['"domain" in schema', 'Object.prototype.hasOwnProperty.call(schema, "domain")'],
    ] satisfies SourceReplacement[],
  },
  {
    suffix: "/node_modules/@ark/schema/out/node.js",
    replacements: [
      [
        '"value" in transformedInner',
        'Object.prototype.hasOwnProperty.call(transformedInner, "value")',
      ],
    ] satisfies SourceReplacement[],
  },
  {
    suffix: "/node_modules/@ark/schema/out/scope.js",
    replacements: [
      ['"branches" in schema', 'Object.prototype.hasOwnProperty.call(schema, "branches")'],
    ] satisfies SourceReplacement[],
  },
  {
    suffix: "/node_modules/@ark/schema/out/structure/optional.js",
    replacements: [
      ['"default" in this.inner', 'Object.prototype.hasOwnProperty.call(this.inner, "default")'],
    ] satisfies SourceReplacement[],
  },
  {
    suffix: "/node_modules/@ark/schema/out/structure/sequence.js",
    replacements: [
      ['"variadic" in schema', 'Object.prototype.hasOwnProperty.call(schema, "variadic")'],
      ['"prefix" in schema', 'Object.prototype.hasOwnProperty.call(schema, "prefix")'],
      [
        '"defaultables" in schema',
        'Object.prototype.hasOwnProperty.call(schema, "defaultables")',
      ],
      ['"optionals" in schema', 'Object.prototype.hasOwnProperty.call(schema, "optionals")'],
      ['"postfix" in schema', 'Object.prototype.hasOwnProperty.call(schema, "postfix")'],
      [
        '"minVariadicLength" in schema',
        'Object.prototype.hasOwnProperty.call(schema, "minVariadicLength")',
      ],
    ] satisfies SourceReplacement[],
  },
  {
    suffix: "/node_modules/@ark/schema/out/structure/prop.js",
    replacements: [
      ['"default" in this.inner', 'Object.prototype.hasOwnProperty.call(this.inner, "default")'],
    ] satisfies SourceReplacement[],
  },
  {
    suffix: "/node_modules/@ark/schema/out/shared/implement.js",
    replacements: [
      ['"description" in ctx', 'Object.prototype.hasOwnProperty.call(ctx, "description")'],
    ] satisfies SourceReplacement[],
  },
  {
    suffix: "/node_modules/@ark/schema/out/shared/errors.js",
    replacements: [['"data" in input', 'Object.prototype.hasOwnProperty.call(input, "data")']] satisfies SourceReplacement[],
  },
  {
    suffix: "/node_modules/@ark/util/out/clone.js",
    replacements: [
      ['"get" in desc', 'Object.prototype.hasOwnProperty.call(desc, "get")'],
      ['"set" in desc', 'Object.prototype.hasOwnProperty.call(desc, "set")'],
    ] satisfies SourceReplacement[],
  },
] as const;

function patchArkSafariInOperator(): Plugin {
  return {
    name: "patch-ark-safari-in-operator",
    enforce: "pre",
    transform(code, id) {
      const normalizedId = id.split("?")[0]?.replace(/\\/g, "/");
      const fix = arkSafariInOperatorFixes.find((entry) => normalizedId.endsWith(entry.suffix));
      if (!fix) return null;

      let nextCode = code;
      for (const [from, to] of fix.replacements) {
        if (!nextCode.includes(from)) {
          this.error(`Expected to patch ${from} in ${normalizedId}`);
        }
        nextCode = nextCode.replaceAll(from, to);
      }

      return {
        code: nextCode,
        map: null,
      };
    },
  };
}

const config = defineConfig({
  resolve: {
    dedupe: ["convex", "@convex-dev/auth", "react", "react-dom"],
    alias: {
      "convex/react": convexReactPath,
      "convex/browser": convexBrowserPath,
      "convex/values": convexValuesPath,
      "@convex-dev/auth/react": convexAuthReactPath,
    },
  },
  optimizeDeps: {
    include: ["convex/react", "convex/browser"],
  },
  plugins: [
    patchArkSafariInOperator(),
    devtools(),
    nitro({
      serverDir: "server",
      rollupConfig: {
        onwarn: handleRollupWarning,
      },
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  build: {
    // Keep the shipped client bundle parseable in Safari/WebKit.
    target: "safari15",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      onwarn: handleRollupWarning,
    },
  },
});

export default config;
