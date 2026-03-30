-- Create chat-attachments bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

-- Set up RLS policies for chat-attachments
create policy "Chat attachments are publicly accessible"
on storage.objects for select
using (bucket_id = 'chat-attachments');

create policy "Anyone can upload chat attachments"
on storage.objects for insert
with check (bucket_id = 'chat-attachments');
