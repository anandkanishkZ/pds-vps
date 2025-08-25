// Simple API client for the backend
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export type LoginResponse = {
  token: string;
  user: { id: string; name: string; email: string; role: 'admin' | 'user' };
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  avatarFilename?: string | null;
  department?: string;
  location?: string;
  bio?: string;
  joinDate: string;
  lastLoginAt?: string;
  theme: 'light' | 'dark' | 'system';
  timezone?: string;
  language: string;
};

export type NotificationSettings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  systemUpdates: boolean;
  weeklyReports: boolean;
  instantAlerts: boolean;
};

export type SecuritySettings = {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
};

export type Activity = {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ip: string;
  device: string;
};

// User management types
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  createdAt: string;
  lastLogin?: string;
  avatar?: string | null;
  adminNotes?: string | null;
  blockedAt?: string | null;
  blockedUntil?: string | null;
  remainingBlockSeconds?: number | null;
};

export async function listUsers(token: string, params: { page?: number; pageSize?: number; search?: string; role?: string; status?: string } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k,v]) => { if (v !== undefined && v !== '') qs.append(k, String(v)); });
  const res = await fetch(`${API_BASE}/api/users?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch users');
  }
  const data = await res.json();
  data.data = data.data.map((u: any) => ({
    ...u,
    avatar: u.avatar && u.avatar.startsWith('/') ? API_BASE.replace(/\/$/, '') + u.avatar : u.avatar
  }));
  return data as { data: AdminUser[]; pagination: { page: number; pageSize: number; total: number; pages: number } };
}

export async function createUser(token: string, user: { name: string; email: string; password: string; role?: string; status?: string; adminNotes?: string }) {
  const res = await fetch(`${API_BASE}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(user)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to create user');
  }
  return res.json();
}

export async function updateUser(token: string, id: string, patch: { role?: string; status?: string; adminNotes?: string; blockedUntil?: string | null }) {
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(patch)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to update user');
  }
  return res.json();
}

export async function deleteUser(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete user');
  }
  return res.json();
}

export async function getUserDetail(token: string, id: string): Promise<{ user: AdminUser }> {
  const res = await fetch(`${API_BASE}/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch user');
  }
  const data = await res.json();
  if (data?.user?.avatar && data.user.avatar.startsWith('/')) {
    data.user.avatar = API_BASE.replace(/\/$/, '') + data.user.avatar;
  }
  return data;
}

export type UserBlockAudit = {
  id: string;
  action: 'block' | 'unblock' | 'extend';
  reason?: string | null;
  previousBlockedUntil?: string | null;
  newBlockedUntil?: string | null;
  actingUserId: string;
  actor?: { id: string; name: string; email: string; role: string } | null;
  createdAt: string;
};

export async function getUserBlockAudits(token: string, id: string): Promise<{ audits: UserBlockAudit[] }> {
  const res = await fetch(`${API_BASE}/api/users/${id}/block-audits`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const data = await res.json().catch(()=>({}));
    throw new Error(data.message || 'Failed to load audit trail');
  }
  return res.json();
}

export async function blockUser(token: string, id: string, note?: string, blockedUntil?: Date | string | null) {
  let until: string | null | undefined = undefined;
  if (blockedUntil instanceof Date) until = blockedUntil.toISOString();
  else if (typeof blockedUntil === 'string') until = blockedUntil;
  return updateUser(token, id, { status: 'blocked', ...(note ? { adminNotes: note } : {}), ...(until ? { blockedUntil: until } : {}) });
}

export async function unblockUser(token: string, id: string, note?: string) {
  return updateUser(token, id, { status: 'active', ...(note ? { adminNotes: note } : {}) });
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Login failed');
  }
  return res.json();
}


export async function getDashboard(token: string) {
  const res = await fetch(`${API_BASE}/api/dashboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load dashboard');
  }
  return res.json();
}

// Settings API functions
export async function getProfile(token: string): Promise<{
  profile: UserProfile;
  notifications: NotificationSettings;
  security: SecuritySettings;
}> {
  const res = await fetch(`${API_BASE}/api/settings/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load profile');
  }
  const data = await res.json();
  if (data?.profile?.avatar && data.profile.avatar.startsWith('/')) {
    data.profile.avatar = API_BASE.replace(/\/$/, '') + data.profile.avatar;
  }
  return data;
}

export async function updateProfile(token: string, profileData: Partial<UserProfile>): Promise<{ profile: UserProfile }> {
  const res = await fetch(`${API_BASE}/api/settings/profile`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to update profile');
  }
  return res.json();
}

export async function updateAvatar(token: string, avatar: string): Promise<{ avatar: string }> {
  const res = await fetch(`${API_BASE}/api/settings/avatar`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ avatar })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to update avatar');
  }
  return res.json();
}

export async function uploadAvatar(token: string, file: File): Promise<{ avatar: string }> {
  const form = new FormData();
  form.append('avatar', file);
  const res = await fetch(`${API_BASE}/api/settings/avatar/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to upload avatar');
  }
  const data = await res.json();
  if (data?.avatar && data.avatar.startsWith('/')) {
    data.avatar = API_BASE.replace(/\/$/, '') + data.avatar;
  }
  return data;
}

export async function updateNotifications(token: string, notifications: Partial<NotificationSettings>): Promise<{ notifications: NotificationSettings }> {
  const res = await fetch(`${API_BASE}/api/settings/notifications`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(notifications)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to update notifications');
  }
  return res.json();
}

export async function updateSecurity(token: string, security: Partial<SecuritySettings>): Promise<{ security: SecuritySettings }> {
  const res = await fetch(`${API_BASE}/api/settings/security`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(security)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to update security settings');
  }
  return res.json();
}

export async function updateTheme(token: string, theme: 'light' | 'dark' | 'system'): Promise<{ theme: string }> {
  const res = await fetch(`${API_BASE}/api/settings/theme`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ theme })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to update theme');
  }
  return res.json();
}

export async function changePassword(token: string, currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/settings/password`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to change password');
  }
  return res.json();
}

export async function getActivity(token: string): Promise<{ activities: Activity[] }> {
  const res = await fetch(`${API_BASE}/api/settings/activity`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to load activity');
  }
  return res.json();
}

export async function exportUserData(token: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/settings/export`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to export data');
  }
  return res.blob();
}

export async function deleteAccount(token: string, password: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/settings/account`, {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({ password, confirmation: 'DELETE' })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete account');
  }
  return res.json();
}

export const auth = {
  getToken(): string | null {
    return localStorage.getItem('pds_token');
  },
  setToken(token: string) {
    localStorage.setItem('pds_token', token);
  },
  getCurrentUser(): { id: string; role: 'admin' | 'user' } | null {
    try {
      const raw = localStorage.getItem('pds_current_user');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  },
  setCurrentUser(user: { id: string; role: 'admin' | 'user'; name?: string; email?: string }) {
    try { localStorage.setItem('pds_current_user', JSON.stringify(user)); } catch {}
  },
  clear() {
    localStorage.removeItem('pds_token');
    localStorage.removeItem('pds_current_user');
  }
};

// ---------------- Hero Slides (Public + Admin) -----------------
export type HeroSlide = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  altText?: string | null;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  status: 'active' | 'draft' | 'archived';
  sortOrder: number;
  startAt?: string | null;
  endAt?: string | null;
  meta?: any;
  createdAt?: string;
  updatedAt?: string;
};
// Payload used when creating a new slide from the admin UI
export type NewHeroSlide = Pick<HeroSlide, 'title'|'subtitle'|'description'|'imageUrl'|'mobileImageUrl'|'altText'|'ctaLabel'|'ctaUrl'|'status'>;

export async function fetchPublicHeroSlides(): Promise<HeroSlide[]> {
  const res = await fetch(`${API_BASE}/api/hero-slides`);
  if (!res.ok) throw new Error('Failed to load hero slides');
  const data = await res.json();
  const base = API_BASE.replace(/\/$/, '');
  return (data.data || []).map((s: any) => ({
    ...s,
    imageUrl: s.imageUrl?.startsWith('/') ? base + s.imageUrl : s.imageUrl,
    mobileImageUrl: s.mobileImageUrl ? (s.mobileImageUrl.startsWith('/') ? base + s.mobileImageUrl : s.mobileImageUrl) : null,
    meta: s.meta ? {
      ...s.meta,
      watermarkLogoUrl: s.meta.watermarkLogoUrl ? (String(s.meta.watermarkLogoUrl).startsWith('/') ? base + s.meta.watermarkLogoUrl : s.meta.watermarkLogoUrl) : undefined,
    } : undefined,
  }));
}

export async function listHeroSlidesAdmin(token: string): Promise<HeroSlide[]> {
  const res = await fetch(`${API_BASE}/api/hero-slides/admin`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to load slides');
  const data = await res.json();
  return data.data as HeroSlide[];
}

export async function createHeroSlide(token: string, payload: Partial<HeroSlide> & { imageUrl: string }): Promise<HeroSlide> {
  const res = await fetch(`${API_BASE}/api/hero-slides`, { method: 'POST', headers: authHeaders(token, { 'Content-Type': 'application/json' }), body: JSON.stringify(payload) });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Failed to create'); }
  return (await res.json()).slide as HeroSlide;
}

export async function updateHeroSlide(token: string, id: string, payload: Partial<HeroSlide>): Promise<HeroSlide> {
  const res = await fetch(`${API_BASE}/api/hero-slides/${id}`, { method: 'PATCH', headers: authHeaders(token, { 'Content-Type': 'application/json' }), body: JSON.stringify(payload) });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Failed to update'); }
  return (await res.json()).slide as HeroSlide;
}

export async function deleteHeroSlide(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/hero-slides/${id}`, { method: 'DELETE', headers: authHeaders(token) });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Failed to delete'); }
}

export async function reorderHeroSlides(token: string, items: { id: string }[]): Promise<void> {
  const res = await fetch(`${API_BASE}/api/hero-slides/reorder`, { method: 'POST', headers: authHeaders(token, { 'Content-Type': 'application/json' }), body: JSON.stringify({ items }) });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message || 'Failed to reorder'); }
}

// ---------------- Leadership (Public + Admin) -----------------

export type LeadershipMember = {
  id: string;
  name: string;
  title?: string | null;
  shortBio?: string | null;
  fullBio?: string | null;
  imageUrl?: string | null;
  status: 'active' | 'archived';
  sortOrder: number;
  social?: any;
  meta?: any;
  createdAt: string;
  updatedAt: string;
};

export async function listLeadership(): Promise<{ data: LeadershipMember[] }> {
  const res = await fetch(`${API_BASE}/api/leadership`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch leadership');
  }
  return res.json();
}

export async function listLeadershipAdmin(token: string, params: { status?: string } = {}): Promise<{ data: LeadershipMember[] }> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  const res = await fetch(`${API_BASE}/api/leadership/admin?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const data = await res.json().catch(()=>({})); throw new Error(data.message||'Failed to fetch leadership'); }
  return res.json();
}

export async function createLeadership(token: string, payload: Partial<LeadershipMember>): Promise<{ member: LeadershipMember }> {
  const res = await fetch(`${API_BASE}/api/leadership`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  if (!res.ok) { const data = await res.json().catch(()=>({})); throw new Error(data.message||'Failed to create member'); }
  return res.json();
}

export async function updateLeadership(token: string, id: string, payload: Partial<LeadershipMember>): Promise<{ member: LeadershipMember }> {
  const res = await fetch(`${API_BASE}/api/leadership/${id}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
  if (!res.ok) { const data = await res.json().catch(()=>({})); throw new Error(data.message||'Failed to update member'); }
  return res.json();
}

export async function deleteLeadership(token: string, id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/leadership/${id}`, { method:'DELETE', headers:{ Authorization: `Bearer ${token}` } });
  if (!res.ok) { const data = await res.json().catch(()=>({})); throw new Error(data.message||'Failed to delete member'); }
  return res.json();
}

export async function reorderLeadership(token: string, items: { id: string }[]): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/leadership/reorder`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ items }) });
  if (!res.ok) { const data = await res.json().catch(()=>({})); throw new Error(data.message||'Failed to reorder'); }
  return res.json();
}

// ---------------- Products & Categories (Admin + Public) -----------------

export type ProductCategory = {
  id: string;
  name: string;
  code?: string | null;
  slug: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  heroImageUrl?: string | null;
  status: 'active' | 'coming_soon' | 'archived';
  sortOrder: number;
  productCount?: number; // present on admin list endpoint
};

export type ProductListItem = {
  id: string; categoryId: string; name: string; slug: string; shortDescription?: string; imageUrl?: string | null; viscosity?: string | null; apiGrade?: string | null; isActive: boolean; createdAt: string;
};

export type ProductDetail = ProductListItem & {
  longDescription?: string | null; healthSafety?: string | null; meta?: any;
  category?: ProductCategory;
  features?: { id: string; label: string; order: number }[];
  applications?: { id: string; label: string; order: number }[];
  packSizes?: { id: string; displayLabel: string; numericValue?: string; unit?: string; order: number }[];
  media?: { id: string; type: string; url: string; altText?: string; order: number }[];
};

function authHeaders(token: string, extra: Record<string,string> = {}) { return { Authorization: `Bearer ${token}`, ...extra }; }

export async function listProductCategories(token: string, opts: { includeArchived?: boolean } = {}) {
  // Try admin enriched endpoint first (includes archived + productCount + reliable IDs)
  let adminOk = false; let data: any;
  try {
    const resAdmin = await fetch(`${API_BASE}/api/products/admin/categories`, { headers: authHeaders(token) });
    if (resAdmin.ok) {
      data = await resAdmin.json();
      adminOk = true;
    }
  } catch {}
  if (!adminOk) {
    const qs = new URLSearchParams();
    if (opts.includeArchived) qs.set('status','active'); // placeholder
    const res = await fetch(`${API_BASE}/api/products/categories?${qs.toString()}`, { headers: authHeaders(token) });
    if (!res.ok) throw new Error('Failed to load categories');
    data = await res.json();
  }
  return (data.data || []) as ProductCategory[];
}

export async function createProductCategory(token: string, payload: { name: string; code?: string }) {
  const res = await fetch(`${API_BASE}/api/products/categories`, { method:'POST', headers: authHeaders(token, { 'Content-Type':'application/json' }), body: JSON.stringify(payload) });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message||'Failed to create category'); }
  return (await res.json()).category as ProductCategory;
}

export async function updateProductCategory(token: string, id: string, patch: Partial<{ name:string; code:string; shortDescription:string; longDescription:string; heroImageUrl:string; status:'active'|'coming_soon'|'archived'; sortOrder:number; seoMeta:any }>) {
  const res = await fetch(`${API_BASE}/api/products/categories/${id}`, { method:'PATCH', headers: authHeaders(token, { 'Content-Type':'application/json' }), body: JSON.stringify(patch) });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message||'Failed to update category'); }
  return (await res.json()).category as ProductCategory;
}

export async function deleteProductCategory(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/products/categories/${id}`, { method:'DELETE', headers: authHeaders(token) });
  if (!res.ok) { 
    const d = await res.json().catch(()=>({})); 
    throw new Error(d.message || d.details || 'Failed to delete category'); 
  }
  return res.json() as Promise<{ message: string }>;
}

export async function listCategoryProducts(token: string, categorySlug: string, page=1, pageSize=25) {
  const res = await fetch(`${API_BASE}/api/products/categories/${categorySlug}/products?page=${page}&pageSize=${pageSize}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to load products');
  return res.json() as Promise<{ data: ProductListItem[]; pagination: { page:number; pageSize:number; total:number; pages:number } }>;
}

export async function listAllProducts(token: string, page=1, pageSize=100) {
  const res = await fetch(`${API_BASE}/api/products/items?page=${page}&pageSize=${pageSize}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to load products');
  return res.json() as Promise<{ data: ProductListItem[]; pagination: { page:number; pageSize:number; total:number; pages:number } }>;
}

export async function createProduct(token: string, payload: { categoryId: string; name: string; shortDescription?: string; imageUrl?: string; viscosity?: string; apiGrade?: string; }) {
  const res = await fetch(`${API_BASE}/api/products/items`, { method:'POST', headers: authHeaders(token, { 'Content-Type':'application/json' }), body: JSON.stringify(payload) });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message||'Failed to create product'); }
  return (await res.json()).product as ProductDetail;
}

export async function getProduct(token: string, slug: string) {
  const res = await fetch(`${API_BASE}/api/products/items/${slug}`, { headers: authHeaders(token) });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message||'Failed to load product'); }
  return (await res.json()).product as ProductDetail;
}

export async function updateProduct(token: string, id: string, patch: Partial<{ name:string; slug:string; shortDescription:string; longDescription:string; imageUrl:string; viscosity:string; apiGrade:string; healthSafety:string; isActive:boolean; categoryId:string; meta:any }>) {
  const res = await fetch(`${API_BASE}/api/products/items/${id}`, { method:'PATCH', headers: authHeaders(token, { 'Content-Type':'application/json' }), body: JSON.stringify(patch) });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message||'Failed to update product'); }
  return (await res.json()).product as ProductDetail;
}

export async function replaceProductFeatures(token: string, id: string, features: string[]) {
  const res = await fetch(`${API_BASE}/api/products/items/${id}/features`, { method:'PUT', headers: authHeaders(token, { 'Content-Type':'application/json' }), body: JSON.stringify({ features }) });
  if (!res.ok) throw new Error('Failed to update features');
  return res.json();
}

export async function replaceProductApplications(token: string, id: string, applications: string[]) {
  const res = await fetch(`${API_BASE}/api/products/items/${id}/applications`, { method:'PUT', headers: authHeaders(token, { 'Content-Type':'application/json' }), body: JSON.stringify({ applications }) });
  if (!res.ok) throw new Error('Failed to update applications');
  return res.json();
}

export async function replaceProductPacks(token: string, id: string, packs: { displayLabel:string; numericValue?: number | string; unit?: string }[]) {
  const res = await fetch(`${API_BASE}/api/products/items/${id}/packs`, { method:'PUT', headers: authHeaders(token, { 'Content-Type':'application/json' }), body: JSON.stringify({ packs }) });
  if (!res.ok) throw new Error('Failed to update packs');
  return res.json();
}

export async function uploadProductMedia(token: string, id: string, file: File, type: 'image'|'spec'|'msds'|'brochure', altText?: string) {
  const form = new FormData();
  // IMPORTANT: append 'type' before 'file' so multer's fileFilter can read req.body.type in time
  form.append('type', type);
  if (altText) form.append('altText', altText);
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/products/items/${id}/media`, { method:'POST', headers: authHeaders(token), body: form });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message||'Failed to upload'); }
  return (await res.json()).media as { id:string; type:string; url:string; altText?:string; order:number };
}

export async function deleteProductMedia(token: string, mediaId: string) {
  const res = await fetch(`${API_BASE}/api/products/media/${mediaId}`, { method:'DELETE', headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to delete media');
  return res.json();
}

// Direct (unattached) media upload
export async function directMediaUpload(token: string, file: File, opts: { altText?: string; type?: string } = {}) {
  const form = new FormData();
  if (opts.type) form.append('type', opts.type);
  if (opts.altText) form.append('altText', opts.altText);
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/media/upload`, { method:'POST', headers: authHeaders(token), body: form });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message||'Upload failed'); }
  return (await res.json()).media as { id:string; type:string; url:string; altText?:string };
}

// Direct upload with progress (uses XMLHttpRequest to surface upload progress events)
export function directMediaUploadWithProgress(
  token: string,
  file: File,
  opts: { altText?: string; type?: string } = {},
  onProgress?: (fraction: number) => void
): Promise<{ id:string; type:string; url:string; altText?:string }>{
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/media/upload`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.media);
          } catch (e) {
            reject(new Error('Malformed server response'));
          }
        } else {
          let message = 'Upload failed';
          try { message = (JSON.parse(xhr.responseText).message) || message; } catch(_){}
          reject(new Error(message));
        }
      }
    };
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(evt.loaded / evt.total);
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    const form = new FormData();
  if (opts.type) form.append('type', opts.type!);
  if (opts.altText) form.append('altText', opts.altText);
  form.append('file', file);
    xhr.send(form);
  });
}

// Dedicated media listing (server /api/media)
export type MediaLibraryItem = { id:string|null; productId:string|null; productName:string|null; type:string|null; url:string; altText:string|null; size?:number; mime?:string|null; createdAt?:string; ext?:string };
export async function listMedia(token: string, params: { page?:number; pageSize?:number; q?:string; type?:string; sort?: string } = {}): Promise<{ data: MediaLibraryItem[]; pagination:{ page:number; pageSize:number; total:number; pages:number } }> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.q) qs.set('q', params.q);
  if (params.type) qs.set('type', params.type);
  if (params.sort) qs.set('sort', params.sort);
  const res = await fetch(`${API_BASE}/api/media?${qs.toString()}`, { headers: authHeaders(token) });
  if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message||'Failed to load media'); }
  return res.json();
}

// NOTE: Backend currently lacks a dedicated list endpoint for all media. This client helper attempts to
// derive a library by fetching recent products and aggregating media. If a future endpoint
// like /api/products/media is added, replace this implementation.
export async function listAllProductMedia(token: string, limitProducts = 100) : Promise<{ items: Array<{ id:string; type:string; url:string; altText?:string; productId:string; productName:string; createdAt?:string; size?:number; mime?:string }>}> {
  // Heuristic: fetch categories then first page of each until product limit reached
  const categories = await listProductCategories(token).catch(()=>[] as ProductCategory[]);
  const collected: any[] = [];
  for (const cat of categories) {
    if (collected.length >= limitProducts) break;
    const page = await listCategoryProducts(token, cat.slug, 1, 25).catch(()=>({ data: [] as ProductListItem[] }));
    for (const p of page.data) {
      if (collected.length >= limitProducts) break;
      try {
        const detail = await getProduct(token, p.slug);
        (detail.media||[]).forEach(m => collected.push({ id: m.id, type: m.type, url: m.url, altText: m.altText, productId: p.id, productName: p.name, createdAt: p.createdAt, size: (m as any).meta?.size, mime: (m as any).meta?.mime }));
      } catch {}
    }
  }
  // Sort newest first using createdAt fallback
  collected.sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||''));
  return { items: collected };
}

export async function deleteProduct(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/products/items/${id}`, { method:'DELETE', headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

// -------- Public (no auth) convenience wrappers -------
export async function fetchPublicCategories(): Promise<ProductCategory[]> {
  const res = await fetch(`${API_BASE}/api/products/categories`);
  if (!res.ok) throw new Error('Failed to load categories');
  const data = await res.json();
  return data.data as ProductCategory[];
}

export async function fetchPublicCategory(slug: string): Promise<{ category: ProductCategory; productCount: number }> {
  const res = await fetch(`${API_BASE}/api/products/categories/${slug}`);
  if (!res.ok) throw new Error('Category not found');
  return res.json();
}

export async function fetchPublicCategoryProducts(slug: string, page=1, pageSize=25): Promise<{ data: ProductListItem[]; pagination: { page:number; pageSize:number; total:number; pages:number } }> {
  const res = await fetch(`${API_BASE}/api/products/categories/${slug}/products?page=${page}&pageSize=${pageSize}`);
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export async function fetchPublicProduct(slug: string): Promise<ProductDetail> {
  const res = await fetch(`${API_BASE}/api/products/items/${slug}`);
  if (!res.ok) throw new Error('Product not found');
  return (await res.json()).product as ProductDetail;
}

// Inquiry types
export type Inquiry = {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  ipAddress?: string;
  userAgent?: string;
  assignedTo?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  };
  resolvedByUser?: {
    id: string;
    name: string;
    email: string;
  };
};

export type InquiryStats = {
  total: number;
  byStatus: {
    new: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  unresolved: number;
};

// ---------------- Dealership Inquiries ----------------
export type DealershipInquiry = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  businessType?: string | null;
  yearsInBusiness?: number | null;
  currentBrands?: string | null;
  monthlyVolume?: string | null;
  message?: string | null;
  status: 'new' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  assignedTo?: string | null;
  assignedUser?: { id: string; name: string; email: string } | null;
  resolvedBy?: string | null;
  resolvedByUser?: { id: string; name: string; email: string } | null;
  adminNotes?: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
};

export type DealershipInquiryStats = InquiryStats;

export async function createDealershipInquiry(data: Omit<DealershipInquiry, 'id' | 'status' | 'priority' | 'source' | 'createdAt' | 'updatedAt'> & { honeypot?: string }) {
  const res = await fetch(`${API_BASE}/api/dealership-inquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.message || 'Failed to submit inquiry');
  }
  return res.json();
}

export async function listDealershipInquiries(token: string, params: { page?: number; pageSize?: number; search?: string; status?: string; priority?: string; assignedTo?: string; sortBy?: string; sortOrder?: 'asc'|'desc'; } = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k,v])=>{ if (v !== undefined && v !== '') qs.append(k, String(v)); });
  const res = await fetch(`${API_BASE}/api/dealership-inquiries?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.message || 'Failed to fetch inquiries');
  }
  return res.json() as Promise<{ data: DealershipInquiry[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>;
}

export async function getDealershipInquiry(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/dealership-inquiries/${id}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message || 'Failed to fetch inquiry'); }
  return res.json() as Promise<DealershipInquiry>;
}

export async function updateDealershipInquiry(token: string, id: string, patch: { status?: string; priority?: string; assignedTo?: string; adminNotes?: string; resolvedBy?: string; }) {
  const res = await fetch(`${API_BASE}/api/dealership-inquiries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(patch) });
  if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message || 'Failed to update inquiry'); }
  return res.json() as Promise<{ message: string; inquiry: DealershipInquiry }>;
}

export async function deleteDealershipInquiry(token: string, id: string) {
  const res = await fetch(`${API_BASE}/api/dealership-inquiries/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message || 'Failed to delete inquiry'); }
  return res.json() as Promise<{ message: string }>;
}

export async function getDealershipInquiryStats(token: string) {
  const res = await fetch(`${API_BASE}/api/dealership-inquiries/stats/summary`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const err = await res.json().catch(()=>({})); throw new Error(err.message || 'Failed to fetch inquiry statistics'); }
  return res.json() as Promise<DealershipInquiryStats>;
}

// Create inquiry (public endpoint)
export async function createInquiry(inquiry: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject?: string;
  message: string;
}): Promise<{ message: string; id: string }> {
  const res = await fetch(`${API_BASE}/api/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inquiry)
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to submit inquiry');
  }
  
  return res.json();
}

// Get all inquiries (admin only)
export async function listInquiries(token: string, params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.append(k, String(v));
  });

  const res = await fetch(`${API_BASE}/api/inquiries?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch inquiries');
  }

  return res.json() as Promise<{
    data: Inquiry[];
    pagination: { page: number; pageSize: number; total: number; pages: number };
  }>;
}

// Get inquiry by ID (admin only)
export async function getInquiry(token: string, id: string): Promise<Inquiry> {
  const res = await fetch(`${API_BASE}/api/inquiries/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch inquiry');
  }

  return res.json();
}

// Update inquiry (admin only)
export async function updateInquiry(token: string, id: string, updates: {
  status?: string;
  priority?: string;
  assignedTo?: string;
  adminNotes?: string;
  resolvedBy?: string;
}): Promise<{ message: string; inquiry: Inquiry }> {
  const res = await fetch(`${API_BASE}/api/inquiries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to update inquiry');
  }

  return res.json();
}

// Delete inquiry (admin only)
export async function deleteInquiry(token: string, id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/inquiries/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete inquiry');
  }

  return res.json();
}

// Get inquiry statistics (admin only)
export async function getInquiryStats(token: string): Promise<InquiryStats> {
  const res = await fetch(`${API_BASE}/api/inquiries/stats/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch inquiry statistics');
  }

  return res.json();
}

// ============ Dealership Inquiries API ============

// ============ Gallery API ============

export type GalleryItem = {
  id: string;
  title: string;
  description?: string;
  category: 'facility' | 'products' | 'events' | 'achievements';
  imageUrl: string;
  date: string;
  location?: string;
  featured: boolean;
  status: 'active' | 'archived';
  sortOrder: number;
  seoMeta?: any;
  createdAt: string;
  updatedAt: string;
};

export type GalleryStats = {
  totalItems: number;
  featuredItems: number;
  activeItems: number;
  archivedItems: number;
  categoryStats: {
    facility?: number;
    products?: number;
    events?: number;
    achievements?: number;
  };
};

export type GalleryListResponse = {
  data: GalleryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Get gallery items (public)
export async function listGalleryItems(params: {
  page?: number;
  pageSize?: number;
  category?: string;
  featured?: boolean;
  q?: string;
} = {}): Promise<GalleryListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.category) searchParams.set('category', params.category);
  if (params.featured !== undefined) searchParams.set('featured', params.featured.toString());
  if (params.q) searchParams.set('q', params.q);

  const res = await fetch(`${API_BASE}/api/gallery?${searchParams}`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch gallery items');
  }

  return res.json();
}

// Get gallery statistics (admin only)
export async function getGalleryStats(token: string): Promise<GalleryStats> {
  const res = await fetch(`${API_BASE}/api/gallery/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch gallery statistics');
  }

  return res.json();
}

// Get all gallery items for admin (including archived)
export async function listAdminGalleryItems(token: string, params: {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  featured?: boolean;
  q?: string;
} = {}): Promise<GalleryListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
  if (params.category) searchParams.set('category', params.category);
  if (params.status) searchParams.set('status', params.status);
  if (params.featured !== undefined) searchParams.set('featured', params.featured.toString());
  if (params.q) searchParams.set('q', params.q);

  const res = await fetch(`${API_BASE}/api/gallery/admin?${searchParams}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch admin gallery items');
  }

  return res.json();
}

// Get single gallery item
export async function getGalleryItem(id: string): Promise<GalleryItem> {
  const res = await fetch(`${API_BASE}/api/gallery/${id}`);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to fetch gallery item');
  }

  return res.json();
}

// Create gallery item (admin only)
export async function createGalleryItem(token: string, data: {
  title: string;
  description?: string;
  category: string;
  imageUrl: string;
  date?: string;
  location?: string;
  featured?: boolean;
  status?: string;
  sortOrder?: number;
}): Promise<GalleryItem> {
  const res = await fetch(`${API_BASE}/api/gallery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.message || 'Failed to create gallery item');
  }

  return res.json();
}

// Update gallery item (admin only)
export async function updateGalleryItem(token: string, id: string, data: Partial<{
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  date: string;
  location: string;
  featured: boolean;
  status: string;
  sortOrder: number;
}>): Promise<GalleryItem> {
  const res = await fetch(`${API_BASE}/api/gallery/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const responseData = await res.json().catch(() => ({}));
    throw new Error(responseData.message || 'Failed to update gallery item');
  }

  return res.json();
}

// Delete gallery item (admin only)
export async function deleteGalleryItem(token: string, id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/gallery/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to delete gallery item');
  }

  return res.json();
}

// Reorder gallery items (admin only)
export async function reorderGalleryItems(token: string, items: { id: string }[]): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/api/gallery/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ items })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to reorder gallery items');
  }

  return res.json();
}




