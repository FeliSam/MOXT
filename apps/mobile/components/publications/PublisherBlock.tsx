import { PublisherDetailCard } from './PublisherDetailCard';
import { PublisherPublicationsStrip } from './PublisherPublicationsStrip';
import type { PublisherProfile } from './usePublisherDetailProfile';

/** Carte éditeur + bandeau « Autres publications », comme sur les fiches web. */
export function PublisherBlock({
  profile,
  currentId,
  limit = 8,
}: {
  profile: PublisherProfile | null;
  currentId: string;
  limit?: number;
}) {
  if (!profile?.ownerId) return null;
  return (
    <>
      <PublisherDetailCard profile={profile} />
      <PublisherPublicationsStrip
        currentId={currentId}
        ownerId={profile.ownerId}
        publications={profile.publications}
        allPath={profile.publicationsPath}
        limit={limit}
      />
    </>
  );
}
