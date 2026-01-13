
# Methodist Law & Hymnal - Database Setup Guide

### ⚠️ IMPORTANT: RUN THIS IN SUPABASE SQL EDITOR
Copy and paste this entire block into a new query in your Supabase Dashboard. 
This will create the tables to match your existing database structure.

```sql
-- 1. CLEANUP (Optional - only if resetting favorites)
DROP TABLE IF EXISTS public.favorites;

-- 2. CREATE TABLES (if they don't exist)

-- Sections table (for Constitution/Standing Orders)
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Songs table (for Hymnal) - matches your existing structure
CREATE TABLE IF NOT EXISTS public.songs (
    id INTEGER PRIMARY KEY,
    collection TEXT NOT NULL,
    code TEXT,
    number INTEGER,
    title TEXT NOT NULL,
    raw_title TEXT,
    lyrics TEXT NOT NULL,
    author TEXT,
    copyright TEXT,
    tags TEXT,
    reference_number TEXT,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table (references both sections and songs)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, 
    item_type TEXT NOT NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
    hymn_id INTEGER REFERENCES public.songs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, section_id),
    UNIQUE(user_id, hymn_id),
    CHECK (
        (item_type = 'section' AND section_id IS NOT NULL AND hymn_id IS NULL) OR
        (item_type = 'hymn' AND hymn_id IS NOT NULL AND section_id IS NULL)
    )
);

-- 3. ENABLE SECURITY
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- 4. CLEAN OLD POLICIES
DROP POLICY IF EXISTS "sections_full_access" ON public.sections;
DROP POLICY IF EXISTS "songs_full_access" ON public.songs;
DROP POLICY IF EXISTS "favorites_full_access" ON public.favorites;

-- 5. CREATE PERMISSIVE POLICIES
CREATE POLICY "sections_full_access" ON public.sections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "songs_full_access" ON public.songs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "favorites_full_access" ON public.favorites FOR ALL USING (true) WITH CHECK (true);
```
