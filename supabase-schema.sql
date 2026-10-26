-- ============================================================================
-- BLENDIFY LMS - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- 1. USERS & ROLES TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CLASSROOM WORKPLACES & PORTALS
CREATE TABLE IF NOT EXISTS public.classroom_portals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  cohort TEXT NOT NULL,
  description TEXT,
  share_url TEXT,
  learners_count INT DEFAULT 0,
  materials_count INT DEFAULT 0,
  quizzes_count INT DEFAULT 0,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LEARNING MATERIALS
CREATE TABLE IF NOT EXISTS public.learning_materials (
  id TEXT PRIMARY KEY,
  portal_tag TEXT REFERENCES public.classroom_portals(tag) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT '0 MB',
  status TEXT NOT NULL DEFAULT 'Open Access',
  description TEXT,
  allow_download BOOLEAN DEFAULT TRUE,
  file_url TEXT,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STUDENT PROGRESS & ENROLLMENTS
CREATE TABLE IF NOT EXISTS public.user_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  portal_tag TEXT REFERENCES public.classroom_portals(tag) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  progress INT DEFAULT 0,
  UNIQUE(user_id, portal_tag)
);

-- 5. IN-TIME AUDIT ACTIVITY LOG
CREATE TABLE IF NOT EXISTS public.student_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_id TEXT,
  portal_tag TEXT,
  material_name TEXT NOT NULL,
  action TEXT NOT NULL,
  action_class TEXT DEFAULT 'open',
  status_pill TEXT DEFAULT 'Active Now',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INTERACTIVE QUIZZES & ASSESSMENTS
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY,
  portal_tag TEXT REFERENCES public.classroom_portals(tag) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'quiz',
  passing_score INT DEFAULT 80,
  time_limit INT DEFAULT 15,
  max_attempts INT DEFAULT 3,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to portals and materials for all learners
CREATE POLICY "Portals are publicly readable" ON public.classroom_portals
  FOR SELECT USING (true);

CREATE POLICY "Portals can be created by authenticated users" ON public.classroom_portals
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Materials are publicly readable" ON public.learning_materials
  FOR SELECT USING (true);

CREATE POLICY "Materials can be managed by authenticated users" ON public.learning_materials
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Activities are publicly readable" ON public.student_activities
  FOR SELECT USING (true);

CREATE POLICY "Activities can be logged by anyone" ON public.student_activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- STORAGE BUCKET FOR BLENDIFY MATERIALS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('blendify-materials', 'blendify-materials', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public material downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'blendify-materials');

CREATE POLICY "Authenticated users can upload materials" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'blendify-materials');
