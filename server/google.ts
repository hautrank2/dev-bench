import { OAuth2Client } from "google-auth-library";

export type GoogleIdentity = { sub: string; email: string; name: string };
export type GoogleProvider = {
  authorizationUrl: (state: string, nonce: string, challenge: string) => string;
  exchange: (
    code: string,
    verifier: string,
    nonce: string,
  ) => Promise<GoogleIdentity>;
};
export const googleProvider = (
  clientId: string,
  secret: string,
  redirectUri: string,
): GoogleProvider => {
  const client = new OAuth2Client(clientId, secret, redirectUri);
  return {
    authorizationUrl: (state, nonce, challenge) => {
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        nonce,
        code_challenge: challenge,
        code_challenge_method: "S256",
        prompt: "select_account",
      }).toString();
      return url.toString();
    },
    exchange: async (code, verifier, nonce) => {
      const { tokens } = await client.getToken({
        code,
        codeVerifier: verifier,
        redirect_uri: redirectUri,
      });
      if (!tokens.id_token)
        throw new Error("Google did not return an identity token");
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (
        !payload?.sub ||
        !payload.email ||
        !payload.email_verified ||
        payload.nonce !== nonce
      ) {
        throw new Error("Google identity verification failed");
      }
      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
      };
    },
  };
};
