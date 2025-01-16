/*
  # PDF Files Management Schema

  1. New Tables
    - `pdf_files`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `filename` (text)
      - `file_path` (text)
      - `file_size` (bigint)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `pdf_files` table
    - Add policies for authenticated users to:
      - Read their own files
      - Upload new files
      - Delete their own files
*/

CREATE TABLE IF NOT EXISTS pdf_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pdf_files ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own files
CREATE POLICY "Users can read own files"
  ON pdf_files
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to allow users to upload files
CREATE POLICY "Users can upload files"
  ON pdf_files
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own files
CREATE POLICY "Users can delete own files"
  ON pdf_files
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);