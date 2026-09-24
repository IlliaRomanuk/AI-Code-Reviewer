import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config/env.js";
import * as schema from "./schema.js";

const pool = new Pool({ connectionString: config.database.url });

// node-postgres: ошибка на "простаивающем" клиенте пула (например, БД
// разорвала соединение) эмитит 'error' на самом Pool. Без обработчика
// это необработанное событие роняет весь процесс — см. документацию pg.
pool.on("error", (err) => {
  console.error("[db] unexpected error on idle client:", err);
});

export const db = drizzle(pool, { schema });
