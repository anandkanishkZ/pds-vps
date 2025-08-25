import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, UserCheck, UserX, Mail, Phone, Calendar, Filter, RefreshCw, X, Loader2, Ban, Info } from 'lucide-react';
import { auth, listUsers, createUser, updateUser, deleteUser, type AdminUser } from '../../lib/api';
import Modal from '../../components/Modal';
import { blockUser, unblockUser, getUserDetail, getUserBlockAudits, type UserBlockAudit } from '../../lib/api';
import { toast } from 'react-toastify';

type User = AdminUser & { role: 'admin' | 'user' | 'moderator' };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'moderator' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending' | 'blocked'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', status: 'active' });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [notesEditing, setNotesEditing] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockTarget, setBlockTarget] = useState<User | null>(null);
  const [blockNote, setBlockNote] = useState('');
  const [blockSavingDraft, setBlockSavingDraft] = useState(false);
  const [blockDraftSavedAt, setBlockDraftSavedAt] = useState<Date | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);
  // New: timed suspension state
  const [blockDuration, setBlockDuration] = useState<'perm' | '1h' | '24h' | '7d' | '30d' | 'custom'>('perm');
  const [blockCustomUntil, setBlockCustomUntil] = useState<string>(''); // local datetime string
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesLastSaved, setNotesLastSaved] = useState<Date | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [audits, setAudits] = useState<UserBlockAudit[] | null>(null);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [auditsError, setAuditsError] = useState<string | null>(null);

  // Debounced auto-save for admin notes inside detail modal
  useEffect(() => {
    if (!showDetailModal || !detailUser) return;
    const original = detailUser.adminNotes || '';
    if (notesEditing === original) return; // nothing changed
    setNotesSaving(true);
    const id = setTimeout(async () => {
      try {
        const token = auth.getToken();
        if (!token) throw new Error('Not authenticated');
        await updateUser(token, detailUser.id, { adminNotes: notesEditing });
        setUsers(us => us.map(u => u.id === detailUser.id ? { ...u, adminNotes: notesEditing } : u));
        setNotesLastSaved(new Date());
      } catch (e:any) {
        toast.error(e.message || 'Failed to auto-save notes');
      } finally {
        setNotesSaving(false);
      }
    }, 700); // debounce duration
    return () => clearTimeout(id);
  }, [notesEditing, showDetailModal, detailUser]);

  // Load existing block draft when opening block modal for a user
  useEffect(() => {
    if (showBlockModal && blockTarget) {
      try {
        const stored = localStorage.getItem(`blockDraft:${blockTarget.id}`);
        if (stored) setBlockNote(stored);
      } catch {/* ignore storage errors */}
    } else if (!showBlockModal) {
      // reset error when modal closed
      setBlockError(null);
    }
  }, [showBlockModal, blockTarget]);

  // Debounce save block note draft locally while editing
  useEffect(() => {
    if (!showBlockModal || !blockTarget) return;
    setBlockSavingDraft(true);
    const t = setTimeout(() => {
      try {
        localStorage.setItem(`blockDraft:${blockTarget.id}`, blockNote);
        setBlockDraftSavedAt(new Date());
      } catch {/* ignore */}
      finally { setBlockSavingDraft(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [blockNote, showBlockModal, blockTarget]);

  const loadUsers = async () => {
    try {
      setFetching(true);
      const token = auth.getToken();
      if (!token) throw new Error('Not authenticated');
      const data = await listUsers(token, {
        search: searchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      // Cast for moderator support (not in backend role enum, keep for UI continuity)
      setUsers(data.data as User[]);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setFetching(false);
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); /* eslint-disable-next-line */ }, [roleFilter, statusFilter]);

  const onSearch = () => loadUsers();

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEditUser = (_user: User) => {
    toast.info('Edit user modal not yet implemented');
  };

  const handleAddUser = () => {
    setShowCreateModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      const token = auth.getToken();
      if (!token) throw new Error('Not authenticated');
      await deleteUser(token, userToDelete.id);
      toast.success('User deleted');
      setUsers(u => u.filter(x => x.id !== userToDelete.id));
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setUserToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: User['status']) => {
    try {
      const token = auth.getToken();
      if (!token) throw new Error('Not authenticated');
      await updateUser(token, userId, { status: newStatus });
      setUsers(users.map(user => user.id === userId ? { ...user, status: newStatus } : user));
      toast.success('Status updated');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const currentUser = auth.getCurrentUser();
  const canModifyUser = (target: User) => {
    if (!currentUser) return false;
    if (currentUser.id === target.id) return false; // cannot self modify block status
    if (target.role === 'admin' && currentUser.role !== 'admin') return false; // only admin can act on admin
    return true;
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-50 ring-emerald-600/20';
      case 'inactive': return 'text-slate-700 bg-slate-50 ring-slate-600/20';
      case 'pending': return 'text-amber-700 bg-amber-50 ring-amber-600/20';
      case 'blocked': return 'text-red-700 bg-red-50 ring-red-600/20';
      default: return 'text-slate-700 bg-slate-50 ring-slate-600/20';
    }
  };

  const getRoleColor = (role: User['role']) => {
    if (role === 'admin') return 'text-purple-700 bg-purple-50 ring-purple-600/20';
    if (role === 'moderator') return 'text-blue-700 bg-blue-50 ring-blue-600/20';
    return 'text-slate-700 bg-slate-50 ring-slate-600/20';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Load audit trail
  const loadAudits = async (userId: string) => {
    try {
      setAuditsLoading(true); setAuditsError(null);
      const token = auth.getToken(); if(!token) throw new Error('Not authenticated');
      const data = await getUserBlockAudits(token, userId);
      setAudits(data.audits);
    } catch(e:any) { setAuditsError(e.message || 'Failed to load audits'); }
    finally { setAuditsLoading(false); }
  };

  // New: format remaining suspension seconds
  const formatRemaining = (sec: number) => {
    if (sec <= 0) return 'expired';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${sec}s`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Users</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Manage user accounts and permissions</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
              className="pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); onSearch(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
              showFilters 
                ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSearch}
            className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
          >
            {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <button
            onClick={handleAddUser}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                      {user.status === 'blocked' && user.remainingBlockSeconds && user.remainingBlockSeconds > 0 && (
                        <span className="text-[10px] font-medium text-red-600 dark:text-red-400">
                          {formatRemaining(user.remainingBlockSeconds)} left
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(user.id, 'active')}
                          className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition"
                          title="Approve user"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleStatusChange(user.id, 'inactive')}
                          className="p-1 text-slate-600 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition"
                          title="Deactivate user"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      )}
                      {user.status !== 'blocked' && canModifyUser(user) && (
                        <button
                          onClick={() => { setBlockTarget(user); setShowBlockModal(true); }}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                          title="Block user"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      {user.status === 'blocked' && canModifyUser(user) && (
                        <button
                          onClick={async () => { try { const token = auth.getToken(); if (!token) throw new Error('Not authenticated'); await unblockUser(token, user.id); setUsers(us => us.map(u => u.id === user.id ? { ...u, status: 'active', blockedAt: null, blockedUntil: null, remainingBlockSeconds: null } : u)); toast.success('User unblocked'); } catch (e:any){ toast.error(e.message); } }}
                          className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition"
                          title="Unblock user"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={async () => { try { const token = auth.getToken(); if (!token) throw new Error('Not authenticated'); const detail = await getUserDetail(token, user.id); setDetailUser(detail.user); setNotesEditing(detail.user.adminNotes || ''); setShowDetailModal(true); setShowAudit(false); setAudits(null); } catch(e:any){ toast.error(e.message);} }}
                        className="p-1 text-slate-600 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition"
                        title="View details"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                      {user.status === 'inactive' && (
                        <button
                          onClick={() => handleStatusChange(user.id, 'active')}
                          className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition"
                          title="Activate user"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="text-slate-400 dark:text-slate-500 mb-2">
              <Search className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No users found</h3>
              <p className="text-sm">Try adjusting your search or filter criteria.</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal && !!userToDelete}
        onClose={() => { setShowDeleteModal(false); setUserToDelete(null); }}
        title="Delete User"
        subtitle={userToDelete ? `This will permanently remove ${userToDelete.name}` : ''}
        size="sm"
        actions={userToDelete && (
          <>
            <button
              onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
              className="inline-flex justify-center px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >Cancel</button>
            <button
              onClick={confirmDelete}
              className="inline-flex justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white shadow hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >Delete</button>
          </>
        )}
      >
        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3">
          <p>Deleted users cannot be restored. All associated data may be lost.</p>
          {userToDelete && (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-3 text-red-700 dark:text-red-300 text-xs">
              <Trash2 className="h-4 w-4" />
              <span><strong>{userToDelete.name}</strong> ({userToDelete.email})</span>
            </div>
          )}
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New User"
        subtitle="Create an account and assign initial role & status"
        size="lg"
        initialFocusSelector="input[name=fullName]"
        actions={
          <>
            <button
              onClick={() => setShowCreateModal(false)}
              disabled={creating}
              className="inline-flex justify-center px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >Cancel</button>
            <button
              onClick={async () => {
                try {
                  setCreating(true);
                  const token = auth.getToken();
                  if (!token) throw new Error('Not authenticated');
                  await createUser(token, newUser);
                  toast.success('User created');
                  setShowCreateModal(false);
                  setNewUser({ name: '', email: '', password: '', role: 'user', status: 'active' });
                  loadUsers();
                } catch (err) {
                  console.error(err);
                  toast.error(err instanceof Error ? err.message : 'Create failed');
                } finally {
                  setCreating(false);
                }
              }}
              disabled={creating || !newUser.name || !newUser.email || !newUser.password}
              className="inline-flex justify-center px-5 py-2.5 rounded-lg text-sm font-semibold bg-brand-600 text-white shadow hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-50 gap-2"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create User
            </button>
          </>
        }
      >
        <div className="grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Name</label>
              <input name="fullName" type="text" value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Email</label>
              <input type="email" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" placeholder="name@example.com" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Password</label>
              <input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser,password:e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent" placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Role</label>
              <select value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Status</label>
            <select value={newUser.status} onChange={e=>setNewUser({...newUser,status:e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Block User Modal */}
      <Modal
        open={showBlockModal && !!blockTarget}
        onClose={() => { setShowBlockModal(false); setBlockNote(''); setBlockDuration('perm'); setBlockCustomUntil(''); }}
        title="Block User"
        subtitle={blockTarget ? `Blocking ${blockTarget.name}` : ''}
        size="xl"
        initialFocusSelector="textarea[name=blockReason]"
        actions={blockTarget && (
          <>
            <button onClick={()=>{setShowBlockModal(false); setBlockNote(''); if(blockTarget){ try { localStorage.removeItem(`blockDraft:${blockTarget.id}`);} catch {} } setBlockDuration('perm'); setBlockCustomUntil('');}} className="inline-flex justify-center px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button
              onClick={async ()=>{
                if (!blockTarget) return;
                setBlockError(null);
                const trimmed = blockNote.trim();
                if (trimmed.length > 0 && trimmed.length < 5) { setBlockError('Reason is too short (min 5 characters) or leave it blank.'); return; }
                if (trimmed.length > 500) { setBlockError('Reason exceeds 500 character limit.'); return; }
                // derive blockedUntil
                let blockedUntil: Date | null = null;
                if (blockDuration !== 'perm') {
                  const now = new Date();
                  if (blockDuration === '1h') blockedUntil = new Date(now.getTime() + 3600*1000);
                  else if (blockDuration === '24h') blockedUntil = new Date(now.getTime() + 24*3600*1000);
                  else if (blockDuration === '7d') blockedUntil = new Date(now.getTime() + 7*24*3600*1000);
                  else if (blockDuration === '30d') blockedUntil = new Date(now.getTime() + 30*24*3600*1000);
                  else if (blockDuration === 'custom') {
                    if (!blockCustomUntil) { setBlockError('Select custom end time'); return; }
                    const dt = new Date(blockCustomUntil);
                    if (isNaN(dt.getTime()) || dt <= now) { setBlockError('Custom end must be in the future'); return; }
                    blockedUntil = dt;
                  }
                }
                try {
                  const token=auth.getToken(); if(!token) throw new Error('Not authenticated');
                  await blockUser(token, blockTarget.id, trimmed, blockedUntil || undefined);
                  setUsers(us=>us.map(u=>u.id===blockTarget.id?{...u,status:'blocked',blockedAt:new Date().toISOString(),adminNotes:trimmed || u.adminNotes, blockedUntil: blockedUntil? blockedUntil.toISOString(): null, remainingBlockSeconds: blockedUntil? Math.floor((blockedUntil.getTime()-Date.now())/1000): null}:u));
                  toast.success('User blocked');
                  try { localStorage.removeItem(`blockDraft:${blockTarget.id}`);} catch {}
                } catch(e:any){
                  const msg = e?.message || 'Failed to block user';
                  setBlockError(msg);
                  toast.error(msg);
                  return;
                } finally {
                  setShowBlockModal(false); setBlockNote(''); setBlockTarget(null); setBlockDuration('perm'); setBlockCustomUntil('');
                }
              }}
              className="inline-flex justify-center px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white shadow hover:bg-red-700 disabled:opacity-50"
              disabled={blockNote.trim().length>500 || blockSavingDraft}
            >Block User</button>
          </>
        )}
      >
        <div className="text-sm max-h-[70vh] overflow-y-auto pr-1">
          <div className="hidden md:block mb-4 text-slate-600 dark:text-slate-400">Provide an optional note explaining the reason. Choose a duration and (optionally) a preset reason.</div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Left column: duration + presets + info */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Duration</label>
                <div className="flex flex-wrap gap-2">
                  {([
                    {key:'perm', label:'Permanent'},
                    {key:'1h', label:'1 Hour'},
                    {key:'24h', label:'24 Hours'},
                    {key:'7d', label:'7 Days'},
                    {key:'30d', label:'30 Days'},
                    {key:'custom', label:'Custom'}
                  ] as const).map(opt => (
                    <button key={opt.key} type="button" onClick={()=>setBlockDuration(opt.key)} className={`px-3 py-1.5 rounded-md text-xs font-medium border transition ${blockDuration===opt.key ? 'bg-red-600 border-red-600 text-white shadow' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}>{opt.label}</button>
                  ))}
                </div>
                {blockDuration === 'custom' && (
                  <div className="mt-2 flex items-center gap-2">
                    <input type="datetime-local" value={blockCustomUntil} onChange={e=>setBlockCustomUntil(e.target.value)} className="px-2 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500" />
                    <button type="button" onClick={()=>{ setBlockCustomUntil(''); setBlockDuration('perm'); }} className="text-[10px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">Clear</button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Quick Reasons</label>
                <div className="flex flex-wrap gap-2">
                  {['Spam / Abuse','Security Concern','Policy Violation','Chargeback Risk','Duplicate Account'].map(preset => (
                    <button key={preset} type="button" onClick={()=>setBlockNote(preset)} className="px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 transition">
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              {blockTarget && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-3 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <Ban className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Blocked users cannot authenticate until unblocked{blockDuration !== 'perm' ? ' or the suspension expires' : ''}. Historical activity stays for auditing.</span>
                </div>
              )}
            </div>
            {/* Right column: reason textarea */}
            <div className="space-y-2 md:flex md:flex-col">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Reason / Note</label>
                <div className="flex items-center gap-2">
                  {blockSavingDraft && <span className="text-[10px] text-amber-500">Saving draft…</span>}
                  {!blockSavingDraft && blockDraftSavedAt && <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Draft saved {blockDraftSavedAt.toLocaleTimeString()}</span>}
                  <span className={`text-[10px] font-medium ${blockNote.length>500?'text-red-600 dark:text-red-400':'text-slate-400'}`}>{blockNote.length}/500</span>
                </div>
              </div>
              <textarea
                name="blockReason"
                maxLength={600}
                value={blockNote}
                onChange={e=>setBlockNote(e.target.value)}
                className="w-full h-40 md:flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm resize-none"
                placeholder="Optional explanatory note (e.g., multiple failed login attempts, abusive messages, suspected automation, etc.)"
              />
              {blockError && (
                <div className="rounded-md border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-2">
                  <Trash2 className="h-3.5 w-3.5 mt-0.5" />
                  <span>{blockError}</span>
                </div>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-500">Visible only to administrators. Keep it factual & professional.</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={showDetailModal && !!detailUser}
        onClose={()=>setShowDetailModal(false)}
        title={detailUser ? `User Detail` : 'User Detail'}
        subtitle={detailUser ? `Created ${new Date(detailUser.createdAt).toLocaleString()}` : ''}
        size="xl"
        initialFocusSelector="textarea[name=adminNotes]"
        actions={detailUser && (
          <>
            <button onClick={()=>{ setShowAudit(a=>!a); if(!showAudit && detailUser){ loadAudits(detailUser.id);} }} className="inline-flex px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">{showAudit? 'Hide Audits':'View Audits'}</button>
            {detailUser.status !== 'blocked' ? (
              <button onClick={()=>{ setBlockTarget(detailUser); setShowBlockModal(true); }} className="inline-flex px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 gap-2 items-center"><Ban className="h-4 w-4"/> Block</button>
            ) : (
              <button onClick={async ()=>{ try{ const token=auth.getToken(); if(!token) throw new Error('Not authenticated'); await unblockUser(token, detailUser.id); setDetailUser({...detailUser,status:'active',blockedAt:null, blockedUntil: null, remainingBlockSeconds: null}); setUsers(us=>us.map(u=>u.id===detailUser.id?{...u,status:'active',blockedAt:null, blockedUntil:null, remainingBlockSeconds:null}:u)); toast.success('User unblocked'); } catch(e:any){ toast.error(e.message);} }} className="inline-flex px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 gap-2 items-center"><UserCheck className="h-4 w-4"/> Unblock</button>
            )}
            <button onClick={()=>setShowDetailModal(false)} className="inline-flex px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Close</button>
          </>
        )}
      >
        {detailUser && (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-5">
              <div className="flex flex-col items-center text-center">
                {detailUser.avatar ? <img src={detailUser.avatar} className="h-24 w-24 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow"/> : <div className="h-24 w-24 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-2xl font-semibold text-brand-700 dark:text-brand-300 shadow-inner">{detailUser.name.charAt(0)}</div>}
                <div className="mt-3 space-y-1">
                  <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">{detailUser.name} {detailUser.status === 'blocked' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Blocked</span>}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{detailUser.email}</div>
                </div>
              </div>
              <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg">
                <div><strong className="font-medium">Role:</strong> {detailUser.role}</div>
                <div><strong className="font-medium">Status:</strong> {detailUser.status}</div>
                {detailUser.lastLoginAt && <div><strong className="font-medium">Last Login:</strong> {new Date(detailUser.lastLoginAt).toLocaleString()}</div>}
                {detailUser.blockedAt && <div><strong className="font-medium">Blocked At:</strong> {new Date(detailUser.blockedAt).toLocaleString()}</div>}
                {detailUser.blockedUntil && <div><strong className="font-medium">Blocked Until:</strong> {new Date(detailUser.blockedUntil).toLocaleString()} {detailUser.remainingBlockSeconds && detailUser.remainingBlockSeconds>0 && <span className="ml-1 text-red-600 dark:text-red-400">({formatRemaining(detailUser.remainingBlockSeconds)} left)</span>}</div>}
              </div>
            </div>
            <div className="flex-1 space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Admin Notes</label>
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-2">
                    {notesSaving && <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400"><Loader2 className="h-3 w-3 animate-spin"/> Saving...</span>}
                    {!notesSaving && notesLastSaved && <span className="text-emerald-600 dark:text-emerald-400">Saved {notesLastSaved.toLocaleTimeString()}</span>}
                    {!notesSaving && !notesLastSaved && <span className="text-slate-400">Auto-save enabled</span>}
                  </div>
                </div>
                <textarea name="adminNotes" value={notesEditing} onChange={e=>setNotesEditing(e.target.value)} rows={6} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 backdrop-blur focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm resize-y" placeholder="Add internal notes / reasons, audit info, etc." />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-500">Notes save automatically after you stop typing.</p>
              </div>
              {showAudit && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">Block / Unblock Audit Trail</h3>
                    {auditsLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                  </div>
                  {auditsError && <div className="text-xs text-red-600 dark:text-red-400 mb-2">{auditsError}</div>}
                  {!auditsLoading && audits && audits.length === 0 && <div className="text-xs text-slate-500">No audit entries.</div>}
                  <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                    {audits && audits.map(a => (
                      <li key={a.id} className="p-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 backdrop-blur text-[11px] leading-relaxed">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold capitalize">{a.action}</span>
                          <span className="text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
                          {a.actor && <span className="text-slate-600 dark:text-slate-300">by {a.actor.name}{a.actor.role==='admin' && ' (admin)'} </span>}
                        </div>
                        {a.reason && <div className="mt-1 text-slate-600 dark:text-slate-400">Reason: {a.reason}</div>}
                        {(a.previousBlockedUntil || a.newBlockedUntil) && (
                          <div className="mt-1 text-slate-500 dark:text-slate-500 flex flex-col gap-0.5">
                            {a.previousBlockedUntil && <span>Prev until: {new Date(a.previousBlockedUntil).toLocaleString()}</span>}
                            {a.newBlockedUntil && <span>New until: {new Date(a.newBlockedUntil).toLocaleString()}</span>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
