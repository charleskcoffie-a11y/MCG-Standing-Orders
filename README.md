
# Methodist Law & Hymnal - Database Setup Guide

### ⚠️ IMPORTANT: RUN THIS IN SUPABASE SQL EDITOR
Copy and paste this entire block into a new query in your Supabase Dashboard. 
This will reset the tables to the correct structure and fix the "Foreign Key" and "RLS" errors.

```sql
-- 1. CLEANUP (Optional but recommended to ensure a fresh start)
DROP TABLE IF EXISTS public.favorites;
-- Note: Don't drop sections/hymns if you have already uploaded data you want to keep.
-- If you want to reset everything, uncomment the next two lines:
-- DROP TABLE IF EXISTS public.sections;
-- DROP TABLE IF EXISTS public.hymns;

-- 2. CREATE TABLES
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hymns (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    collection TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    number INTEGER NOT NULL,
    title TEXT NOT NULL,
    lyrics TEXT NOT NULL,
    author TEXT,
    tags TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RECREATING FAVORITES WITHOUT THE AUTH.USERS CONSTRAINT
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, 
    item_type TEXT NOT NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
    hymn_id BIGINT REFERENCES public.hymns(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, section_id),
    UNIQUE(user_id, hymn_id)
);

-- 3. ENABLE SECURITY
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hymns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 4. CLEAN OLD POLICIES
DROP POLICY IF EXISTS "sections_full_access" ON public.sections;
DROP POLICY IF EXISTS "hymns_full_access" ON public.hymns;
DROP POLICY IF EXISTS "favorites_full_access" ON public.favorites;

-- 5. CREATE PERMISSIVE POLICIES
CREATE POLICY "sections_full_access" ON public.sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "hymns_full_access" ON public.hymns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "favorites_full_access" ON public.favorites FOR ALL USING (true) WITH CHECK (true);
```
