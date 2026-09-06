"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, organizationClient } from "better-auth/client/plugins";
import type { auth } from "./index";

export const authClient = createAuthClient({
  plugins: [organizationClient(), inferAdditionalFields<typeof auth>()],
});
