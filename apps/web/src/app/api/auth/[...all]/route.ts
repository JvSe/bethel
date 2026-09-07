import { auth } from "@bethel/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

async function handle(method: "GET" | "POST", request: Request) {
  try {
    return await handler[method](request);
  } catch (error) {
    console.error(`[auth] ${method} ${new URL(request.url).pathname}`, error);
    return Response.json({ message: "Erro interno ao autenticar." }, { status: 500 });
  }
}

export const GET = (request: Request) => handle("GET", request);
export const POST = (request: Request) => handle("POST", request);
