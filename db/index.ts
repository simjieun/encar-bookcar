import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

const databaseState = globalThis as typeof globalThis & {
  encarBookcarLocalDb?: Database;
  encarBookcarKakaoMigration?: Promise<void>;
};

function createDatabase() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return drizzle(new PGlite(), { schema });
  }

  const dataDirectory =
    process.env.PGLITE_DATA_DIR ??
    path.join(process.cwd(), ".data", "encar-bookcar");
  mkdirSync(path.dirname(dataDirectory), { recursive: true });
  const client = new PGlite(dataDirectory);

  return drizzle(client, { schema });
}

export function getDb() {
  if (!databaseState.encarBookcarLocalDb) {
    databaseState.encarBookcarLocalDb = createDatabase();
  }

  return databaseState.encarBookcarLocalDb;
}

export async function ensureDatabase() {
  if (!databaseState.encarBookcarKakaoMigration) {
    databaseState.encarBookcarKakaoMigration = migrate(getDb(), {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    }).catch((error) => {
      databaseState.encarBookcarKakaoMigration = undefined;
      throw error;
    });
  }

  await databaseState.encarBookcarKakaoMigration;
}
