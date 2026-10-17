import { describe, expect, it, vi } from 'vitest'
import { createAuthService } from './createAuthService.js'

describe('createAuthService - Admin OTP SMS exemption', () => {
  it('exempts admin phone from rate caps during phone password reset', async () => {
    const mockRpc = vi.fn().mockImplementation(async (name, params) => {
      if (name === 'moxt_is_admin_phone') {
        return { data: params.p_phone.includes('79998887766'), error: null }
      }
      return { data: null, error: null }
    })

    const mockSignInWithOtp = vi.fn().mockResolvedValue({ data: {}, error: null })

    const mockSupabase = {
      rpc: mockRpc,
      auth: {
        signInWithOtp: mockSignInWithOtp,
      },
    }

    const auth = createAuthService(mockSupabase)

    // Admin phone can request password reset multiple times without cap error
    for (let i = 0; i < 6; i++) {
      const res = await auth.requestPhonePasswordReset('+79998887766')
      expect(res.phone).toBe('+79998887766')
    }

    expect(mockSignInWithOtp).toHaveBeenCalledTimes(6)
  })

  it('allows international phone format for admin users', async () => {
    const mockRpc = vi.fn().mockImplementation(async (name, params) => {
      if (name === 'moxt_is_admin_phone') {
        return { data: params.p_phone.includes('33612345678'), error: null }
      }
      return { data: null, error: null }
    })

    const mockSignInWithOtp = vi.fn().mockResolvedValue({ data: {}, error: null })

    const mockSupabase = {
      rpc: mockRpc,
      auth: {
        signInWithOtp: mockSignInWithOtp,
      },
    }

    const auth = createAuthService(mockSupabase)

    const res = await auth.requestPhonePasswordReset('+33612345678')
    expect(res.phone).toBe('+33612345678')
    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+33612345678' })
    )
  })
})
