CREATE TABLE IF NOT EXISTS analyses (
    id SERIAL PRIMARY KEY,
    input_text TEXT NOT NULL,
    premises JSONB NOT NULL,
    conclusion JSONB NOT NULL,
    validity BOOLEAN,
    result_type TEXT,
    fact_check_results JSONB,
    overall_assessment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
