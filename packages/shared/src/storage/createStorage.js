/** Adaptateur de persistance — web (localStorage) ou mobile (AsyncStorage). */
export function createStorage({ read, write, remove }) {
  return {
    read: async () => read(),
    write: async (value) => write(value),
    remove: async () => (remove ? remove() : write(null)),
  }
}

export function createMemoryStorage(initial = null) {
  let value = initial
  return createStorage({
    read: () => value,
    write: (next) => {
      value = next
    },
    remove: () => {
      value = null
    },
  })
}
