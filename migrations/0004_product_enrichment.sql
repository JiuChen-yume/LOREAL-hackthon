ALTER TABLE products ADD COLUMN ingredient_records_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE products ADD COLUMN ingredient_enrichment_status TEXT NOT NULL DEFAULT 'not_queried';
ALTER TABLE products ADD COLUMN ingredient_enrichment_source TEXT;
ALTER TABLE products ADD COLUMN ingredient_enrichment_source_url TEXT;
ALTER TABLE products ADD COLUMN ingredient_enrichment_queried_at TEXT;
ALTER TABLE products ADD COLUMN ingredient_enrichment_error TEXT;
ALTER TABLE products ADD COLUMN ingredient_analysis_json TEXT NOT NULL DEFAULT '{}';
