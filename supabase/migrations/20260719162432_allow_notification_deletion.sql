-- Permettre à chaque utilisateur de supprimer uniquement ses propres notifications.

grant delete on table public.notifications to authenticated;

create policy notifications_delete_own
on public.notifications for delete to authenticated
using ((select auth.uid()) = user_id);
