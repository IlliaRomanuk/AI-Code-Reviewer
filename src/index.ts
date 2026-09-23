import { createApp } from "./app.js";
import { config } from "./config/env.js";

const app = createApp();

app.listen(config.port, () => {
  console.log(`[server] listening on port ${config.port} (${config.nodeEnv})`);
});
