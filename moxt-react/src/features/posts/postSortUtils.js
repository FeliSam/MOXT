/** Date de publication affichée dans le fil (partage ou création). */
export function postPublishedAt(post) {
  return post?.lastSharedAt || post?.createdAt || post?.updatedAt || 0
}

/** Trie les posts du plus récent au plus ancien. */
export function sortPostsByPublishedAt(posts = []) {
  return [...posts].sort(
    (left, right) =>
      new Date(postPublishedAt(right)).getTime() - new Date(postPublishedAt(left)).getTime(),
  )
}
