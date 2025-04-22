
/**
 * Edge function: qbo-authorize
 * - Verifies JWT (user must be signed-in)
 * - Redirects to Intuit OAuth2 authorize URL with scopes for QBO
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Environment
const INTUIT_CLIENT_ID = Deno.env.get("INTUIT_CLIENT_ID");
const INTUIT_ENVIRONMENT = Deno.env.get("INTUIT_ENVIRONMENT") || "sandbox";
const QBO_REDIRECT_URI = Deno.env.get("QBO_REDIRECT_URI");

const scopes = [
  "com.intuit.quickbooks.accounting"
];

// OAuth authorize endpoint
const authorizeBase =
  INTUIT_ENVIRONMENT === "production"
    ? "https://appcenter.intuit.com/connect/oauth2"
    : "https://sandbox.appcenter.intuit.com/connect/oauth2";

// Handler
serve(async (req) => {
  // Parse user info from JWT claim
  // "sub" from the access_token is the user_id
  let user_id: string | undefined;
  try {
    const authHeader = req.headers.get("authorization") || "";
    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token) throw new Error("Invalid/missing auth header");
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    user_id = payload.sub;
    if (!user_id) throw new Error("Missing user_id from token");
  } catch (e) {
    return new Response("Unauthorized", { status: 401 });
  }

  const params = new URLSearchParams({
    client_id: INTUIT_CLIENT_ID!,
    scope: scopes.join(" "),
    redirect_uri: QBO_REDIRECT_URI!,
    response_type: "code",
    state: user_id, // for tying callback to user
  });

  // Redirect
  return new Response("", {
    status: 302,
    headers: {
      "location": `${authorizeBase}?${params.toString()}`
    }
  });
});
