INSERT INTO roles(name) VALUES ('shop') ON CONFLICT (name) DO NOTHING;
