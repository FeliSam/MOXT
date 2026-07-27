-- Surveillance hebdomadaire de l'hygiène du stockage documents.
--
-- Postgres ne peut pas supprimer dans storage.objects (garde-fou
-- storage.protect_delete) : la purge doit passer par l'API Storage, donc par
-- l'écran admin. Ce cron ne supprime donc rien — il DÉTECTE et ALERTE, pour
-- que le ménage ne dépende plus d'une vérification manuelle.
-- (Version corrigée dans la migration suivante : voir note auth.uid().)

select cron.schedule(
  'moxt-document-hygiene',
  '0 5 * * 1',
  $$select public.moxt_report_document_hygiene();$$
);
