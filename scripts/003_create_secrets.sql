-- Create project_secrets table for encrypted credentials
CREATE TABLE IF NOT EXISTS project_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv TEXT NOT NULL,
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, name)
);

-- Enable RLS
ALTER TABLE project_secrets ENABLE ROW LEVEL SECURITY;

-- RLS policies for secrets (check ownership via projects table)
CREATE POLICY "secrets_select_own" ON project_secrets FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_secrets.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "secrets_insert_own" ON project_secrets FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_secrets.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "secrets_update_own" ON project_secrets FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_secrets.project_id 
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "secrets_delete_own" ON project_secrets FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_secrets.project_id 
    AND projects.user_id = auth.uid()
  ));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_secrets_project_id ON project_secrets(project_id);
