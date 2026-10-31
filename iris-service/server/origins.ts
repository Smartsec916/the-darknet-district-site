// The websites allowed to call the chat API from a browser and to frame the /embed
// widget. One list for both, set with ALLOWED_ORIGINS (comma-separated).
export const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || "https://thedarknetdistrict.com,https://www.thedarknetdistrict.com")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean)
);

// The service's public address, which the /embed page may connect to
export const SERVICE_ORIGIN = "https://darknet-district-iris.onrender.com";
