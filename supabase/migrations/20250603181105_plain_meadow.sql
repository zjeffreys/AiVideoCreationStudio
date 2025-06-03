/*
  # Add character description field
  
  1. Changes
    - Add description column to characters table
*/

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS description text;