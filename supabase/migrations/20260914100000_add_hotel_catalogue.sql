begin;
create table if not exists public.crm_hotel_profiles (
 vendor_id uuid primary key references public.crm_vendors(id) on delete restrict,
 profile jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now()
);
alter table public.crm_hotel_profiles enable row level security;
revoke all on public.crm_hotel_profiles from public, anon, authenticated;
grant select,insert,update on public.crm_hotel_profiles to service_role;
create or replace function public.save_crm_hotel(p_id uuid,p_profile jsonb,p_active boolean)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 if length(trim(coalesce(p_profile->>'name','')))<2 or length(trim(coalesce(p_profile->>'destination','')))=0 then raise exception 'Hotel name and destination required'; end if;
 if p_id is null then
  insert into public.crm_vendors(name,vendor_type,destination,active) values(p_profile->>'name','HOTEL',p_profile->>'destination',p_active) returning id into v_id;
 else
  update public.crm_vendors set name=p_profile->>'name',destination=p_profile->>'destination',active=p_active,updated_at=now() where id=p_id and vendor_type='HOTEL' returning id into v_id;
  if v_id is null then raise exception 'Hotel vendor not found'; end if;
 end if;
 insert into public.crm_hotel_profiles(vendor_id,profile) values(v_id,p_profile)
 on conflict(vendor_id) do update set profile=excluded.profile,updated_at=now();
 return v_id;
end $$;
revoke all on function public.save_crm_hotel(uuid,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.save_crm_hotel(uuid,jsonb,boolean) to service_role;
commit;
