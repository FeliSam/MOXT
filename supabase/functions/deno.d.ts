/** Shim IDE — le runtime réel est Deno (Supabase Edge Functions). */
declare const Deno: {
  serve(handler: (request: Request) => Response | Promise<Response>): void
  env: {
    get(key: string): string | undefined
  }
}

declare module 'npm:@supabase/supabase-js@2' {
  export interface SupabaseClient {
    auth: {
      admin: {
        createUser: (
          payload: unknown,
        ) => Promise<{
          data: { user: { id: string; phone?: string; email?: string } | null }
          error: { message: string } | null
        }>
        getUserById: (
          id: string,
        ) => Promise<{
          data: { user: { id: string; phone?: string; email?: string } | null }
          error: { message: string } | null
        }>
        updateUserById: (
          id: string,
          payload: unknown,
        ) => Promise<{ error: { message: string } | null }>
      }
      signInWithPassword: (payload: {
        email?: string
        phone?: string
        password: string
      }) => Promise<{
        data: {
          session: {
            access_token: string
            refresh_token: string
            expires_in: number
            token_type: string
          } | null
          user: { id: string; email?: string } | null
        }
        error: { message: string } | null
      }>
    }
    from: (table: string) => {
      upsert: (
        data: unknown,
        options?: unknown,
      ) => Promise<{ error: { message: string } | null }>
      select: (columns: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          maybeSingle: () => Promise<{ data: { email?: string } | null }>
        }
        in: (
          col: string,
          vals: string[],
        ) => {
          limit: (
            n: number,
          ) => Promise<{ data: unknown[] | null; error: { message: string } | null }>
        }
        ilike: (
          col: string,
          pattern: string,
        ) => {
          limit: (n: number) => Promise<{ data: unknown[] | null }>
        }
      }
    }
  }

  export function createClient(
    url: string,
    key: string,
    options?: { auth?: { autoRefreshToken?: boolean; persistSession?: boolean } },
  ): SupabaseClient
}
