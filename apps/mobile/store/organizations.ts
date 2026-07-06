import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { supabase } from '../services/supabase';

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export type OrgMember = {
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  joinedAt: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  memberCount: number;
  myRole: OrgRole;
  createdAt: string;
};

type OrganizationsState = {
  orgs: Organization[];
  currentOrg: Organization | null;
  members: OrgMember[];
  loading: boolean;
};

const initialState: OrganizationsState = {
  orgs: [],
  currentOrg: null,
  members: [],
  loading: false,
};

export const loadOrganizations = createAsyncThunk(
  'organizations/load',
  async (userId: string) => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('org_members')
      .select('org_id, role, organizations(id, name, slug, logo_url, description, member_count, created_at)')
      .eq('user_id', userId);
    return (data || []).map((row: any): Organization => ({
      id: row.organizations.id,
      name: row.organizations.name,
      slug: row.organizations.slug,
      logoUrl: row.organizations.logo_url,
      description: row.organizations.description,
      memberCount: row.organizations.member_count || 1,
      myRole: row.role,
      createdAt: row.organizations.created_at,
    }));
  },
);

export const loadOrgMembers = createAsyncThunk(
  'organizations/loadMembers',
  async (orgId: string) => {
    if (!supabase) return [];
    const { data } = await supabase
      .from('org_members')
      .select('user_id, role, joined_at, profiles(first_name, last_name, email)')
      .eq('org_id', orgId)
      .order('joined_at', { ascending: true });
    return (data || []).map((row: any): OrgMember => ({
      userId: row.user_id,
      name: `${row.profiles?.first_name || ''} ${row.profiles?.last_name || ''}`.trim() || 'Membre',
      email: row.profiles?.email || '',
      role: row.role,
      joinedAt: row.joined_at,
    }));
  },
);

export const createOrganization = createAsyncThunk(
  'organizations/create',
  async ({ userId, name, description }: { userId: string; name: string; description?: string }) => {
    if (!supabase) throw new Error('Service non disponible');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const id = `ORG-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await supabase.from('organizations').insert({
      id,
      name,
      slug,
      description: description || null,
      member_count: 1,
      created_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    await supabase.from('org_members').insert({
      org_id: id,
      user_id: userId,
      role: 'owner',
      joined_at: new Date().toISOString(),
    });
    return {
      id,
      name,
      slug,
      description,
      memberCount: 1,
      myRole: 'owner' as OrgRole,
      createdAt: new Date().toISOString(),
    };
  },
);

export const inviteMember = createAsyncThunk(
  'organizations/invite',
  async ({ orgId, email, role }: { orgId: string; email: string; role: OrgRole }) => {
    if (!supabase) throw new Error('Service non disponible');
    const { data: userRow } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('email', email)
      .single();
    if (!userRow) throw new Error('Utilisateur non trouvé');
    const { error } = await supabase.from('org_members').insert({
      org_id: orgId,
      user_id: userRow.id,
      role,
      joined_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return {
      userId: userRow.id,
      name: `${userRow.first_name || ''} ${userRow.last_name || ''}`.trim(),
      email: userRow.email,
      role,
      joinedAt: new Date().toISOString(),
    } as OrgMember;
  },
);

export const removeMember = createAsyncThunk(
  'organizations/removeMember',
  async ({ orgId, userId }: { orgId: string; userId: string }) => {
    if (!supabase) throw new Error('Service non disponible');
    const { error } = await supabase
      .from('org_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return userId;
  },
);

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    setCurrentOrg(state, action: PayloadAction<Organization | null>) {
      state.currentOrg = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadOrganizations.pending, (state) => { state.loading = true; })
      .addCase(loadOrganizations.fulfilled, (state, action) => {
        state.orgs = action.payload;
        state.loading = false;
      })
      .addCase(loadOrganizations.rejected, (state) => { state.loading = false; })
      .addCase(loadOrgMembers.fulfilled, (state, action) => {
        state.members = action.payload;
      })
      .addCase(createOrganization.fulfilled, (state, action) => {
        state.orgs.push(action.payload);
      })
      .addCase(inviteMember.fulfilled, (state, action) => {
        state.members.push(action.payload);
      })
      .addCase(removeMember.fulfilled, (state, action) => {
        state.members = state.members.filter((m) => m.userId !== action.payload);
      });
  },
});

export const { setCurrentOrg } = organizationsSlice.actions;
export const organizationsReducer = organizationsSlice.reducer;
