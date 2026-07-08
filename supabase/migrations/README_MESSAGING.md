# Migrations messagerie — ordre de déploiement

Appliquer sur le projet Supabase **dans cet ordre** (`supabase db push` ou SQL Editor) :

| # | Fichier | Rôle |
|---|---------|------|
| 1 | `20260707140000_messaging.sql` | Tables `conversations` + `messages`, RLS initial |
| 2 | `20260707200000_messaging_fk_relax.sql` | Assouplissement FK |
| 3 | `20260707210000_messaging_participant_profiles.sql` | Profils participants |
| 4 | `20260707220000_messaging_related_contexts.sql` | Contextes liés (annonces) |
| 5 | **`20260707240000_fix_conversations_rls_contains.sql`** | **Critique** — RLS `@>` |
| 6 | **`20260707250000_enable_messaging_realtime.sql`** | Realtime live |
| 7 | **`20260707260000_fix_conversations_json_query.sql`** | RPC `list_my_conversations` |
| 8 | `20260708030000_messaging_unread_preview_context.sql` | Contexte réponse + aperçu liste |

Après déploiement, vérifier dans le dashboard Supabase :

- **Database → Publications** : `conversations` et `messages` dans `supabase_realtime`
- **SQL** : `select public.list_my_conversations(5);` (connecté en tant qu'utilisateur test)
