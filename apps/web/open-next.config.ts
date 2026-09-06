import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig({}),
  // OpenNext invokes this instead of `pnpm build`, so package.json `build` can
  // be the OpenNext command without recursing.
  buildCommand: "next build",
};
