ALTER TABLE products ADD COLUMN shade_hex TEXT;
ALTER TABLE products ADD COLUMN try_on_provider TEXT NOT NULL DEFAULT 'unavailable';
ALTER TABLE products ADD COLUMN try_on_effect_id TEXT;
ALTER TABLE products ADD COLUMN try_on_asset_version TEXT;
ALTER TABLE products ADD COLUMN try_on_default_intensity REAL;
ALTER TABLE products ADD COLUMN try_on_status TEXT NOT NULL DEFAULT 'unconfigured';
