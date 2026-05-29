-- Add phone and bio columns to profiles table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
