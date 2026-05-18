-- Allow users to delete their own notifications
create policy "Users can delete own notifications"
  on public.notifications for delete
  using (recipient_id = (select auth.uid()));
