-- COWARTU update 3: Voice Actors directory. Run once in Supabase > SQL Editor.
-- Uses the same admins (is_admin) as the main admin panel.

create table if not exists voice_actors(
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz default now(), updated_at timestamptz default now(),
 slug text unique not null,
 name text not null, headline text, bio text, city text,
 gender text, age_range text,
 languages text[] default '{}', voice_types text[] default '{}', genres text[] default '{}',
 photo_url text, samples jsonb default '[]'::jsonb, portfolio_url text,
 tier text default 'normal' check (tier in ('normal','green','gold')),
 is_certified boolean default false, is_featured boolean default false, sort_order int default 0,
 status text default 'pending' check (status in ('pending','approved','hidden','rejected')),
 source text default 'self' check (source in ('cowartu','self')),
 contact_phone text, contact_email text, payment_id text,
 payment_status text default 'na' check (payment_status in ('na','awaiting','verified','refunded')),
 admin_note text);

create or replace function va_touch() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists t_va_touch on voice_actors;
create trigger t_va_touch before update on voice_actors for each row execute function va_touch();

-- only admins can read/write the full table (private phone, email, payment are here)
alter table voice_actors enable row level security;
drop policy if exists va_admin_all on voice_actors;
create policy va_admin_all on voice_actors for all to authenticated using (is_admin()) with check (is_admin());

-- public list: approved profiles only, no private fields
create or replace view voice_actors_public as
 select id, slug, name, headline, bio, city, gender, age_range, languages, voice_types, genres,
        photo_url, samples, portfolio_url, tier, is_certified, is_featured, sort_order
 from voice_actors where status = 'approved';
grant select on voice_actors_public to anon, authenticated;

-- self-listing form: the only way visitors can add a row (always pending, normal, unpaid)
create or replace function submit_voice_actor(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
 base text := 'https://bpdewnmfalfodcemzoff.supabase.co/storage/v1/object/public/voice-actors/pending/';
 ref text := 'CWV-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
 ph text := regexp_replace(coalesce(p->>'contact_phone',''), '[^0-9+]', '', 'g');
 s jsonb; clean jsonb := '[]'::jsonb;
begin
 if length(trim(coalesce(p->>'name',''))) < 2 or length(p->>'name') > 60 then raise exception 'Invalid name'; end if;
 if ph !~ '^(\+?91)?[6-9][0-9]{9}$' then raise exception 'Invalid phone'; end if;
 if coalesce(p->>'contact_email','') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then raise exception 'Invalid email'; end if;
 if coalesce(p->>'photo_url','') not like base || '%' then raise exception 'Invalid photo'; end if;
 if jsonb_typeof(p->'samples') <> 'array' or jsonb_array_length(p->'samples') not between 1 and 3 then raise exception 'Invalid samples'; end if;
 for s in select * from jsonb_array_elements(p->'samples') loop
   if coalesce(s->>'url','') not like base || '%' then raise exception 'Invalid sample'; end if;
   clean := clean || jsonb_build_array(jsonb_build_object('title', left(coalesce(s->>'title','Sample'),50), 'url', s->>'url'));
 end loop;
 if (select count(*) from voice_actors where contact_phone = right(ph,10) and created_at > now() - interval '1 day') >= 3 then
   raise exception 'Too many applications today';
 end if;
 insert into voice_actors(slug,name,headline,bio,city,gender,age_range,languages,voice_types,genres,photo_url,samples,portfolio_url,
   contact_phone,contact_email,payment_id,source,status,tier,is_certified,is_featured,payment_status)
 values(
   left(regexp_replace(lower(p->>'name'),'[^a-z0-9]+','-','g'),40) || '-' || lower(substr(ref,5,4)),
   left(trim(p->>'name'),60), left(p->>'headline',80), left(p->>'bio',800), left(p->>'city',40),
   left(p->>'gender',20), left(p->>'age_range',20),
   (select coalesce(array_agg(left(x,40)),'{}') from (select jsonb_array_elements_text(p->'languages') x limit 20) a),
   (select coalesce(array_agg(left(x,40)),'{}') from (select jsonb_array_elements_text(p->'voice_types') x limit 12) a),
   (select coalesce(array_agg(left(x,40)),'{}') from (select jsonb_array_elements_text(p->'genres') x limit 12) a),
   p->>'photo_url', clean, case when p->>'portfolio_url' ~* '^https?://' then left(p->>'portfolio_url',300) end,
   right(ph,10), left(lower(p->>'contact_email'),160), ref, 'self','pending','normal',false,false,'awaiting');
 return ref;
end $$;
revoke all on function submit_voice_actor(jsonb) from public;
grant execute on function submit_voice_actor(jsonb) to anon, authenticated;

-- storage bucket for photos and voice samples (public read, size and type limits)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('voice-actors','voice-actors', true, 8388608,
        array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/wave','audio/mp4','audio/x-m4a','audio/aac','audio/ogg','audio/webm'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists va_public_upload on storage.objects;
create policy va_public_upload on storage.objects for insert to anon, authenticated
 with check (bucket_id = 'voice-actors' and (storage.foldername(name))[1] = 'pending');
drop policy if exists va_admin_files on storage.objects;
create policy va_admin_files on storage.objects for all to authenticated
 using (bucket_id = 'voice-actors' and is_admin()) with check (bucket_id = 'voice-actors' and is_admin());
