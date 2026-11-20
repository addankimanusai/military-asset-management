-- Re-export of backend/models/schema.sql at root level
-- Compatible with PostgreSQL 12+

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS expenditures CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS initial_balances CASCADE;
DROP TABLE IF EXISTS equipment_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS bases CASCADE;

CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    location VARCHAR(150) NOT NULL,
    commander_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')),
    base_id INT REFERENCES bases(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('WEAPON', 'VEHICLE', 'AMMUNITION')),
    unit_of_measure VARCHAR(30) DEFAULT 'units',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE initial_balances (
    id SERIAL PRIMARY KEY,
    base_id INT REFERENCES bases(id) ON DELETE CASCADE NOT NULL,
    equipment_type_id INT REFERENCES equipment_types(id) ON DELETE CASCADE NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    as_of_date DATE DEFAULT '2026-01-01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_base_equipment UNIQUE(base_id, equipment_type_id)
);

CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,
    base_id INT REFERENCES bases(id) ON DELETE RESTRICT NOT NULL,
    equipment_type_id INT REFERENCES equipment_types(id) ON DELETE RESTRICT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 2) DEFAULT 0.00,
    supplier VARCHAR(150) NOT NULL,
    purchase_order_number VARCHAR(100),
    purchase_date DATE DEFAULT CURRENT_DATE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,
    source_base_id INT REFERENCES bases(id) ON DELETE RESTRICT NOT NULL,
    destination_base_id INT REFERENCES bases(id) ON DELETE RESTRICT NOT NULL,
    equipment_type_id INT REFERENCES equipment_types(id) ON DELETE RESTRICT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    initiated_by INT REFERENCES users(id) ON DELETE SET NULL,
    completed_at TIMESTAMP,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT different_bases CHECK (source_base_id <> destination_base_id)
);

CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    base_id INT REFERENCES bases(id) ON DELETE RESTRICT NOT NULL,
    equipment_type_id INT REFERENCES equipment_types(id) ON DELETE RESTRICT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    assigned_to_personnel VARCHAR(100) NOT NULL,
    unit_name VARCHAR(100) NOT NULL,
    assignment_date DATE DEFAULT CURRENT_DATE,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RETURNED')),
    notes TEXT,
    assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenditures (
    id SERIAL PRIMARY KEY,
    base_id INT REFERENCES bases(id) ON DELETE RESTRICT NOT NULL,
    equipment_type_id INT REFERENCES equipment_types(id) ON DELETE RESTRICT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('TRAINING', 'COMBAT_OPS', 'MAINTENANCE_LOSS', 'DECOMMISSIONED', 'EXPIRED')),
    expenditure_date DATE DEFAULT CURRENT_DATE,
    authorized_by VARCHAR(100) NOT NULL,
    notes TEXT,
    recorded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bases_code ON bases(code);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_base ON users(role, base_id);
CREATE INDEX idx_initial_balances_base ON initial_balances(base_id);
CREATE INDEX idx_purchases_base_equip ON purchases(base_id, equipment_type_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_transfers_src_dst ON transfers(source_base_id, destination_base_id);
CREATE INDEX idx_transfers_equip ON transfers(equipment_type_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_assignments_base_equip ON assignments(base_id, equipment_type_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_expenditures_base_equip ON expenditures(base_id, equipment_type_id);
CREATE INDEX idx_expenditures_reason ON expenditures(reason);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
