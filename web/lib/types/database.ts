// Toasting — Database types.
// Mirrors the schema in /supabase/migrations/0001_initial_schema.sql.
// Will be replaced by Supabase-generated types once we run `supabase gen types`.

export type MemberStatus = "active" | "paused" | "revoked";
export type AdminRole = "owner" | "manager";
export type RedemptionStatus = "pending" | "used" | "expired" | "cancelled";

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  branding: Record<string, unknown>;
  created_at: string;
};

export type Venue = {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo_url: string | null;
  active: boolean;
  created_at: string;
};

export type Tier = {
  id: string;
  tenant_id: string;
  slug: string;
  name: string;
  discount_percent: number;
  max_uses_per_day: number;
  validity_days: number | null;
  color: string | null;
  created_at: string;
};

export type Member = {
  id: string;
  tenant_id: string;
  tier_id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  phone: string | null;
  photo_url: string | null;
  status: MemberStatus;
  joined_at: string;
  valid_until: string | null;
  invited_by_admin_id: string | null;
};

export type Admin = {
  id: string;
  tenant_id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  role: AdminRole;
  created_at: string;
};

export type Staff = {
  id: string;
  venue_id: string;
  name: string;
  pin_hash: string;
  active: boolean;
  created_at: string;
};

export type Invite = {
  id: string;
  tenant_id: string;
  tier_id: string;
  code: string;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  created_by_admin_id: string | null;
  created_at: string;
};

export type Redemption = {
  id: string;
  tenant_id: string;
  member_id: string;
  code: string;
  status: RedemptionStatus;
  generated_at: string;
  expires_at: string;
  redeemed_at: string | null;
  venue_id: string | null;
  staff_id: string | null;
  applied_percent: number | null;
};

export type InvitePreview = {
  tenant_name: string;
  tier_name: string;
  discount_percent: number;
};

export type Database = {
  public: {
    Tables: {
      tenants: { Row: Tenant; Insert: Partial<Tenant>; Update: Partial<Tenant> };
      venues: { Row: Venue; Insert: Partial<Venue>; Update: Partial<Venue> };
      tiers: { Row: Tier; Insert: Partial<Tier>; Update: Partial<Tier> };
      members: { Row: Member; Insert: Partial<Member>; Update: Partial<Member> };
      admins: { Row: Admin; Insert: Partial<Admin>; Update: Partial<Admin> };
      staff: { Row: Staff; Insert: Partial<Staff>; Update: Partial<Staff> };
      invites: { Row: Invite; Insert: Partial<Invite>; Update: Partial<Invite> };
      redemptions: {
        Row: Redemption;
        Insert: Partial<Redemption>;
        Update: Partial<Redemption>;
      };
    };
    Functions: {
      preview_invite: {
        Args: { p_code: string };
        Returns: InvitePreview[];
      };
      consume_invite: {
        Args: {
          p_code: string;
          p_name: string;
          p_phone?: string | null;
          p_photo_url?: string | null;
        };
        Returns: Member;
      };
      generate_redemption_code: {
        Args: Record<string, never>;
        Returns: Redemption;
      };
    };
  };
};
