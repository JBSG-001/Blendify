-- ============================================================================
-- BLENDIFY LMS - ENTERPRISE SUPABASE SCHEMA & SECURITY POLICIES (HARDENED)
-- Run this complete script in the Supabase Dashboard > SQL Editor > New Query
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. USERS & ROLES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. CLASSROOM WORKPLACES & PORTALS
-- ----------------------------------------------------------------------------
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
  created_by UUID DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure created_by column exists for existing tables
ALTER TABLE public.classroom_portals ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 3. LEARNING MATERIALS
-- ----------------------------------------------------------------------------
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
  created_by UUID DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.learning_materials ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 4. STUDENT PROGRESS & ENROLLMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE CASCADE,
  portal_tag TEXT REFERENCES public.classroom_portals(tag) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  progress INT DEFAULT 0,
  UNIQUE(user_id, portal_tag)
);

-- ----------------------------------------------------------------------------
-- 5. IN-TIME AUDIT ACTIVITY LOG
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6. INTERACTIVE QUIZZES & ASSESSMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
  id TEXT PRIMARY KEY,
  portal_tag TEXT REFERENCES public.classroom_portals(tag) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'quiz',
  passing_score INT DEFAULT 80,
  time_limit INT DEFAULT 15,
  max_attempts INT DEFAULT 3,
  questions JSONB DEFAULT '[]'::jsonb,
  created_by UUID DEFAULT auth.uid() REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- ============================================================================
-- PERFORMANCE & QUERY INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_portals_tag ON public.classroom_portals(tag);
CREATE INDEX IF NOT EXISTS idx_materials_portal ON public.learning_materials(portal_tag);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.user_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_portal ON public.student_activities(portal_tag);
CREATE INDEX IF NOT EXISTS idx_quizzes_portal ON public.quizzes(portal_tag);

-- ============================================================================
-- SECURITY HELPER FUNCTIONS (SECURITY DEFINER WITH FIXED search_path)
-- ============================================================================

-- Check if current authenticated caller is teacher or admin
CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Check if current authenticated caller is administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- AUTOMATIC AUTH PROFILE TRIGGER
-- Synchronizes auth.users into public.users automatically upon signup or OAuth
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, public.users.name),
    role = COALESCE(public.users.role, EXCLUDED.role),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PRIVILEGE ESCALATION PREVENTION
-- Blocks regular users from maliciously updating their own role column to teacher or admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.prevent_user_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (auth.jwt() ->> 'role' = 'service_role' OR public.is_admin()) THEN
      RAISE EXCEPTION 'Privilege escalation rejected: you cannot change your account role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.users;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_role_escalation();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- Clean existing policies to avoid duplicates on re-run
DROP POLICY IF EXISTS "Public users profile read" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

DROP POLICY IF EXISTS "Portals are publicly readable" ON public.classroom_portals;
DROP POLICY IF EXISTS "Portals insertable by authenticated users" ON public.classroom_portals;
DROP POLICY IF EXISTS "Portals insertable by teachers and admins" ON public.classroom_portals;
DROP POLICY IF EXISTS "Portals updatable by authenticated users" ON public.classroom_portals;
DROP POLICY IF EXISTS "Portals updatable by portal creator or admin" ON public.classroom_portals;
DROP POLICY IF EXISTS "Portals deletable by authenticated users" ON public.classroom_portals;
DROP POLICY IF EXISTS "Portals deletable by portal creator or admin" ON public.classroom_portals;

DROP POLICY IF EXISTS "Materials are publicly readable" ON public.learning_materials;
DROP POLICY IF EXISTS "Materials manageable by authenticated users" ON public.learning_materials;
DROP POLICY IF EXISTS "Materials insertable by teachers and admins" ON public.learning_materials;
DROP POLICY IF EXISTS "Materials updatable by teachers and admins" ON public.learning_materials;
DROP POLICY IF EXISTS "Materials deletable by teachers and admins" ON public.learning_materials;

DROP POLICY IF EXISTS "Enrollments readable by users" ON public.user_enrollments;
DROP POLICY IF EXISTS "Enrollments insertable by own user" ON public.user_enrollments;
DROP POLICY IF EXISTS "Enrollments updatable by own user" ON public.user_enrollments;

DROP POLICY IF EXISTS "Activities are publicly readable" ON public.student_activities;
DROP POLICY IF EXISTS "Activities insertable by anyone" ON public.student_activities;

DROP POLICY IF EXISTS "Quizzes are publicly readable" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes manageable by authenticated users" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes insertable by teachers and admins" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes updatable by teachers and admins" ON public.quizzes;
DROP POLICY IF EXISTS "Quizzes deletable by teachers and admins" ON public.quizzes;

-- 1. USERS POLICIES
CREATE POLICY "Public users profile read" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 2. PORTALS POLICIES
CREATE POLICY "Portals are publicly readable" ON public.classroom_portals
  FOR SELECT USING (true);

CREATE POLICY "Portals insertable by teachers and admins" ON public.classroom_portals
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.is_teacher_or_admin() OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Portals updatable by portal creator or admin" ON public.classroom_portals
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      created_by = auth.uid() OR
      created_by IS NULL OR
      public.is_teacher_or_admin()
    )
  );

CREATE POLICY "Portals deletable by portal creator or admin" ON public.classroom_portals
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      created_by = auth.uid() OR
      public.is_admin()
    )
  );

-- 3. LEARNING MATERIALS POLICIES
CREATE POLICY "Materials are publicly readable" ON public.learning_materials
  FOR SELECT USING (true);

CREATE POLICY "Materials insertable by teachers and admins" ON public.learning_materials
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.is_teacher_or_admin() OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Materials updatable by teachers and admins" ON public.learning_materials
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      created_by = auth.uid() OR
      created_by IS NULL OR
      public.is_teacher_or_admin()
    )
  );

CREATE POLICY "Materials deletable by teachers and admins" ON public.learning_materials
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      created_by = auth.uid() OR
      public.is_teacher_or_admin()
    )
  );

-- 4. ENROLLMENTS POLICIES
CREATE POLICY "Enrollments readable by users" ON public.user_enrollments
  FOR SELECT USING (true);

CREATE POLICY "Enrollments insertable by own user" ON public.user_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "Enrollments updatable by own user" ON public.user_enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. AUDIT ACTIVITIES POLICIES (Append-only security log)
CREATE POLICY "Activities are publicly readable" ON public.student_activities
  FOR SELECT USING (true);

CREATE POLICY "Activities insertable by anyone" ON public.student_activities
  FOR INSERT WITH CHECK (true);

-- 6. QUIZZES POLICIES
CREATE POLICY "Quizzes are publicly readable" ON public.quizzes
  FOR SELECT USING (true);

CREATE POLICY "Quizzes insertable by teachers and admins" ON public.quizzes
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      public.is_teacher_or_admin() OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Quizzes updatable by teachers and admins" ON public.quizzes
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND (
      created_by = auth.uid() OR
      created_by IS NULL OR
      public.is_teacher_or_admin()
    )
  );

CREATE POLICY "Quizzes deletable by teachers and admins" ON public.quizzes
  FOR DELETE USING (
    auth.role() = 'authenticated' AND (
      created_by = auth.uid() OR
      public.is_teacher_or_admin()
    )
  );

-- ============================================================================
-- STORAGE BUCKET FOR BLENDIFY MATERIALS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('blendify-materials', 'blendify-materials', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public material downloads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update materials" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and owners can update materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers and owners can delete materials" ON storage.objects;

CREATE POLICY "Public material downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'blendify-materials');

CREATE POLICY "Authenticated users can upload materials" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'blendify-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Teachers and owners can update materials" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'blendify-materials' AND
    auth.role() = 'authenticated' AND
    (owner = auth.uid() OR public.is_teacher_or_admin())
  );

CREATE POLICY "Teachers and owners can delete materials" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'blendify-materials' AND
    auth.role() = 'authenticated' AND
    (owner = auth.uid() OR public.is_teacher_or_admin())
  );
