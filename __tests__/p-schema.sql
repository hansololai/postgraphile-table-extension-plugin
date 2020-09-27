create extension
if not exists hstore;
create extension
if not exists citext;

drop schema if exists p
cascade;

create schema p;

create table p.users
(
  id serial primary key,
  "content" text
);

create table p.user_extra_infos
(
  id serial primary key,
  user_id  int references p.users (id),
  "email" text
);

alter table p.user_extra_infos add constraint unique_user_id_user_extra_info UNIQUE (user_id);

comment on column p.user_extra_infos.user_id is E'@extensionOf users';
