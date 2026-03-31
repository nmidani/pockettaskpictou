import { pool } from "./index";

/**
 * Runs all schema DDL idempotently using IF NOT EXISTS guards.
 * Safe to call on every cold start — will never fail if tables already exist.
 */
export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Enums — use DO block so we can check existence without erroring
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
          CREATE TYPE payment_method AS ENUM ('cash', 'etransfer');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
          CREATE TYPE task_status AS ENUM ('open', 'claimed', 'in_progress', 'completed', 'cancelled');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
          CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid     varchar PRIMARY KEY,
        sess    jsonb   NOT NULL,
        expire  timestamp NOT NULL
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id                varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        email             varchar UNIQUE,
        first_name        varchar,
        last_name         varchar,
        profile_image_url varchar,
        role              varchar(20) NOT NULL DEFAULT 'user',
        suspended         boolean     NOT NULL DEFAULT false,
        created_at        timestamptz NOT NULL DEFAULT now(),
        updated_at        timestamptz NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id                      text PRIMARY KEY,
        role                    text,
        town                    text,
        bio                     text,
        phone                   text,
        is_phone_verified       boolean   NOT NULL DEFAULT false,
        phone_verification_code text,
        tasks_posted            integer   NOT NULL DEFAULT 0,
        tasks_completed         integer   NOT NULL DEFAULT 0,
        rating                  real,
        review_count            integer   NOT NULL DEFAULT 0,
        trust_score             integer   NOT NULL DEFAULT 0,
        reports_count           integer   NOT NULL DEFAULT 0,
        last_task_completed_at  timestamp,
        posts_today             integer   NOT NULL DEFAULT 0,
        applies_today           integer   NOT NULL DEFAULT 0,
        daily_reset_at          timestamp,
        last_action_at          timestamp,
        created_at              timestamp NOT NULL DEFAULT now(),
        updated_at              timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id                          integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        title                       text NOT NULL,
        description                 text NOT NULL,
        category                    text NOT NULL,
        pay                         real NOT NULL,
        payment_method              payment_method NOT NULL DEFAULT 'cash',
        estimated_hours             real,
        status                      task_status NOT NULL DEFAULT 'open',
        lat                         real,
        lng                         real,
        location_name               text,
        town                        text,
        posted_by_id                text NOT NULL,
        claimed_by_id               text,
        claimed_at                  timestamp,
        assigned_to_id              text,
        assigned_at                 timestamp,
        application_window_ends_at  timestamp,
        stripe_session_id           text UNIQUE,
        created_at                  timestamp NOT NULL DEFAULT now(),
        updated_at                  timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id            integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        task_id       integer           NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        applicant_id  text              NOT NULL,
        message       text,
        status        application_status NOT NULL DEFAULT 'pending',
        applicant_lat real,
        applicant_lng real,
        score         real,
        created_at    timestamp         NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id         integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        task_id    integer   NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        sender_id  text      NOT NULL,
        content    text      NOT NULL,
        read       boolean   NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ratings (
        id         integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        task_id    integer   NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        rater_id   text      NOT NULL,
        rated_id   text      NOT NULL,
        rating     integer   NOT NULL,
        review     text,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id          integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        reporter_id text      NOT NULL,
        target_type text      NOT NULL,
        target_id   text      NOT NULL,
        reason      text      NOT NULL,
        details     text,
        created_at  timestamp NOT NULL DEFAULT now()
      );
    `);

    await client.query("COMMIT");
    console.log("[db] Schema migration complete");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
