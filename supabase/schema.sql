-- Run this once in the Supabase SQL editor for the new portal project.

create extension if not exists "pgcrypto";

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Property is referenced by the id used in the marketing site's properties.json.
  -- No properties table yet; this is intentionally denormalized for now.
  property_id text not null,
  property_label text not null,

  applicant_name text not null,
  applicant_email text not null,
  applicant_phone text,
  desired_move_in date,
  notes text,

  -- submitted -> screening_sent -> screening_complete -> approved | denied | withdrawn
  status text not null default 'submitted',
  screening_link text,

  constraint applications_status_check check (
    status in ('submitted', 'screening_sent', 'screening_complete', 'approved', 'denied', 'withdrawn')
  )
);

create index applications_property_id_idx on public.applications (property_id);
create index applications_status_idx on public.applications (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger applications_set_updated_at
before update on public.applications
for each row execute function public.set_updated_at();

-- Row level security: the public anon key (used by the Apply page) can only
-- insert new rows. There is no select/update/delete policy for anon or
-- authenticated roles, so reading and managing applications happens through
-- the Supabase dashboard (logged in as the project owner) for now, or later
-- through a service-role-backed admin view.
alter table public.applications enable row level security;

create policy "anyone can submit an application"
on public.applications
for insert
to anon, authenticated
with check (true);
