-- Reference schema only. No connection is made by the demo.
create table agents (id text primary key, workspace_id uuid not null, name text not null, scope jsonb not null, approval_rate numeric check (approval_rate between 0 and 1));
create table policies (workspace_id uuid primary key, version integer not null default 1, policy jsonb not null, updated_at timestamptz not null default now());
create table proposed_actions (id text primary key, workspace_id uuid not null, agent_id text references agents(id), action jsonb not null, status text not null default 'pending' check (status in ('pending','approved','rejected')), created_at timestamptz not null default now());
create table audit_events (id text primary key, workspace_id uuid not null, action_id text, actor text not null, decision text not null, tier_at_decision text not null, score integer check(score between 0 and 100), diff jsonb, reason text, at timestamptz not null default now());
create index audit_events_workspace_time on audit_events(workspace_id, at desc);
alter table agents enable row level security;
alter table policies enable row level security;
alter table proposed_actions enable row level security;
alter table audit_events enable row level security;
-- Deny by default. Add authenticated workspace membership policies before use.
-- Grant audit INSERT/SELECT only; edits and undo append compensating events.
