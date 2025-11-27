CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text TEXT NOT NULL,
  premises JSONB NOT NULL,
  conclusion JSONB,
  validity BOOLEAN,
  result_type VARCHAR(50),
  fact_check_results JSONB,
  overall_assessment VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
