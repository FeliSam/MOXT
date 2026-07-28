-- Vague 2 : restreindre les MIME autorisés sur les buckets d'upload utilisateur.
-- (Les clients envoient déjà contentType ; ce garde-fou côté Storage bloque les spoofs.)

do $$
declare
  image_mimes text[] := array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif'
  ];
  proof_mimes text[] := array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif',
    'application/pdf'
  ];
  bucket_name text;
begin
  foreach bucket_name in array array['avatars', 'listings', 'statuses', 'posts', 'businesses']
  loop
    update storage.buckets
    set allowed_mime_types = image_mimes
    where id = bucket_name;
  end loop;

  foreach bucket_name in array array['transfers', 'documents', 'personal-documents', 'business-documents']
  loop
    update storage.buckets
    set allowed_mime_types = proof_mimes
    where id = bucket_name;
  end loop;
end $$;
