/**
 * Faux client Supabase pour les tests : enregistre les appels de la chaîne de requête
 * et renvoie les lignes configurées par table.
 */
export function createFakeClient(tables = {}, { rpc = {}, errors = {} } = {}) {
  const calls = []
  const channels = []
  function builder(table) {
    const call = { table, ops: [] }
    calls.push(call)
    const chain = {}
    for (const op of ['select', 'eq', 'or', 'in', 'gt', 'order', 'limit', 'contains', 'filter', 'update', 'upsert', 'delete']) {
      chain[op] = (...args) => {
        call.ops.push([op, ...args])
        return chain
      }
    }
    chain.maybeSingle = () => {
      call.ops.push(['maybeSingle'])
      return Promise.resolve({ data: (tables[table] || [])[0] || null, error: null })
    }
    chain.then = (resolve, reject) =>
      Promise.resolve(
        errors[table] ? { data: null, error: { message: errors[table] } } : { data: tables[table] || [], error: null },
      ).then(resolve, reject)
    return chain
  }
  return {
    calls,
    channels,
    from: builder,
    rpc: (name, args) => {
      calls.push({ rpc: name, args })
      return Promise.resolve(rpc[name] || { data: null, error: { message: 'rpc absente' } })
    },
    channel: (name) => {
      const handlers = []
      const channel = {
        name,
        handlers,
        on: (type, filter, handler) => {
          handlers.push({ type, filter, handler })
          return channel
        },
        subscribe: () => channel,
      }
      channels.push(channel)
      return channel
    },
    removeChannel: (channel) => {
      channel.removed = true
    },
  }
}
