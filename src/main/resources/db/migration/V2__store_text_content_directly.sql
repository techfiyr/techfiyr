do $$
declare
    page_record record;
begin
    for page_record in
        select id, html_content::oid as large_object_id
        from cms_pages
        where html_content ~ '^[0-9]+$'
          and exists (
              select 1
              from pg_largeobject_metadata
              where oid = html_content::oid
          )
    loop
        update cms_pages
        set html_content = convert_from(lo_get(page_record.large_object_id), 'UTF8')
        where id = page_record.id;
        perform lo_unlink(page_record.large_object_id);
    end loop;
end $$;

do $$
declare
    message_record record;
begin
    for message_record in
        select id, message::oid as large_object_id
        from contact_submissions
        where message ~ '^[0-9]+$'
          and exists (
              select 1
              from pg_largeobject_metadata
              where oid = message::oid
          )
    loop
        update contact_submissions
        set message = convert_from(lo_get(message_record.large_object_id), 'UTF8')
        where id = message_record.id;
        perform lo_unlink(message_record.large_object_id);
    end loop;
end $$;
