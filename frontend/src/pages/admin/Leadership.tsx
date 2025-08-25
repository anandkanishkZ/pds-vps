import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, GripVertical, Save, X, Image as ImageIcon, RefreshCw, Linkedin, AtSign, Link2, Eye, EyeOff } from 'lucide-react';
import { auth, listLeadershipAdmin, createLeadership, updateLeadership, deleteLeadership, reorderLeadership, type LeadershipMember, listMedia, type MediaLibraryItem, API_BASE } from '../../lib/api';
import { toast } from 'react-toastify';

const AdminLeadershipPage: React.FC = () => {
  const token = auth.getToken();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<LeadershipMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LeadershipMember | null>(null);
  const [form, setForm] = useState({
    name:'',
    title:'',
    shortBio:'',
    fullBio:'',
    imageUrl:'',
    status:'active' as 'active'|'archived',
    linkedin:'',
    website:'',
    email:'',
    sortOrder: undefined as number | undefined
  });
  const [saving, setSaving] = useState(false);
  const [draggingId, setDraggingId] = useState<string|null>(null);
  const [showMedia, setShowMedia] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaLibraryItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [expandFullBio, setExpandFullBio] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await listLeadershipAdmin(token, {});
      setMembers(res.data);
    } catch (e:any) { toast.error(e.message||'Failed to load'); }
    finally { setLoading(false); }
  }, [token]);

  const loadMedia = useCallback(async () => {
    if (!token) return;
    try { setMediaLoading(true); const res = await listMedia(token, { pageSize:200 }); const base = API_BASE.replace(/\/$/,''); setMediaItems(res.data.map(i=>({ ...i, url: i.url.startsWith('http')?i.url: base + (i.url.startsWith('/')?i.url:'/'+i.url) }))); }
    catch(e:any){ toast.error(e.message||'Media load failed'); }
    finally { setMediaLoading(false); }
  }, [token]);

  useEffect(()=>{ load(); }, [load]);

  const resetForm = () => { setForm({ name:'', title:'', shortBio:'', fullBio:'', imageUrl:'', status:'active', linkedin:'', website:'', email:'', sortOrder: undefined }); setEditing(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!token) return;
    const payload: any = { ...form };
    // Build social object
    const social: Record<string,string> = {};
    if (form.linkedin) social.linkedin = form.linkedin.trim();
    if (form.website) social.website = form.website.trim();
    if (form.email) social.email = form.email.trim();
    if (Object.keys(social).length) payload.social = social; else payload.social = null;
    if (payload.sortOrder === undefined) delete payload.sortOrder;
    delete payload.linkedin; delete payload.website; delete payload.email;
    try {
      setSaving(true);
      if (editing) { await updateLeadership(token, editing.id, payload); toast.success('Updated'); }
      else { await createLeadership(token, payload); toast.success('Created'); }
      setShowForm(false); resetForm(); load();
    } catch(e:any){ toast.error(e.message||'Save failed'); }
    finally{ setSaving(false);} };

  const startEdit = (m: LeadershipMember) => {
    const social = (m as any).social || {};
    setEditing(m);
    setForm({
      name:m.name,
      title:m.title||'',
      shortBio:m.shortBio||'',
      fullBio:m.fullBio||'',
      imageUrl:m.imageUrl||'',
      status:m.status,
      linkedin: social.linkedin || '',
      website: social.website || '',
      email: social.email || '',
      sortOrder: (m as any).sortOrder ?? undefined
    });
    setShowForm(true);
  };

  const del = async (m: LeadershipMember) => { if (!token) return; if (!confirm(`Delete ${m.name}?`)) return; try { await deleteLeadership(token, m.id); toast.success('Deleted'); load(); } catch(e:any){ toast.error(e.message||'Delete failed'); } };

  // Drag & drop reorder
  const onDragStart = (id: string) => setDraggingId(id);
  const onDragOver = (e: React.DragEvent, overId: string) => { e.preventDefault(); if (draggingId === overId) return; const arr = [...members]; const from = arr.findIndex(m=>m.id===draggingId); const to = arr.findIndex(m=>m.id===overId); if (from===-1||to===-1) return; const [item] = arr.splice(from,1); arr.splice(to,0,item); setMembers(arr); };
  const onDragEnd = async () => { if (!token) return; setDraggingId(null); try { await reorderLeadership(token, members.map(m=>({ id:m.id }))); toast.success('Order saved'); } catch(e:any){ toast.error(e.message||'Reorder failed'); load(); } };

  const toggleStatus = async (m: LeadershipMember) => {
    if (!token) return;
    try { await updateLeadership(token, m.id, { status: m.status === 'active' ? 'archived' : 'active' });
      setMembers(list => list.map(x => x.id === m.id ? { ...x, status: x.status==='active'?'archived':'active' } : x));
    } catch(e:any){ toast.error(e.message||'Status change failed'); }
  };

  // Character counts helpers
  const shortCount = form.shortBio.length;
  const fullCount = form.fullBio.length;

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 -mx-3 -mt-3 mb-6 px-4 py-3 flex flex-wrap items-center gap-3 bg-gradient-to-r from-white/90 via-white/75 to-white/60 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-900/60 backdrop-blur border-b border-slate-200/70 dark:border-slate-700/60 rounded-t-2xl">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">Leadership Team {loading && <span className="text-xs font-medium text-slate-500 animate-pulse">Loading…</span>}</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Create, reorder and publish executive / leadership profiles for the public About page.</p>
        </div>
        <div className="ml-auto flex gap-2 flex-wrap">
          <button onClick={()=>{ resetForm(); setShowForm(v=>!v); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium shadow-sm hover:bg-brand-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
            <Plus className="h-4 w-4" /> {showForm?(editing?'Close Editor':'Close Form'):'Add Member'}
          </button>
          <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200 text-sm font-medium shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="mb-10 rounded-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-white/80 dark:bg-slate-900/70 backdrop-blur shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-700/70 flex items-center gap-3 bg-gradient-to-r from-slate-50/60 to-transparent dark:from-slate-800/40">
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide uppercase text-brand-700 dark:text-brand-300">{editing ? 'Edit Member' : 'New Member'}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Fill profile details – short bio appears on card; full bio appears in modal.</span>
            </div>
            <div className="ml-auto flex gap-2">
              {editing && <button type="button" onClick={()=>{ resetForm(); setShowForm(false); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"><X className="h-4 w-4"/>Close</button>}
              <button disabled={saving} type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500 shadow disabled:opacity-50"><Save className="h-4 w-4" /> {editing?'Update':'Create'}</button>
            </div>
          </div>
          <div className="p-5 grid lg:grid-cols-3 gap-6">
            {/* Left column: image & meta */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Profile Image</label>
                <div className="relative group rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/60 dark:bg-slate-800/40 aspect-[4/5] flex items-center justify-center overflow-hidden">
                  {form.imageUrl ? (
                    <img src={form.imageUrl.startsWith('http')?form.imageUrl: API_BASE.replace(/\/$/,'') + (form.imageUrl.startsWith('/')?form.imageUrl:'/'+form.imageUrl)} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="text-center px-4 text-slate-400 text-xs leading-relaxed">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-60" />
                      Drop image (via Media Library) or paste URL below
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    {form.imageUrl && <button type="button" onClick={()=>setForm(f=>({...f,imageUrl:''}))} className="px-2 py-1 rounded-md text-[11px] font-medium bg-black/50 text-white backdrop-blur">Remove</button>}
                    <button type="button" onClick={()=>{ setShowMedia(true); loadMedia(); }} className="px-2 py-1 rounded-md text-[11px] font-medium bg-brand-600 text-white shadow">Browse</button>
                  </div>
                </div>
                <input value={form.imageUrl} onChange={e=>setForm(f=>({...f,imageUrl:e.target.value}))} placeholder="/uploads/library/.." className="mt-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center justify-between">Status
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${form.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300':'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>{form.status}</span>
                  </label>
                  <button type="button" onClick={()=>setForm(f=>({...f,status: f.status==='active'?'archived':'active'}))} className="w-full h-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                    Toggle to {form.status==='active'?'Archived':'Active'}
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Manual Sort Order (optional)</label>
                  <input type="number" value={form.sortOrder ?? ''} onChange={e=>setForm(f=>({...f,sortOrder: e.target.value===''?undefined:Number(e.target.value)}))} placeholder="Auto" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            {/* Middle & right columns */}
            <div className="lg:col-span-2 grid gap-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Name<span className="text-rose-500">*</span></label>
                  <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title / Role</label>
                  <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800 px-3 py-2" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 flex items-center justify-between">Short Bio <span className="text-[10px] font-medium text-slate-400">{shortCount} chars</span></label>
                  <textarea value={form.shortBio} onChange={e=>setForm(f=>({...f,shortBio:e.target.value}))} rows={expandFullBio?6:4} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800 px-3 py-2 text-sm resize-none" placeholder="Concise summary for card" />
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1 flex items-center justify-between">Full Bio <span className="text-[10px] font-medium text-slate-400">{fullCount} chars</span></label>
                  <div className="relative">
                    <textarea value={form.fullBio} onChange={e=>setForm(f=>({...f,fullBio:e.target.value}))} rows={expandFullBio?10:4} className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800 px-3 py-2 text-sm" placeholder="Detailed biography for modal" />
                    <button type="button" onClick={()=>setExpandFullBio(v=>!v)} className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600">
                      {expandFullBio ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {expandFullBio ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Linkedin className="h-3.5 w-3.5"/> LinkedIn</label>
                  <input value={form.linkedin} onChange={e=>setForm(f=>({...f,linkedin:e.target.value}))} placeholder="https://linkedin.com/in/..." className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Link2 className="h-3.5 w-3.5"/> Website</label>
                  <input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://..." className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1"><AtSign className="h-3.5 w-3.5"/> Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="name@company.com" className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_,i)=>(
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 p-4 flex gap-3">
              <div className="w-20 h-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {members.map(m => (
            <div key={m.id} draggable onDragStart={()=>onDragStart(m.id)} onDragOver={(e)=>onDragOver(e,m.id)} onDragEnd={onDragEnd} className={`group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white/80 to-slate-50/60 dark:from-slate-900/70 dark:to-slate-800/50 backdrop-blur p-4 flex flex-col transition-shadow ${draggingId===m.id?'ring-2 ring-brand-400 shadow-lg':'hover:shadow-md'}`}>
              <div className="flex items-start gap-3">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0 ring-1 ring-slate-300/60 dark:ring-slate-600">
                  {m.imageUrl ? <img src={m.imageUrl.startsWith('http')?m.imageUrl: API_BASE.replace(/\/$/,'') + (m.imageUrl.startsWith('/')?m.imageUrl:'/'+m.imageUrl)} alt={m.name} className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xl font-semibold">{m.name.split(/\s+/).map(p=>p[0]).slice(0,2).join('')}</span>}
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white leading-snug text-sm line-clamp-2" title={m.name}>{m.name}</h3>
                  <p className="text-[11px] uppercase tracking-wide text-brand-600 dark:text-brand-300 font-medium line-clamp-1">{m.title}</p>
                  <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-4 leading-relaxed">{m.shortBio || m.fullBio}</p>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={()=>startEdit(m)} className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-brand-600 hover:text-white" aria-label="Edit"><Edit className="h-4 w-4" /></button>
                  <button onClick={()=>del(m)} className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-rose-600 hover:text-white" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  <button type="button" onClick={()=>toggleStatus(m)} className={`p-1.5 rounded-md ${m.status==='active'?'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300':'bg-slate-300/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300'} hover:ring-1 ring-brand-400 text-[10px] font-semibold`}>{m.status==='active'?'On':'Off'}</button>
                  <div className="cursor-grab p-1.5 rounded-md bg-slate-200 dark:bg-slate-700" aria-label="Drag to reorder"><GripVertical className="h-4 w-4" /></div>
                </div>
              </div>
              <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shadow ${m.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-600/25 dark:text-emerald-300':'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>{m.status}</span>
            </div>
          ))}
        </div>
      )}

      {showMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowMedia(false)} />
          <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Select Image</h2>
              <button onClick={()=>setShowMedia(false)} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"><X className="h-4 w-4" /></button>
            </div>
            <div className="overflow-y-auto pr-1 grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {mediaLoading ? <div className="col-span-full text-center text-slate-500 py-10">Loading...</div> : mediaItems.filter(i=>i.type==='image').map(mi => (
                <button key={mi.url} type="button" onClick={()=>{ setForm(f=>({...f,imageUrl: mi.url})); setShowMedia(false); }} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <img src={mi.url} alt={mi.altText||''} className="w-full h-28 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition">Select</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLeadershipPage;
