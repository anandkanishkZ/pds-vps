import { useEffect, useState } from 'react';
import { toast as notify } from 'react-toastify';
import { auth, listProductCategories, createProductCategory, updateProductCategory, deleteProductCategory, type ProductCategory, listMedia, type MediaLibraryItem, API_BASE } from '../../lib/api';
import { FolderPlus, Loader2, Package, Plus, RefreshCcw, Tag, Image as ImageIcon, UploadCloud, X, GripVertical, Pencil, Search, Check, Trash2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../../components/Modal';

export default function AdminCategoriesPage(){
  const token = auth.getToken();
  const [loading,setLoading]=useState(false);
  const [cats,setCats]=useState<ProductCategory[]>([]);
  const [showCreate,setShowCreate]=useState(false);
  const [name,setName]=useState('');
  const [code,setCode]=useState('');
  const [creating,setCreating]=useState(false);
  const [uploadingId,setUploadingId]=useState<string|null>(null);
  const fileInputIdRef = useState(()=> `catImageInput_${Math.random().toString(36).slice(2)}`)[0];
  const [draggingId,setDraggingId]=useState<string|null>(null);
  const [showEditModal,setShowEditModal]=useState(false);
  const [editingCategory,setEditingCategory]=useState<ProductCategory|null>(null);
  const [editForm,setEditForm]=useState({ name:'', code:'', shortDescription:'', longDescription:'', heroImageUrl:'', status:'active', sortOrder:0, slug:'' });
  
  // Media library state
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<MediaLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<MediaLibraryItem | null>(null);
  
  // Slug editing state
  const [slugEditing, setSlugEditing] = useState(false);
  const [customSlug, setCustomSlug] = useState('');

  // Delete confirmation state
  const [categoryToDelete, setCategoryToDelete] = useState<ProductCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Computed values
  const filteredLibraryItems = libraryItems.filter(item =>
    (item.altText && item.altText.toLowerCase().includes(librarySearch.toLowerCase())) ||
    (item.type && item.type.toLowerCase().includes(librarySearch.toLowerCase())) ||
    (item.productName && item.productName.toLowerCase().includes(librarySearch.toLowerCase()))
  );

  async function uploadCategoryHero(file:File):Promise<string>{
    if(!token) throw new Error('Missing token');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/media/upload`, { method:'POST', headers:{ Authorization:`Bearer ${token}`}, body: form });
    if(!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.media?.url || '';
  }

  async function loadLibrary(q?: string) {
    if (!token) return;
    setLibraryLoading(true);
    try {
      const r = await listMedia(token, { q: q || undefined, pageSize: 60 });
      // Normalize relative URLs
      const base = API_BASE.replace(/\/$/, '');
      const items = r.data.map(m => ({
        ...m,
        url: m.url.startsWith('http') ? m.url : base + (m.url.startsWith('/') ? m.url : '/' + m.url)
      }));
      setLibraryItems(items);
      setSelectedLibraryItem(null);
    } catch (e) { 
      console.error(e);
      notify.error('Failed to load media library');
    } finally { 
      setLibraryLoading(false); 
    }
  }

  async function updateCategoryLocal(id:string, patch: Partial<ProductCategory>){
    try {
      if(!token) throw new Error('No token');
      const updated = await updateProductCategory(token, id, patch as any);
      setCats(prev => prev.map(c=> c.id===id ? { ...c, ...updated } : c));
    } catch(e){ console.error(e); notify.error('Update failed'); }
  }

  async function handleUploadHero(files: FileList | null, cat: ProductCategory){
    if(!files || !files[0]) return;
    const file = files[0];
    setUploadingId(cat.id);
    try {
      const url = await uploadCategoryHero(file);
      await updateCategoryLocal(cat.id, { heroImageUrl: url });
      notify.success('Image updated');
    } catch(e:any){ notify.error(e.message||'Upload failed'); }
    finally { setUploadingId(null); }
  }

  function startEdit(cat: ProductCategory){
    setEditingCategory(cat);
    setEditForm({
      name: cat.name,
      code: cat.code || '',
      shortDescription: cat.shortDescription || '',
      longDescription: cat.longDescription || '',
      heroImageUrl: cat.heroImageUrl || '',
      status: cat.status,
      sortOrder: cat.sortOrder,
      slug: cat.slug || ''
    });
    setCustomSlug(cat.slug || '');
    setSlugEditing(false);
    setShowEditModal(true);
  }

  async function handleEditSave(){
    if(!editingCategory || !token) return;
    setCreating(true);
    try {
      const updateData: any = {
        name: editForm.name.trim(),
        code: editForm.code.trim() || undefined,
        shortDescription: editForm.shortDescription.trim() || undefined,
        longDescription: editForm.longDescription.trim() || undefined,
        heroImageUrl: editForm.heroImageUrl || undefined,
        status: editForm.status as any,
        sortOrder: editForm.sortOrder
      };
      
      // Only include slug if it was manually edited
      if (slugEditing && customSlug.trim()) {
        updateData.slug = customSlug.trim();
      }
      
      const updated = await updateProductCategory(token, editingCategory.id, updateData);
      setCats(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...updated } : c));
      setShowEditModal(false);
      setEditingCategory(null);
      notify.success('Category updated successfully');
    } catch(e:any) {
      notify.error(e.message || 'Failed to update category');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteCategory(category: ProductCategory) {
    if (category.productCount && category.productCount > 0) {
      notify.warning(`Cannot delete. Category has ${category.productCount} product${category.productCount===1?'':'s'}.`);
      return;
    }
    if (!token) return;
    setDeleting(true);
    try {
      await deleteProductCategory(token, category.id);
      setCats(prev => prev.filter(c => c.id !== category.id));
      setCategoryToDelete(null);
      notify.success('Category deleted successfully');
    } catch (e: any) {
      notify.error(e.message || 'Failed to delete category');
    } finally {
      setDeleting(false);
    }
  }

  async function handleEditUploadHero(files: FileList | null){
    if(!files || !files[0]) return;
    const file = files[0];
    setUploadingId('edit-modal');
    try {
      const url = await uploadCategoryHero(file);
      setEditForm(prev => ({ ...prev, heroImageUrl: url }));
      notify.success('Image uploaded');
    } catch(e:any) {
      notify.error(e.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  }

  function handleDragStart(e: React.DragEvent, id: string){ setDraggingId(id); e.dataTransfer.effectAllowed='move'; }
  function handleDragOver(e: React.DragEvent, overId: string){ e.preventDefault(); if(draggingId===overId) return; }
  function handleDrop(e: React.DragEvent, overId: string){ e.preventDefault(); if(!draggingId || draggingId===overId) return; setCats(prev => {
      const arr=[...prev]; const from=arr.findIndex(c=>c.id===draggingId); const to=arr.findIndex(c=>c.id===overId); if(from<0||to<0) return prev; const [m]=arr.splice(from,1); arr.splice(to,0,m); // recompute sortOrder sequentially
      return arr.map((c,i)=> ({ ...c, sortOrder:i }));
    }); setDraggingId(null); }
  async function persistOrder(){ if(!token) return; const updates = cats.map(c=> ({ id:c.id, sortOrder:c.sortOrder })); for(const u of updates){ await updateCategoryLocal(u.id,{ sortOrder:u.sortOrder }); } notify.success('Order saved'); }

  useEffect(()=>{ if(!token) return; (async()=>{ setLoading(true); try { const c = await listProductCategories(token); setCats(c);} catch(e){ console.error(e);} finally { setLoading(false);} })(); },[token]);

  async function handleCreate(e:React.FormEvent){ e.preventDefault(); if(!token) return; setCreating(true); try { const cat = await createProductCategory(token,{ name: name.trim(), code: code.trim()||undefined }); setCats(c=>[...c,cat]); setName(''); setCode(''); setShowCreate(false); notify.success('Category created'); } catch(e:any){ notify.error(e.message||'Error'); } finally { setCreating(false);} }

  return (
    <div className="relative">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2"><Package className="h-6 w-6 text-brand-600"/> Categories</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and organize product categories. These power the public catalog structure.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-900"
          >
            Back to Products
          </Link>
          <button onClick={()=>setShowCreate(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-900"><FolderPlus className="h-4 w-4"/>New Category</button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur overflow-hidden shadow-sm">
  <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-brand-50 via-white to-brand-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/30">
              <Tag className="h-5 w-5 text-brand-600 dark:text-brand-300"/>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">All Categories</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{cats.length} categories • Drag to reorder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={()=>{ if(!token) return; setLoading(true); listProductCategories(token).then(c=> setCats(c)).finally(()=>setLoading(false)); }} 
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium bg-white/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-700/70 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCcw className="h-4 w-4"/>
              Refresh
            </button>
            <button 
              onClick={persistOrder} 
              disabled={loading || !!draggingId} 
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium disabled:opacity-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Save Order
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({length:6}).map((_,i)=>(
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
                      <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && cats.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {cats.map(c=> (
                <div 
                  key={c.id} 
                  draggable 
                  onDragStart={e=>handleDragStart(e,c.id)} 
                  onDragOver={e=>handleDragOver(e,c.id)} 
                  onDrop={e=>handleDrop(e,c.id)} 
                  className={`group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-md transition-colors duration-300 cursor-move relative ${draggingId===c.id?'opacity-60 outline outline-2 outline-brand-500/50':'opacity-100'}`}
                >
                  {/* Enhanced Category Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Enhanced Category Image */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        {c.heroImageUrl ? (
                          <img src={c.heroImageUrl} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={()=>{ const input = document.getElementById(fileInputIdRef+ c.id) as HTMLInputElement; input?.click(); }} 
                        className="absolute -top-2 -right-2 p-1.5 rounded-lg bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-500 hover:text-brand-600 dark:hover:text-brand-300 hover:border-brand-300 hover:bg-brand-50 shadow-md hover:shadow-lg text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        title="Upload image"
                      >
                        <UploadCloud className="w-3 h-3" />
                      </button>
                      <input id={fileInputIdRef + c.id} type="file" accept="image/*" className="hidden" onChange={e=> handleUploadHero(e.target.files, c)} />
                    </div>

                    {/* Enhanced Category Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors duration-300" title={c.name}>
                          {c.name}
                        </h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => startEdit(c)} 
                            className="p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 text-slate-500 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" 
                            title="Edit Category"
                          >
                            <Pencil className="w-4 h-4"/>
                          </button>
                          <button 
                            onClick={() => setCategoryToDelete(c)} 
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-500 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500" 
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                          <div className="p-2 text-slate-400 cursor-grab hover:text-brand-600 dark:hover:text-brand-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" title="Drag to reorder">
                            <GripVertical className="w-4 h-4"/>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-200 ${
                          c.status==='active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm'
                            : c.status==='coming_soon' 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {c.status.replace('_',' ')}
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">#{c.sortOrder}</span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                          {c.code || c.slug}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category Description */}
                  {c.shortDescription && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {c.shortDescription}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      {c.heroImageUrl && (
                        <button 
                          onClick={()=> updateCategoryLocal(c.id,{ heroImageUrl:null })} 
                          className="hover:text-red-500 transition-colors"
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => startEdit(c)}
                      className="text-xs font-medium text-brand-600 hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    >
                      Edit details →
                    </button>
                  </div>

                  {/* Upload Progress Overlay */}
                  {uploadingId===c.id && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 rounded-xl flex items-center justify-center">
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                        <Loader2 className="w-5 h-5 animate-spin text-brand-600"/>
                        <span>Uploading image...</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && cats.length===0 && (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">No categories yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">Get started by creating your first product category</p>
              <button 
                onClick={()=>setShowCreate(true)} 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Plus className="w-5 h-5"/>
                Create Category
              </button>
            </div>
          )}

          {/* Add Category Button (when categories exist) */}
          {!loading && cats.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button 
                onClick={()=>setShowCreate(true)} 
                className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-brand-600 hover:border-brand-400 dark:hover:text-brand-300 dark:hover:border-brand-500 text-sm font-medium inline-flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Plus className="w-5 h-5"/>
                Add New Category
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>setShowCreate(false)} />
          <form onSubmit={handleCreate} className="relative w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-6 space-y-5" style={{ position: 'relative', zIndex: 10000 }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2"><FolderPlus className="h-5 w-5 text-brand-600"/>New Category</h3>
              <button type="button" onClick={()=>setShowCreate(false)} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"><X className="w-4 h-4"/></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-900/60 text-sm focus:ring-2 focus:ring-brand-500 outline-none"/>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Code</label>
                <input value={code} onChange={e=>setCode(e.target.value)} className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-900/60 text-sm focus:ring-2 focus:ring-brand-500 outline-none"/>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={()=>setShowCreate(false)} className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800">Cancel</button>
              <button disabled={!name.trim()||creating} className="px-5 py-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow disabled:opacity-50 inline-flex items-center gap-2">{creating && <Loader2 className="h-4 w-4 animate-spin"/>}Create</button>
            </div>
          </form>
        </div>
      )}

      {/* WordPress-Style Category Edit Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg bg-white dark:bg-slate-900 shadow-2xl flex flex-col" style={{ position: 'relative', zIndex: 10000 }}>
            
            {/* WordPress-Style Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-medium text-slate-800 dark:text-slate-100">Edit Category</h1>
                <span className="text-sm text-slate-500 dark:text-slate-400">•</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{editingCategory.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={!editForm.name.trim() || creating}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-400 text-white text-sm font-medium rounded disabled:opacity-50 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setCategoryToDelete(editingCategory);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-all flex items-center gap-2"
                  title="Delete Category"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button onClick={() => setShowEditModal(false)} className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* WordPress-Style Main Content */}
            <div className="flex-1 overflow-hidden flex">
              
              {/* Left Column - Main Content */}
              <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
                <div className="p-6 space-y-6">
                  
                  {/* Title Section */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
                    <div className="space-y-3">
                      <input
                        value={editForm.name}
                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="w-full text-2xl font-medium bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                        placeholder="Category name"
                      />
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span>Permalink:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">/</span>
                          {slugEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={customSlug}
                                onChange={e => setCustomSlug(e.target.value)}
                                className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                                placeholder="category-slug"
                              />
                              <button
                                onClick={() => setSlugEditing(false)}
                                className="px-2 py-1 text-xs bg-brand-600 text-white rounded hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => {
                                  setCustomSlug(editForm.slug);
                                  setSlugEditing(false);
                                }}
                                className="px-2 py-1 text-xs border border-slate-300 text-slate-600 rounded hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-mono">{customSlug || editForm.slug}</span>
                              <button
                                onClick={() => setSlugEditing(true)}
                                className="text-xs text-brand-600 hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Short Description */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Short Description</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Brief description shown in listings</p>
                      <textarea
                        value={editForm.shortDescription}
                        onChange={e => setEditForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Brief description for category cards and previews..."
                      />
                    </div>
                  </div>

                  {/* Long Description */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">Detailed Description</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Full category description for detail pages</p>
                      <textarea
                        value={editForm.longDescription}
                        onChange={e => setEditForm(prev => ({ ...prev, longDescription: e.target.value }))}
                        rows={8}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Detailed description for category pages and SEO..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Meta Information */}
              <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-y-auto">
                <div className="p-6 space-y-6">
                  
                  {/* Featured Image */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-800 dark:text-slate-100">Featured Image</h4>
                        {editForm.heroImageUrl && (
                          <button
                            type="button"
                            onClick={() => setEditForm(prev => ({ ...prev, heroImageUrl: '' }))}
                            className="text-xs text-red-600 hover:text-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      {editForm.heroImageUrl ? (
                        <div className="relative group">
                          <img 
                            src={editForm.heroImageUrl} 
                            alt="Featured" 
                            className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-600" 
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => { setLibraryOpen(true); if(libraryItems.length===0) loadLibrary(); }}
                                className="px-2 py-1 bg-white/90 dark:bg-slate-900/90 text-brand-700 dark:text-brand-300 rounded text-xs font-medium flex items-center gap-1 shadow-lg transition-all"
                              >
                                <ImageIcon className="w-3 h-3" />
                                Library
                              </button>
                              <button
                                type="button"
                                onClick={() => document.getElementById('edit-hero-input')?.click()}
                                className="px-2 py-1 bg-white/90 dark:bg-slate-900/90 text-brand-700 dark:text-brand-300 rounded text-xs font-medium flex items-center gap-1 shadow-lg transition-all"
                              >
                                <UploadCloud className="w-3 h-3" />
                                Upload
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-500">
                          <UploadCloud className="w-6 h-6" />
                          <div className="text-center">
                            <p className="text-xs font-medium">Set featured image</p>
                            <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setLibraryOpen(true); if(libraryItems.length===0) loadLibrary(); }}
                          className="px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <ImageIcon className="w-3 h-3" />
                          Library
                        </button>
                        <button
                          type="button"
                          onClick={() => document.getElementById('edit-hero-input')?.click()}
                          className="px-2 py-1.5 text-xs bg-brand-600 hover:bg-brand-500 text-white rounded transition-colors flex items-center justify-center gap-1"
                        >
                          <UploadCloud className="w-3 h-3" />
                          Upload
                        </button>
                      </div>
                      
                      {uploadingId === 'edit-modal' && (
                        <div className="flex items-center gap-2 text-brand-600">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">Uploading...</span>
                        </div>
                      )}
                      
                      <input
                        id="edit-hero-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => handleEditUploadHero(e.target.files)}
                      />
                    </div>
                  </div>

                  {/* Publish Box */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-3">Status</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Visibility</label>
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="coming_soon">Coming Soon</option>
                        </select>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">Status:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            editForm.status === 'active' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : editForm.status === 'coming_soon'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}>
                            {editForm.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category Attributes */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-3">Category Attributes</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Code</label>
                        <input
                          value={editForm.code}
                          onChange={e => setEditForm(prev => ({ ...prev, code: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                          placeholder="Optional code"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Sort Order</label>
                        <input
                          type="number"
                          value={editForm.sortOrder}
                          onChange={e => setEditForm(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleEditSave}
                        disabled={!editForm.name.trim() || creating}
                        className="w-full px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-400 text-white text-sm font-medium rounded disabled:opacity-50 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                        Update Category
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => editingCategory.productCount && editingCategory.productCount>0 ? notify.warning(`Cannot delete. ${editingCategory.productCount} product${editingCategory.productCount===1?'':'s'} linked.`) : setCategoryToDelete(editingCategory)}
                        disabled={!!(editingCategory.productCount && editingCategory.productCount>0)}
                        title={editingCategory.productCount && editingCategory.productCount>0 ? `Cannot delete: ${editingCategory.productCount} product${editingCategory.productCount===1?'':'s'} present` : 'Delete Category'}
                        className="w-full px-4 py-2.5 bg-red-50 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 dark:disabled:bg-slate-700/40 dark:disabled:text-slate-500 border border-red-200 dark:border-red-800 disabled:border-slate-300 dark:disabled:border-slate-600 text-sm font-medium rounded transition-colors flex items-center justify-center gap-2 group"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Delete Category
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      <Modal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title="Media Library"
        size="xl"
      >
        <div className="flex h-[70vh]">
          {/* Media Grid */}
          <div className="flex-1 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search media files..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Media Grid Content */}
            <div className="flex-1 overflow-auto p-4">
              {libraryLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                  <span className="ml-2 text-slate-600 dark:text-slate-400">Loading media...</span>
                </div>
              ) : filteredLibraryItems.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {librarySearch ? 'No media files found matching your search.' : 'No media files available.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {filteredLibraryItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedLibraryItem(item)}
                      className={`group relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedLibraryItem?.id === item.id
                          ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-800'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={item.url}
                        alt={item.altText || 'Media file'}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                      {selectedLibraryItem?.id === item.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedLibraryItem && (
            <div className="w-80 border-l border-slate-200 dark:border-slate-700 flex flex-col">
              {/* Preview */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                  <img
                    src={selectedLibraryItem.url}
                    alt={selectedLibraryItem.altText || 'Media file'}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 p-4 space-y-3 text-sm">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">
                    Alt Text
                  </label>
                  <p className="text-slate-900 dark:text-slate-100 break-all">
                    {selectedLibraryItem.altText || 'No alt text'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">
                    File Type
                  </label>
                  <p className="text-slate-900 dark:text-slate-100">
                    {selectedLibraryItem.mime || selectedLibraryItem.type || 'Unknown'}
                  </p>
                </div>
                
                {selectedLibraryItem.size && (
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">
                      File Size
                    </label>
                    <p className="text-slate-900 dark:text-slate-100">
                      {(selectedLibraryItem.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}
                
                {selectedLibraryItem.createdAt && (
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">
                      Uploaded
                    </label>
                    <p className="text-slate-900 dark:text-slate-100">
                      {new Date(selectedLibraryItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setEditForm(prev => ({ ...prev, heroImageUrl: selectedLibraryItem.url }));
                      setLibraryOpen(false);
                      setSelectedLibraryItem(null);
                    }}
                    className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-500 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    Select Image
                  </button>
                  <button
                    onClick={() => {
                      setLibraryOpen(false);
                      setSelectedLibraryItem(null);
                    }}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!categoryToDelete}
        onClose={() => !deleting && setCategoryToDelete(null)}
        title="Delete Category"
        size="md"
        icon={<div className="flex items-center justify-center h-6 w-6"><AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400"/></div>}
        actions={categoryToDelete && (
          <>
            <button
              onClick={() => setCategoryToDelete(null)}
              disabled={deleting}
              className="px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => categoryToDelete && handleDeleteCategory(categoryToDelete)}
              disabled={deleting}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center gap-2 shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        )}
      >
        {categoryToDelete && (
          <div className="space-y-5">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              This will permanently remove the category
              <span className="mx-1 font-semibold text-slate-900 dark:text-white">{categoryToDelete.name}</span>
              and its metadata. Products linked to this category will prevent deletion. Reassign or remove those products first.
            </p>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60">
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                {categoryToDelete.heroImageUrl ? (
                  <img src={categoryToDelete.heroImageUrl} alt={categoryToDelete.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" title={categoryToDelete.name}>{categoryToDelete.name}</div>
                <div className="text-xs mt-0.5 text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded inline-block">
                  {categoryToDelete.code || categoryToDelete.slug}
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-amber-300/60 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-900/30 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                Deletion is blocked if any product references this category. You will see an error toast if that occurs.
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
              This action cannot be undone.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


