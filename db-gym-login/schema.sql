-- 1. ENUMs / TYPES
CREATE TYPE users_gender_enum AS ENUM ('male','female','other');
CREATE TYPE programs_category_enum AS ENUM ('Strength','Yoga','Cardio','HIIT','Pilates','Other');
CREATE TYPE programs_difficulty_level_enum AS ENUM ('beginner','intermediate','advanced');
CREATE TYPE subscriptions_status_enum AS ENUM ('active','cancelled','expired');
CREATE TYPE payment_records_payment_status_enum AS ENUM ('pending','completed','failed','refunded');

-- 2. FUNÇÃO GENÉRICA PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABELAS

-- 3.1 users
CREATE TABLE users (
  user_id        SERIAL PRIMARY KEY,
  first_name     VARCHAR(100)    NOT NULL,
  last_name      VARCHAR(100)    NOT NULL,
  email          VARCHAR(255)    NOT NULL UNIQUE,
  password_hash  VARCHAR(255)    NOT NULL,
  date_of_birth  DATE,
  gender         users_gender_enum,
  created_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3.2 trainers
CREATE TABLE trainers (
  trainer_id            SERIAL PRIMARY KEY,
  first_name            VARCHAR(100)    NOT NULL,
  last_name             VARCHAR(100)    NOT NULL,
  email                 VARCHAR(255)    NOT NULL UNIQUE,
  password_hash         VARCHAR(255)    NOT NULL,
  certification_details TEXT,
  bio                   TEXT,
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_trainers_updated_at
  BEFORE UPDATE ON trainers
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3.3 programs
CREATE TABLE programs (
  program_id         SERIAL PRIMARY KEY,
  trainer_id         INT REFERENCES trainers(trainer_id)
                       ON UPDATE CASCADE
                       ON DELETE SET NULL,
  title              VARCHAR(255)                          NOT NULL,
  category           programs_category_enum                NOT NULL,
  description        TEXT,
  difficulty_level   programs_difficulty_level_enum        NOT NULL DEFAULT 'beginner',
  duration_weeks     INT                                    NOT NULL CHECK (duration_weeks > 0),
  price              DECIMAL(10,2)                         NOT NULL DEFAULT 0.00 CHECK (price >= 0),
  created_at         TIMESTAMPTZ                           NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ                           NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3.4 workouts
CREATE TABLE workouts (
  workout_id     SERIAL PRIMARY KEY,
  program_id     INT NOT NULL REFERENCES programs(program_id)
                   ON UPDATE CASCADE
                   ON DELETE CASCADE,
  title          VARCHAR(255)    NOT NULL,
  description    TEXT,
  sequence_order INT             NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3.5 exercises
CREATE TABLE exercises (
  exercise_id          SERIAL PRIMARY KEY,
  workout_id           INT NOT NULL REFERENCES workouts(workout_id)
                          ON UPDATE CASCADE
                          ON DELETE CASCADE,
  name                 VARCHAR(255)    NOT NULL,
  description          TEXT,
  video_url            VARCHAR(255),
  default_reps         INT,
  default_sets         INT,
  default_duration_sec INT,
  created_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3.6 progress_logs
CREATE TABLE progress_logs (
  progress_log_id   SERIAL PRIMARY KEY,
  user_id           INT NOT NULL REFERENCES users(user_id)
                       ON UPDATE CASCADE
                       ON DELETE CASCADE,
  workout_id        INT REFERENCES workouts(workout_id)
                       ON UPDATE CASCADE
                       ON DELETE SET NULL,
  exercise_id       INT REFERENCES exercises(exercise_id)
                       ON UPDATE CASCADE
                       ON DELETE SET NULL,
  reps_completed    INT,
  sets_completed    INT,
  duration_seconds  INT,
  weight_used       DECIMAL(5,2),
  notes             TEXT,
  log_date          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_progress_logs_updated_at
  BEFORE UPDATE ON progress_logs
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3.7 subscriptions
CREATE TABLE subscriptions (
  subscription_id   SERIAL PRIMARY KEY,
  user_id           INT NOT NULL REFERENCES users(user_id)
                       ON UPDATE CASCADE
                       ON DELETE CASCADE,
  program_id        INT NOT NULL REFERENCES programs(program_id)
                       ON UPDATE CASCADE
                       ON DELETE CASCADE,
  start_date        DATE             NOT NULL,
  end_date          DATE             NOT NULL,
  status            subscriptions_status_enum NOT NULL DEFAULT 'active',
  auto_renew        BOOLEAN          NOT NULL DEFAULT TRUE,
  cancel_reason     VARCHAR(255),
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_sub_dates CHECK (start_date <= end_date)
);
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3.8 reviews
CREATE TABLE reviews (
  review_id    SERIAL PRIMARY KEY,
  user_id      INT NOT NULL REFERENCES users(user_id)
                   ON UPDATE CASCADE
                   ON DELETE CASCADE,
  program_id   INT REFERENCES programs(program_id)
                   ON UPDATE CASCADE
                   ON DELETE CASCADE,
  trainer_id   INT REFERENCES trainers(trainer_id)
                   ON UPDATE CASCADE
                   ON DELETE CASCADE,
  rating       INT             NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_reviews_user_program UNIQUE (user_id, program_id)
);
CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3.9 payment_records
CREATE TABLE payment_records (
  payment_id         SERIAL PRIMARY KEY,
  user_id            INT NOT NULL REFERENCES users(user_id)
                         ON UPDATE CASCADE
                         ON DELETE CASCADE,
  subscription_id    INT REFERENCES subscriptions(subscription_id)
                         ON UPDATE CASCADE
                         ON DELETE SET NULL,
  program_id         INT REFERENCES programs(program_id)
                         ON UPDATE CASCADE
                         ON DELETE SET NULL,
  amount             DECIMAL(10,2)    NOT NULL CHECK (amount >= 0),
  currency           CHAR(3)          NOT NULL,
  payment_method     VARCHAR(50),
  payment_status     payment_records_payment_status_enum NOT NULL DEFAULT 'pending',
  transaction_date   TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  created_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_payment_records_updated_at
  BEFORE UPDATE ON payment_records
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3.10 nutrition_plans
CREATE TABLE nutrition_plans (
  nutrition_plan_id  SERIAL PRIMARY KEY,
  program_id         INT NOT NULL REFERENCES programs(program_id)
                         ON UPDATE CASCADE
                         ON DELETE CASCADE,
  title              VARCHAR(255)    NOT NULL,
  description        TEXT,
  calories_per_day   INT             NOT NULL CHECK (calories_per_day > 0),
  created_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_nutrition_plans_updated_at
  BEFORE UPDATE ON nutrition_plans
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. ÍNDICES ADICIONAIS
CREATE INDEX idx_reviews_program_date ON reviews(program_id, created_at DESC);
CREATE INDEX idx_pl_user_logdate   ON progress_logs(user_id, log_date DESC);
CREATE INDEX idx_sub_user_status   ON subscriptions(user_id, status);
