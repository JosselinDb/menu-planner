-- Menu Planner — run this in the Supabase SQL Editor (Dashboard → SQL → New query)

-- Ingredients catalog
create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'other',
  created_at timestamptz not null default now()
);

create unique index if not exists ingredients_name_lower_idx on ingredients (lower(name));

-- Recipes
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_link text,
  prep_duration_minutes integer not null default 0 check (prep_duration_minutes >= 0),
  cook_duration_minutes integer not null default 0 check (cook_duration_minutes >= 0),
  servings integer not null default 4 check (servings > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recipe ↔ ingredient with quantity
create table if not exists recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  quantity_value numeric not null default 1,
  quantity_unit text not null default '',
  sort_order integer not null default 0
);

create index if not exists recipe_ingredients_recipe_id_idx on recipe_ingredients (recipe_id);

-- Step-by-step instructions
create table if not exists recipe_instructions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  step_number integer not null check (step_number > 0),
  instruction_text text not null
);

create index if not exists recipe_instructions_recipe_id_idx on recipe_instructions (recipe_id);

-- Shopping list
create table if not exists shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  quantity_value numeric not null default 1,
  quantity_unit text not null default '',
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Weekly menu slots
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  sort_order integer not null default 0,
  menu_date date,
  created_at timestamptz not null default now()
);

create index if not exists menu_items_sort_order_idx on menu_items (sort_order);

-- Auto-update recipes.updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists recipes_updated_at on recipes;
create trigger recipes_updated_at
  before update on recipes
  for each row execute function update_updated_at();

-- Row Level Security (open policies for personal use — add Supabase Auth later for multi-user)
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table recipe_instructions enable row level security;
alter table shopping_list_items enable row level security;
alter table menu_items enable row level security;

create policy "Public access ingredients" on ingredients for all using (true) with check (true);
create policy "Public access recipes" on recipes for all using (true) with check (true);
create policy "Public access recipe_ingredients" on recipe_ingredients for all using (true) with check (true);
create policy "Public access recipe_instructions" on recipe_instructions for all using (true) with check (true);
create policy "Public access shopping_list_items" on shopping_list_items for all using (true) with check (true);
create policy "Public access menu_items" on menu_items for all using (true) with check (true);
