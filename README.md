
# Methodist Standing Orders - Supabase Setup Guide

This document provides instructions for setting up the Supabase backend for the Methodist Standing Orders application.

## 1. Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Profiles table to store user metadata and approval status
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique not null,
  full_name text not null,
  phone text,
  church text,
  role text default 'user' check (role in ('user', 'admin')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'disabled')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  approved_at timestamp with time zone,
  approved_by uuid references auth.users
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view their own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update profiles"
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
```

## 2. Admin Initialization

To initialize the first admin account, you can manually set a user's role in the database:

```sql
update profiles 
set role = 'admin', status = 'approved' 
where username = 'admin' or email = 'your-admin-email@church.org';
```

## 3. Edge Function: on-profile-created

This function triggers a notification (Email/OneSignal) when a new user registers.

**File:** `supabase/functions/on-profile-created/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { record } = await req.json()

  // Logic to send notification to Admins
  // Use OneSignal REST API or Email Service (SendGrid/Resend)
  
  console.log(`New user pending approval: ${record.full_name} (@${record.username})`);

  return new Response(JSON.stringify({ message: "Admin notified" }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

## 4. Supabase Auth Configuration

1.  Go to **Authentication** > **Settings**.
2.  Enable **Email/Password** provider.
3.  Disable **Confirm Email** if you want immediate access to the "Pending Approval" screen (recommended for local church workflows).
4.  Add your app's URL to **Redirect URLs**.

## 5. Security Note (Passcode)

As requested, the application code contains a hardcoded Admin passcode: `1927`.
The login system allows using either the **Username** or **Email Address**.
For Admin users, the passcode `1927` is mandatory for access.
