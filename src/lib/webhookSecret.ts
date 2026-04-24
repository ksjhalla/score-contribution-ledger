// Helpers for trigger webhook signing secrets.
// The raw secret is shown to the user once; only the SHA-256 hash is stored.

export const generateWebhookSecret = (): string => {
  const id = crypto.randomUUID().replace(/-/g, "");
  // Add a second random chunk for extra entropy (~256 bits total).
  const extra = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `whsec_${id}${extra}`;
};

export const sha256Hex = async (input: string): Promise<string> => {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};