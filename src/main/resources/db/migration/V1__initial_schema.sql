create table app_users (
    id bigserial primary key,
    username varchar(80) not null unique,
    password_hash varchar(100) not null,
    display_name varchar(120) not null,
    role varchar(20) not null,
    enabled boolean not null default true,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    constraint app_users_role_check check (role in ('ADMIN', 'EMPLOYEE'))
);

create table cms_pages (
    id bigserial primary key,
    slug varchar(80) not null unique,
    display_name varchar(120) not null,
    route varchar(160) not null unique,
    source_file varchar(160) not null,
    html_content text not null,
    published boolean not null default true,
    updated_at timestamp with time zone not null,
    updated_by varchar(80),
    version bigint not null default 0
);

create table contact_submissions (
    id bigserial primary key,
    first_name varchar(100) not null,
    last_name varchar(100),
    email varchar(254) not null,
    subject varchar(180),
    website varchar(500),
    message text not null,
    source varchar(80) not null,
    status varchar(20) not null,
    created_at timestamp with time zone not null,
    constraint contact_status_check check (status in ('NEW', 'READ', 'ARCHIVED'))
);

create table media_assets (
    id bigserial primary key,
    original_name varchar(255) not null,
    stored_name varchar(255) not null unique,
    content_type varchar(100) not null,
    size_bytes bigint not null,
    public_path varchar(500) not null,
    uploaded_by varchar(80) not null,
    uploaded_at timestamp with time zone not null
);

create index idx_contact_submissions_created_at on contact_submissions(created_at desc);
create index idx_cms_pages_published on cms_pages(published);
