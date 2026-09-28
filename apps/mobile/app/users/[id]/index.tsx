import { Redirect, useLocalSearchParams } from 'expo-router';

/** `/users/:id` ouvre le profil public, comme le web. */
export default function PublicProfileRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/users/${id}/publications` as never} />;
}
