-- =====================================================================
-- KRISTALLBALL MILITARY ASSET MANAGEMENT SYSTEM
-- COMPLETE DATABASE DUMP (SCHEMA + SEED DATA)
-- POSTGRESQL RELATIONAL ENGINE (ACID TRANSACTION COMPLIANT)
-- =====================================================================

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS expenditures CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS transfers CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS initial_balances CASCADE;
DROP TABLE IF EXISTS equipment_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS bases CASCADE;

-- 1. Bases Table
CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    location VARCHAR(150) NOT NULL,
    commander_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER')),
    base_id INT REFERENCES bases(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Equipment Categories & Types Table
CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('WEAPON', 'VEHICLE', 'AMMUNITION')),
    unit_of_measure VARCHAR(30) DEFAULT 'units',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Initial / Baseline Balances Table
CREATE TABLE initial_balances (
    id SERIAL PRIMARY KEY,
    base_id INT REFERENCES bases(id) ON DELETE CASCADE NOT NULL,
    equipment_type_id INT REFERENCES equipment_types(id) ON DELETE CASCADE NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    as_of_date DATE DEFAULT '2026-01-01',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_base_equipment UNIQUE(base_id, equipment_type_id)
);

-- 5. Purchases Table (Stock Inflow)
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

-- 6. Transfers Table (Cross-Base Movements)
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

-- 7. Assignments Table (Allocated to Personnel / Active Deployments)
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

-- 8. Expenditures Table (Consumed / Depleted Inventory)
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

-- 9. Central System Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ultra-fast query and aggregation performance
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

-- =====================================================================
-- SEED DATA INSERTION
-- =====================================================================

-- 1. Bases
INSERT INTO bases (id, name, code, location, commander_name) VALUES
(1, 'Fort Alpha', 'FA-01', 'Arlington, Virginia - Northern Command', 'Col. James Vance'),
(2, 'Fort Bravo', 'FB-02', 'Fort Hood, Texas - III Armored Corps', 'Col. Sarah Mitchell'),
(3, 'Naval Station Echo', 'NE-03', 'San Diego, California - Coastal Fleet', 'Capt. Marcus Reynolds'),
(4, 'FOB Zulu', 'FZ-04', 'Forward Desert Sector - Tactical Ops', 'Maj. David Sterling');

SELECT setval('bases_id_seq', (SELECT MAX(id) FROM bases));

-- 2. Users (Test Credentials)
-- admin_user        | AdminPass123!     | Role: ADMIN
-- commander_alpha   | CommandPass123!   | Role: BASE_COMMANDER (Base #1)
-- commander_bravo   | CommandPass123!   | Role: BASE_COMMANDER (Base #2)
-- logistics_officer | LogisticsPass123! | Role: LOGISTICS_OFFICER (Base #1)
INSERT INTO users (id, username, full_name, password_hash, role, base_id) VALUES
(1, 'admin_user', 'General Arthur Pendelton', '$2a$10$DcHm5Nny.PTiVH8QLETQyu837iPtM2bXOMlKgazx1J3n6IF7tb5n6', 'ADMIN', NULL),
(2, 'commander_alpha', 'Col. James Vance', '$2a$10$m0x8BQ0DpSj2wLBrlRZNNOB4DUY7Si25zGbDTKamg7xWyg/SAvHD2', 'BASE_COMMANDER', 1),
(3, 'commander_bravo', 'Col. Sarah Mitchell', '$2a$10$m0x8BQ0DpSj2wLBrlRZNNOB4DUY7Si25zGbDTKamg7xWyg/SAvHD2', 'BASE_COMMANDER', 2),
(4, 'logistics_officer', 'Major Elena Rostova', '$2a$10$9lWd8BRGjqBGr69cp/1.ouno0TgGS3S301ouSwXxwiD02xVneiMY.', 'LOGISTICS_OFFICER', 1);

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- 3. Equipment Types
INSERT INTO equipment_types (id, name, category, unit_of_measure, description) VALUES
(1, 'M4A1 5.56mm Carbine', 'WEAPON', 'pieces', 'Standard issue selective-fire automatic carbine rifle with modular rail system'),
(2, 'Barrett M82A1 .50 Cal Sniper', 'WEAPON', 'pieces', 'High-powered semi-automatic anti-materiel precision rifle system'),
(3, 'FGM-148 Javelin Missile System', 'WEAPON', 'units', 'Man-portable fire-and-forget medium anti-tank guided missile launcher'),
(4, 'M1A2 SEPv3 Abrams Main Battle Tank', 'VEHICLE', 'vehicles', 'Heavy armored fighting vehicle with 120mm smoothbore cannon and reactive armor'),
(5, 'M1151A1 HMMWV (Humvee) Armored', 'VEHICLE', 'vehicles', 'Expanded capacity high-mobility multi-purpose 4x4 tactical wheeled vehicle'),
(6, 'Stryker ICV M1126 Infantry Carrier', 'VEHICLE', 'vehicles', 'Eight-wheeled armored fighting combat vehicle with remote weapon station'),
(7, '5.56x45mm NATO Ball Ammo (M855A1)', 'AMMUNITION', 'crates', 'Enhanced performance small arms ammunition, 1000 rounds per sealed military crate'),
(8, '120mm Tank APFSDS-T Kinetic Shells', 'AMMUNITION', 'shells', 'Armor-piercing fin-stabilized discarding-sabot tank kinetic penetrators'),
(9, '9x19mm Parabellum Pistol Ammunition', 'AMMUNITION', 'crates', 'Standard sidearm handgun ammunition, 1000 rounds per tactical ammunition crate');

SELECT setval('equipment_types_id_seq', (SELECT MAX(id) FROM equipment_types));

-- 4. Initial Baseline Stock (as of 2026-01-01)
INSERT INTO initial_balances (base_id, equipment_type_id, quantity, as_of_date) VALUES
(1, 1, 450, '2026-01-01'),
(1, 2, 25, '2026-01-01'),
(1, 3, 18, '2026-01-01'),
(1, 4, 12, '2026-01-01'),
(1, 5, 40, '2026-01-01'),
(1, 6, 15, '2026-01-01'),
(1, 7, 300, '2026-01-01'),
(1, 8, 120, '2026-01-01'),
(1, 9, 200, '2026-01-01'),

(2, 1, 380, '2026-01-01'),
(2, 2, 20, '2026-01-01'),
(2, 3, 14, '2026-01-01'),
(2, 4, 24, '2026-01-01'),
(2, 5, 35, '2026-01-01'),
(2, 6, 20, '2026-01-01'),
(2, 7, 250, '2026-01-01'),
(2, 8, 200, '2026-01-01'),
(2, 9, 150, '2026-01-01'),

(3, 1, 200, '2026-01-01'),
(3, 2, 10, '2026-01-01'),
(3, 3, 8, '2026-01-01'),
(3, 4, 0, '2026-01-01'),
(3, 5, 20, '2026-01-01'),
(3, 6, 10, '2026-01-01'),
(3, 7, 180, '2026-01-01'),
(3, 8, 0, '2026-01-01'),
(3, 9, 120, '2026-01-01'),

(4, 1, 150, '2026-01-01'),
(4, 2, 8, '2026-01-01'),
(4, 3, 10, '2026-01-01'),
(4, 4, 4, '2026-01-01'),
(4, 5, 18, '2026-01-01'),
(4, 6, 8, '2026-01-01'),
(4, 7, 120, '2026-01-01'),
(4, 8, 50, '2026-01-01'),
(4, 9, 80, '2026-01-01');

-- 5. Purchases
INSERT INTO purchases (id, base_id, equipment_type_id, quantity, unit_cost, supplier, purchase_order_number, purchase_date, created_by, created_at) VALUES
(1, 1, 1, 50, 1200.00, 'Colt Defense LLC', 'PO-2026-0891', '2026-01-15', 4, '2026-01-15 09:30:00'),
(2, 1, 7, 50, 450.00, 'Lake City Army Ammunition Plant', 'PO-2026-0904', '2026-01-22', 4, '2026-01-22 14:15:00'),
(3, 2, 4, 2, 8500000.00, 'General Dynamics Land Systems', 'PO-2026-0922', '2026-02-05', 1, '2026-02-05 11:00:00'),
(4, 2, 8, 40, 3200.00, 'Picatinny Arsenal Dynamics', 'PO-2026-0940', '2026-02-14', 4, '2026-02-14 16:45:00'),
(5, 1, 5, 5, 220000.00, 'AM General Defense', 'PO-2026-0965', '2026-02-20', 4, '2026-02-20 10:20:00');

SELECT setval('purchases_id_seq', (SELECT MAX(id) FROM purchases));

-- 6. Transfers
INSERT INTO transfers (id, source_base_id, destination_base_id, equipment_type_id, quantity, status, notes, initiated_by, completed_at, timestamp) VALUES
(1, 1, 4, 1, 30, 'COMPLETED', 'Tactical reinforcement for FOB Zulu perimeter defense squad', 4, '2026-01-20 18:00:00', '2026-01-18 10:00:00'),
(2, 2, 1, 8, 20, 'COMPLETED', 'Ammunition balancing transfer for heavy armor battery', 1, '2026-01-25 15:30:00', '2026-01-24 08:30:00'),
(3, 1, 2, 5, 2, 'COMPLETED', 'Maintenance and fleet upgrade rotation', 4, '2026-02-10 12:00:00', '2026-02-08 14:00:00'),
(4, 1, 4, 7, 25, 'IN_TRANSIT', 'Supply convoy scheduled arrival in 48 hours', 4, NULL, '2026-02-18 09:15:00'),
(5, 2, 4, 3, 4, 'PENDING', 'Pending final authorization from Base Commander Bravo', 3, NULL, '2026-02-19 16:40:00');

SELECT setval('transfers_id_seq', (SELECT MAX(id) FROM transfers));

-- 7. Personnel Assignments
INSERT INTO assignments (id, base_id, equipment_type_id, quantity, assigned_to_personnel, unit_name, assignment_date, return_date, status, notes, assigned_by, created_at) VALUES
(1, 1, 1, 45, 'Sgt. Marcus Kane & Squad Alpha', '1st Battalion, 4th Marines', '2026-01-10', NULL, 'ACTIVE', 'Deployment for security rotation', 2, '2026-01-10 08:00:00'),
(2, 1, 5, 6, 'Lt. Sarah Jenkins', 'Combat Reconnaissance Unit 3', '2026-01-12', NULL, 'ACTIVE', 'Perimeter patrol vehicles', 2, '2026-01-12 11:30:00'),
(3, 1, 2, 4, 'Staff Sgt. David Chen', 'Long-range Scout Snipers', '2026-01-15', '2026-02-01', 'RETURNED', 'Marksmanship training & qualifications', 2, '2026-01-15 13:00:00'),
(4, 2, 4, 8, 'Capt. Robert Bradley', '2nd Armored Cavalry Division', '2026-01-20', NULL, 'ACTIVE', 'Active maneuvers deployment', 3, '2026-01-20 09:00:00'),
(5, 2, 1, 30, 'Sgt. Amanda Hayes', 'Mechanized Quick Reaction Team', '2026-02-02', NULL, 'ACTIVE', 'Rapid reaction team armory assignment', 3, '2026-02-02 10:45:00');

SELECT setval('assignments_id_seq', (SELECT MAX(id) FROM assignments));

-- 8. Expenditures
INSERT INTO expenditures (id, base_id, equipment_type_id, quantity, reason, expenditure_date, authorized_by, notes, recorded_by, created_at) VALUES
(1, 1, 7, 15, 'TRAINING', '2026-01-28', 'Col. James Vance', 'Live-fire marksmanship qualification exercise at Range 4', 2, '2026-01-28 17:00:00'),
(2, 1, 9, 10, 'TRAINING', '2026-02-04', 'Col. James Vance', 'Quarterly close-quarters pistol tactical drills', 2, '2026-02-04 16:30:00'),
(3, 2, 8, 12, 'TRAINING', '2026-02-12', 'Col. Sarah Mitchell', '120mm Gunner battle qualification course', 3, '2026-02-12 18:00:00'),
(4, 4, 7, 20, 'COMBAT_OPS', '2026-02-15', 'Maj. David Sterling', 'Expended during counter-insurgent border sector deterrence patrol', 1, '2026-02-15 21:00:00'),
(5, 1, 1, 2, 'MAINTENANCE_LOSS', '2026-02-17', 'Col. James Vance', 'Irreparable barrel rupture during proof-pressure testing; decommissioned', 2, '2026-02-17 14:00:00');

SELECT setval('expenditures_id_seq', (SELECT MAX(id) FROM expenditures));

-- 9. Audit Logs
INSERT INTO audit_logs (id, user_id, action, details, ip_address, created_at) VALUES
(1, 1, 'SYSTEM_INIT', 'System initialized with baseline inventory across 4 bases', '127.0.0.1', '2026-01-01 00:00:00'),
(2, 4, 'PURCHASE', 'Purchased 50 M4A1 Carbines from Colt Defense LLC for Base #1 (PO-2026-0891)', '192.168.1.104', '2026-01-15 09:30:00'),
(3, 4, 'TRANSFER', 'Initiated and completed transfer of 30 M4A1 Carbines from Base #1 to Base #4', '192.168.1.104', '2026-01-18 10:00:00'),
(4, 2, 'ASSIGNMENT', 'Assigned 45 M4A1 Carbines to Sgt. Marcus Kane & Squad Alpha (1st Battalion, 4th Marines)', '192.168.1.102', '2026-01-10 08:00:00'),
(5, 2, 'EXPENDITURE', 'Recorded expenditure of 15 crates of 5.56mm Ammo for Range 4 live-fire exercise', '192.168.1.102', '2026-01-28 17:00:00'),
(6, 4, 'TRANSFER', 'Initiated cross-base transfer of 25 crates of 5.56mm Ammo from Base #1 to Base #4 (Status: IN_TRANSIT)', '192.168.1.104', '2026-02-18 09:15:00');

SELECT setval('audit_logs_id_seq', (SELECT MAX(id) FROM audit_logs));
