-- Bug trouvé : moxt.send_push_url / moxt.push_dispatch_secret n'avaient jamais
-- été configurés (et le rôle utilisé pour les migrations n'a pas le droit
-- d'exécuter ALTER DATABASE ... SET sur ce projet managé). Le trigger
-- notifications_dispatch_push (20260713100000_device_subscriptions_push.sql)
-- ne faisait donc RIEN depuis sa création pour toute notification créée
-- uniquement côté serveur (ex. "nouveau compte" qui notifie les admins) —
-- seules les notifications explicitement relayées par le client
-- (dispatchPushNotification, ex. messages) recevaient un vrai push.
--
-- Correctif : l'URL de la fonction send-push est codée en dur dans le trigger
-- (elle n'est pas sensible — c'est une URL d'edge function publique protégée
-- par sa propre vérification de fraîcheur/secret), ce qui évite toute
-- dépendance à un réglage externe absent.

create or replace function public.moxt_dispatch_push_for_notification()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  dispatch_url text := coalesce(
    nullif(current_setting('moxt.send_push_url', true), ''),
    'https://rbvqfkccbkwjxkvpnwqn.supabase.co/functions/v1/send-push'
  );
  dispatch_secret text := coalesce(nullif(current_setting('moxt.push_dispatch_secret', true), ''), '');
begin
  perform net.http_post(
    url := dispatch_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-moxt-push-secret', dispatch_secret
    ),
    body := jsonb_build_object('notificationId', new.id)
  );

  return new;
exception
  when others then
    return new;
end;
$$;

notify pgrst, 'reload schema';
