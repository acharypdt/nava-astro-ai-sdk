-- Migration: 0001_init.sql

-- Tables for Astrology Platform

-- Storing astrological rules as AST (JSON)
CREATE TABLE IF NOT EXISTS astrology_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'Gaja Kesari Yoga', 'Manglik Dosha'
    condition_ast TEXT NOT NULL, -- JSON AST
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Storing dynamic prompts for AI context
CREATE TABLE IF NOT EXISTS dynamic_prompts (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL, -- e.g., 'Career', 'Marriage', 'Spiritual'
    system_prompt TEXT NOT NULL,
    temperature REAL DEFAULT 0.7,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category)
);

-- Storing classical texts for context injection
CREATE TABLE IF NOT EXISTS classical_texts (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL, -- e.g., 'Brihat Parashara Hora Shastra'
    sutra_id TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT, -- JSON metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User table for Auth
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    birth_data_json TEXT, -- Default birth profile
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Centralized application logs for error tracking
CREATE TABLE IF NOT EXISTS app_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    context TEXT NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pre-fill some rules
INSERT OR IGNORE INTO astrology_rules (id, name, category, condition_ast) VALUES 
('rule_1', 'Gaja Kesari Yoga', 'Yoga', '{"operator": "AND", "operands": [{"operator": "IN_HOUSE", "params": {"house": [1, 4, 7, 10], "planet": "Jupiter"}}, {"operator": "ASPECT", "params": {"planets": ["Moon", "Jupiter"]}}]}'),
('rule_2', 'Manglik Dosha', 'Dosha', '{"operator": "OR", "operands": [{"operator": "IN_HOUSE", "params": {"house": [1, 2, 4, 7, 8, 12], "planet": "Mars"}}]}'),
('rule_3', 'Rahu-Ketu Axis', 'Axis', '{"operator": "OR", "operands": [{"operator": "CONJUNCT", "params": {"planets": ["Rahu", "Ketu"]}}, {"operator": "OPPOSITION", "params": {"planets": ["Rahu", "Ketu"]}}]}'),
('rule_4', 'Mutual Aspect between Venus and Mars', 'Relationship Harmony', '{"operator": "OR", "operands": [{"operator": "CONJUNCT", "params": {"planets": ["Venus", "Mars"]}}, {"operator": "TRINE", "params": {"planets": ["Venus", "Mars"]}}, {"operator": "SEXTILE", "params": {"planets": ["Venus", "Mars"]}}, {"operator": "OPPOSITION", "params": {"planets": ["Venus", "Mars"]}}, {"operator": "SQUARE", "params": {"planets": ["Venus", "Mars"]}}]}');

-- Pre-fill some prompts
INSERT OR IGNORE INTO dynamic_prompts (id, category, system_prompt) VALUES 
('prompt_career', 'Career', 'You are an elite Vedic Astrologer specializing in Career and Dharma. Analyze the provided planetary positions and active Yogas to give professional guidance. Use a professional and encouraging tone.'),
('prompt_marriage', 'Marriage', 'You are an elite Vedic Astrologer specializing in Relationships and Marriage. Focus on the 7th house and Venus. Provide insights into compatibility and longevity.');
