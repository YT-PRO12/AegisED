CREATE TABLE IF NOT EXISTS patients (
 id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, age INT NOT NULL,
 priority VARCHAR(16) NOT NULL DEFAULT 'Stable', status VARCHAR(24) NOT NULL DEFAULT 'Waiting'
);
CREATE TABLE IF NOT EXISTS doctors (
 id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, specialization VARCHAR(100) NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'Available'
);
CREATE TABLE IF NOT EXISTS beds (
 id SERIAL PRIMARY KEY, bed_number VARCHAR(40) NOT NULL UNIQUE,
 status VARCHAR(24) NOT NULL DEFAULT 'Available', patient_id INT REFERENCES patients(id) ON DELETE RESTRICT
);
CREATE TABLE IF NOT EXISTS emergency_cases (
 id SERIAL PRIMARY KEY, patient_id INT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
 doctor_id INT REFERENCES doctors(id) ON DELETE RESTRICT, bed_id INT REFERENCES beds(id) ON DELETE RESTRICT,
 symptoms TEXT NOT NULL, priority VARCHAR(16) NOT NULL, recommendation TEXT,
 status VARCHAR(24) NOT NULL DEFAULT 'Waiting', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE beds ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE beds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE emergency_cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE emergency_cases ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ;
ALTER TABLE emergency_cases ADD COLUMN IF NOT EXISTS doctor_assigned_at TIMESTAMPTZ;
ALTER TABLE emergency_cases ADD COLUMN IF NOT EXISTS bed_assigned_at TIMESTAMPTZ;
ALTER TABLE emergency_cases ADD COLUMN IF NOT EXISTS treatment_started_at TIMESTAMPTZ;
ALTER TABLE emergency_cases ADD COLUMN IF NOT EXISTS treatment_completed_at TIMESTAMPTZ;
ALTER TABLE emergency_cases ADD COLUMN IF NOT EXISTS discharged_at TIMESTAMPTZ;
ALTER TABLE emergency_cases ADD COLUMN IF NOT EXISTS vitals JSONB NOT NULL DEFAULT '{}';
UPDATE emergency_cases SET arrival_time=created_at WHERE arrival_time IS NULL;
ALTER TABLE emergency_cases ALTER COLUMN arrival_time SET DEFAULT NOW();
ALTER TABLE emergency_cases ALTER COLUMN arrival_time SET NOT NULL;
ALTER TABLE patients ADD CONSTRAINT patient_age_range CHECK(age BETWEEN 0 AND 120);
ALTER TABLE patients ADD CONSTRAINT patient_priority_values CHECK(priority IN ('Critical','Urgent','Stable'));
ALTER TABLE patients ADD CONSTRAINT patient_status_values CHECK(status IN ('Waiting','Assigned','In Treatment','Completed','Discharged'));
ALTER TABLE doctors ADD CONSTRAINT doctor_status_values CHECK(status IN ('Available','Busy','Off Duty'));
ALTER TABLE beds ADD CONSTRAINT bed_status_values CHECK(status IN ('Available','Occupied','Cleaning'));
ALTER TABLE beds ADD CONSTRAINT bed_patient_consistency CHECK((status='Occupied')=(patient_id IS NOT NULL));
ALTER TABLE emergency_cases ADD CONSTRAINT case_priority_values CHECK(priority IN ('Critical','Urgent','Stable'));
ALTER TABLE emergency_cases ADD CONSTRAINT case_status_values CHECK(status IN ('Waiting','Assigned','In Treatment','Completed','Discharged'));
ALTER TABLE emergency_cases ADD CONSTRAINT case_resource_consistency CHECK(
 (status='Waiting' AND doctor_id IS NULL AND bed_id IS NULL) OR
 (status='Assigned' AND doctor_id IS NOT NULL) OR
 (status IN ('In Treatment','Completed','Discharged') AND doctor_id IS NOT NULL AND bed_id IS NOT NULL)
);
CREATE UNIQUE INDEX one_active_case_per_patient ON emergency_cases(patient_id) WHERE status<>'Discharged';
CREATE UNIQUE INDEX one_active_case_per_doctor ON emergency_cases(doctor_id) WHERE status<>'Discharged';
CREATE UNIQUE INDEX one_active_case_per_bed ON emergency_cases(bed_id) WHERE status<>'Discharged';
CREATE INDEX cases_arrival_time ON emergency_cases(arrival_time);
CREATE INDEX cases_patient_history ON emergency_cases(patient_id,created_at DESC);
CREATE INDEX cases_queue ON emergency_cases(status,priority,arrival_time);
CREATE TABLE users (
 id SERIAL PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, role VARCHAR(16) NOT NULL CHECK(role IN ('ADMIN','DOCTOR','NURSE','RECEPTION')),
 doctor_id INT UNIQUE REFERENCES doctors(id) ON DELETE RESTRICT,
 active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(role<>'DOCTOR' OR doctor_id IS NOT NULL)
);
CREATE TABLE sessions (
 token_hash CHAR(64) PRIMARY KEY, user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 csrf_token TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE audit_logs (
 id BIGSERIAL PRIMARY KEY, user_id INT REFERENCES users(id) ON DELETE SET NULL,
 action VARCHAR(80) NOT NULL, entity_type VARCHAR(40) NOT NULL, entity_id INT,
 metadata JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX audit_recent ON audit_logs(created_at DESC);
CREATE INDEX audit_entity ON audit_logs(entity_type,entity_id,created_at DESC);
CREATE TABLE predictions (
 id SERIAL PRIMARY KEY, case_id INT NOT NULL REFERENCES emergency_cases(id) ON DELETE RESTRICT,
 user_id INT NOT NULL REFERENCES users(id), features JSONB NOT NULL, result JSONB NOT NULL,
 model_version TEXT NOT NULL, human_action VARCHAR(16) NOT NULL DEFAULT 'PENDING'
 CHECK(human_action IN ('PENDING','ACCEPT','OVERRIDE','REVIEW')),
 override_reason TEXT, reviewed_by INT REFERENCES users(id), reviewed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX predictions_case ON predictions(case_id,created_at DESC);
CREATE TABLE seed_runs (name TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
