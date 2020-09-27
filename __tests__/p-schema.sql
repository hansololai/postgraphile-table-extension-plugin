create extension
if not exists hstore;
create extension
if not exists citext;

drop schema if exists p
cascade;

create schema p;

create table p.forward_user_infos(
  id serial primary key,
  phone text
);

create table p.users
(
  id serial primary key,
  "content" text,
  forward_user_info_id int references p.forward_user_infos (id)
);

alter table p.users add constraint unique_forward_user_info_id UNIQUE (forward_user_info_id);

create table p.posts(
  id serial primary key,
  author_id int references p.users (id)
);

create table p.user_extra_infos
(
  id serial primary key,
  user_id  int references p.users (id),
  "email" text
);

alter table p.user_extra_infos add constraint unique_user_id_user_extra_info UNIQUE (user_id);

comment on column p.user_extra_infos.user_id is E'@forwardExtension';
comment on column p.users.forward_user_info_id is E'@backwardExtension';
