-- Assouplir les FK messagerie si la table existait déjà avec un schéma partiel.

alter table public.conversations
  drop constraint if exists conversations_created_by_fkey;

-- created_by reste optionnel ; évite les erreurs FK si la valeur locale est absente.

notify pgrst, 'reload schema';
