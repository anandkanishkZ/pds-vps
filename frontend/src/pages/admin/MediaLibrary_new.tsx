import { useEffect, useMemo, useRef, useState } from 'react';
import { auth, listMedia, deleteProductMedia, uploadProductMedia, listCategoryProducts, listProductCategories, API_BASE, type ProductListItem, type ProductCategory } from '../../lib/api';
import { FileText, Search, RefreshCcw, Trash2, UploadCloud, X, Check, Filter, Package, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// A professional WordPress‑style media library (grid + details panel + bulk selection)
// NOTE: Backend lacks a global media listing endpoint; we aggregate via products (see api helper).

interface MediaItem { id:string; type:string; url:string; altText?:string; productId:string; productName:string; createdAt?:string; size?:number; mime?:string }

type ViewMode = 'grid'|'list';

export default function MediaLibrary(){
  const token = auth.getToken();
  const [loading,setLoading]=useState(true);
  const [media,setMedia]=useState<MediaItem[]>([]);
  const [view,setView]=useState<ViewMode>('grid');
  const [q,setQ]=useState('');
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [detail,setDetail]=useState<MediaItem|null>(null);
  const [detailIndex,setDetailIndex]=useState<number>(-1);
  const [categories,setCategories]=useState<ProductCategory[]>([]);
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const [uploading,setUploading]=useState(false);
  const [targetProduct,setTargetProduct]=useState<ProductListItem|null>(null);
  const [productSearch,setProductSearch]=useState('');
  const [productResults,setProductResults]=useState<ProductListItem[]>([]);
  const [productSearchLoading,setProductSearchLoading]=useState(false);
  const [flash,setFlash]=useState<string|null>(null);

  function toast(msg:string){ setFlash(msg); setTimeout(()=>setFlash(null),2500); }

  function mapItems(list:any[]): MediaItem[]{
    return list.map(i=>{
      let type = i.type as string | null;
      if(!type){
        const mime = i.mime || '';
        if(mime.startsWith?.('image/')) type='image';
        else {
          const ext = (i.ext || (i.url.split('.').pop()||'')).toLowerCase();
          if(['jpg','jpeg','png','gif','webp','svg'].includes(ext)) type='image';
          else if(ext==='pdf') type='brochure';
          else type='file';
        }
      }
      const absUrl = i.url?.startsWith('/') ? API_BASE.replace(/\/$/, '') + i.url : i.url;
      return { id: i.id||i.url, type: type||'file', url: absUrl, altText: i.altText||undefined, productId: i.productId||'', productName: i.productName|| (i.url.split('/').pop()||''), createdAt: i.createdAt, size: i.size, mime: i.mime||undefined };
    });
  }

  // Initial load
  useEffect(()=>{ if(!token) return; (async()=>{ setLoading(true); try { const cats = await listProductCategories(token); setCategories(cats); const lib = await listMedia(token, { page:1, pageSize:500 }); setMedia(mapItems(lib.data)); } catch(e){ console.error(e);} finally { setLoading(false);} })(); },[token]);

  // Product search (simple: search across first matched category products slug/name)
  useEffect(()=>{ if(!token || productSearch.trim().length<2){ setProductResults([]); return;} (async()=>{ setProductSearchLoading(true); try { const out: ProductListItem[]=[]; for(const c of categories){ const page = await listCategoryProducts(token,c.slug,1,25).catch(()=>({data:[]})); page.data.forEach(p=>{ if(p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.slug.includes(productSearch)) out.push(p); }); if(out.length>50) break; } setProductResults(out); } finally { setProductSearchLoading(false);} })(); },[productSearch, token, categories]);

  const filtered = useMemo(()=> media.filter(m=>{ if(q && !(m.productName.toLowerCase().includes(q.toLowerCase()) || (m.altText||'').toLowerCase().includes(q.toLowerCase()))) return false; return true; }),[media,q]);

  function toggleSelect(id:string){ setSelected(s=> { const n=new Set(s); n.has(id)? n.delete(id): n.add(id); return n; }); }
  function clearSelection(){ setSelected(new Set()); }

  async function bulkDelete(){ if(!token||selected.size===0) return; if(!confirm(`Delete ${selected.size} media item(s)?`)) return; const ids=[...selected]; for(const id of ids){ try { await deleteProductMedia(token,id); setMedia(ms=> ms.filter(x=> x.id!==id)); } catch(e){ console.error(e);} } clearSelection(); toast('Deleted'); }

  async function handleUpload(files: FileList| null){ if(!token||!targetProduct||!files||!files.length) return; setUploading(true); try { for(const f of Array.from(files)){ const type = f.type.startsWith('image/')? 'image':'brochure'; await uploadProductMedia(token, targetProduct.id, f, type); } const lib = await listMedia(token, { page:1, pageSize:500 }); setMedia(mapItems(lib.data)); toast('Uploaded'); } catch(e:any){ toast(e.message||'Upload failed'); } finally { setUploading(false);} }

  return (
    <div className="relative">
      {flash && <div className="fixed top-4 right-4 z-50 bg-brand-600 text-white px-4 py-2 rounded-lg shadow text-sm">{flash}</div>}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">Media Library <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-600/10 text-brand-700 dark:text-brand-300">Beta</span></h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage all uploaded product assets centrally.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm">
            <input value={productSearch} onChange={e=>setProductSearch(e.target.value)} placeholder="Attach to product..." className="px-2 py-1 bg-transparent outline-none text-sm placeholder:text-slate-400 w-40" />
            {productSearchLoading && <span className="text-[10px] text-slate-400">...</span>}
          </div>
          <button disabled={!targetProduct} onClick={()=> fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-40"><UploadCloud className="h-4 w-4"/>{uploading? 'Uploading':'Upload'}</button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e=> handleUpload(e.target.files)} />
          {selected.size>0 && <button onClick={bulkDelete} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"><Trash2 className="h-4 w-4"/>Delete ({selected.size})</button>}
          <button onClick={async()=>{ if(!token) return; setLoading(true); const lib= await listMedia(token, { page:1, pageSize:500 }); setMedia(mapItems(lib.data)); setLoading(false); toast('Refreshed'); }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCcw className="h-3.5 w-3.5"/>Refresh</button>
        </div>
      </div>

      {/* Product attach results dropdown */}
      {productSearch && productResults.length>0 && (
        <div className="absolute z-40 mt-1 w-72 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-2">
          {productResults.map(p=> (
            <button key={p.id} onClick={()=>{ setTargetProduct(p); setProductSearch(p.name); }} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800">
              <Package className="h-4 w-4 text-slate-500"/>
              <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search media..." className="pl-9 pr-3 py-2 w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500"><Filter className="h-3.5 w-3.5"/>Items: <span className="text-slate-700 dark:text-slate-200">{filtered.length}</span></div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button onClick={()=>setView('grid')} className={`px-3 py-1.5 rounded-md border text-xs font-medium ${view==='grid'?'bg-brand-600 text-white border-brand-600':'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>Grid</button>
          <button onClick={()=>setView('list')} className={`px-3 py-1.5 rounded-md border text-xs font-medium ${view==='list'?'bg-brand-600 text-white border-brand-600':'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>List</button>
        </div>
      </div>

      {/* Library */}
      {loading && <div className="text-sm text-slate-500 flex items-center gap-2"><RefreshCcw className="h-4 w-4 animate-spin"/>Loading media...</div>}
      {!loading && filtered.length===0 && <div className="text-sm text-slate-500">No media found.</div>}

      {view==='grid' && (
        <div className="grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filtered.map(item=> (
            <div key={item.id} className={`group relative rounded-xl border p-2 flex flex-col gap-2 cursor-pointer overflow-hidden ${selected.has(item.id)?'border-brand-600 ring-2 ring-brand-600/30':'border-slate-200 dark:border-slate-800 hover:border-brand-500/50'}`} onClick={()=>{ toggleSelect(item.id); setDetail(item); setDetailIndex(filtered.findIndex(f=>f.id===item.id)); }}>
              <div className="relative aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {item.type==='image' ? <img src={item.url} className="object-cover w-full h-full"/> : <FileText className="h-8 w-8 text-slate-400"/>}
                {selected.has(item.id) && <span className="absolute top-1 left-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white text-[11px] font-semibold"><Check className="h-3 w-3"/></span>}
              </div>
              <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate" title={item.productName}>{item.productName}</div>
              <div className="flex items-center justify-between text-[10px] text-slate-500"><span>{item.type}</span><span>{item.mime?.split('/')[1]||''}</span></div>
            </div>
          ))}
        </div>
      )}

      {view==='list' && (
        <div className="overflow-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs">
              <tr>
                <th className="text-left px-3 py-2 w-10"></th>
                <th className="text-left px-3 py-2">Preview</th>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">MIME</th>
                <th className="text-left px-3 py-2">Size</th>
                <th className="text-left px-3 py-2">Created</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map(item=> (
                <tr key={item.id} className={selected.has(item.id)?'bg-brand-50/50 dark:bg-brand-900/20':''} onClick={()=>{ setDetail(item); setDetailIndex(filtered.findIndex(f=>f.id===item.id)); }}>
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.has(item.id)} onChange={()=>toggleSelect(item.id)} /></td>
                  <td className="px-3 py-2">
                    <div className="h-12 w-12 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      {item.type==='image'? <img src={item.url} className="object-cover h-full w-full"/> : <FileText className="h-5 w-5 text-slate-400"/>}
                    </div>
                  </td>
                  <td className="px-3 py-2 max-w-[200px] truncate font-medium text-slate-700 dark:text-slate-200">{item.productName}</td>
                  <td className="px-3 py-2 text-xs">{item.type}</td>
                  <td className="px-3 py-2 text-xs">{item.mime}</td>
                  <td className="px-3 py-2 text-xs">{item.size ? (item.size/1024).toFixed(1)+' KB':''}</td>
                  <td className="px-3 py-2 text-xs whitespace-nowrap">{item.createdAt ? new Date(item.createdAt).toLocaleDateString():''}</td>
                  <td className="px-3 py-2 text-xs">
                    <button onClick={()=>{ setDetail(item); }} className="px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal (WordPress-style) */}
      {detail && (
        <WordPressStyleMediaModal
          item={detail}
          index={detailIndex}
          total={filtered.length}
          onNavigate={(dir)=>{
            setDetailIndex(i=>{
              let next = dir==='next'? i+1 : i-1;
              if (next<0) next = filtered.length-1; else if (next>=filtered.length) next=0;
              const newItem = filtered[next];
              setDetail(newItem);
              return next;
            });
          }}
          onClose={()=>{ setDetail(null); setDetailIndex(-1); }}
          onDelete={async(id)=>{ if(!token) return; try { await deleteProductMedia(token, id); setMedia(m=> m.filter(x=> x.id!==id)); setDetail(null); setDetailIndex(-1); toast('Deleted'); } catch { toast('Error'); } }}
          onAltChange={(v)=> setDetail(d=> d?{...d, altText:v}:d)}
        />
      )}
    </div>
  );
}

// ---------------- WordPress-Style Media Detail Modal -----------------
function WordPressStyleMediaModal({ item, onClose, onDelete, onAltChange, index, total, onNavigate }:{ item: MediaItem; onClose:()=>void; onDelete:(id:string)=>void; onAltChange:(val:string)=>void; index:number; total:number; onNavigate:(dir:'prev'|'next')=>void }) {
  const [zoom, setZoom] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [altText, setAltText] = useState(item.altText || '');
  const [showCopiedFeedback, setShowCopiedFeedback] = useState(false);

  // Enhanced keyboard navigation with WordPress shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for our handled keys
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onNavigate('prev');
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNavigate('next');
          break;
        case '=':
        case '+':
          if (item.type === 'image') {
            e.preventDefault();
            adjustZoom(0.25);
          }
          break;
        case '-':
          if (item.type === 'image') {
            e.preventDefault();
            adjustZoom(-0.25);
          }
          break;
        case '0':
          if (item.type === 'image') {
            e.preventDefault();
            setZoom(1);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [item.type, onClose, onNavigate]);

  // Debounced alt text change
  useEffect(() => {
    const timer = setTimeout(() => {
      onAltChange(altText);
    }, 500);
    return () => clearTimeout(timer);
  }, [altText, onAltChange]);

  function adjustZoom(delta: number) {
    setZoom(z => Math.min(3, Math.max(0.1, parseFloat((z + delta).toFixed(2)))));
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(item.url);
      setShowCopiedFeedback(true);
      setTimeout(() => setShowCopiedFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    
    if (!confirm('Are you sure you want to delete this media item? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(item.id);
    } catch (err) {
      console.error('Delete failed:', err);
      setIsDeleting(false);
    }
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      {/* Enhanced backdrop with smooth transition */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main modal container - WordPress style */}
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-7xl h-full max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          
          {/* Header bar - WordPress inspired */}
          <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Media Details
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span>{index + 1} of {total}</span>
                <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-medium">
                  {item.type || 'file'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Navigation arrows */}
              <button
                onClick={() => onNavigate('prev')}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                aria-label="Previous media (Left Arrow)"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => onNavigate('next')}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                aria-label="Next media (Right Arrow)"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                aria-label="Close (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex h-full">
            {/* Media preview area */}
            <div className="flex-1 relative bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden">
              {item.type === 'image' ? (
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  {/* Zoom controls overlay */}
                  {zoom !== 1 && (
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/70 text-white px-3 py-2 rounded-lg text-sm font-medium">
                      <span>{Math.round(zoom * 100)}%</span>
                    </div>
                  )}
                  
                  {/* Image container with zoom */}
                  <div className="max-w-full max-h-full overflow-auto">
                    <img
                      src={item.url}
                      alt={item.altText || item.productName}
                      style={{ 
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.2s ease-out'
                      }}
                      className="max-w-full max-h-full object-contain"
                      draggable={false}
                    />
                  </div>

                  {/* Zoom controls */}
                  {item.type === 'image' && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/70 text-white px-3 py-2 rounded-lg">
                      <button
                        onClick={() => adjustZoom(-0.25)}
                        disabled={zoom <= 0.1}
                        className="p-1 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Zoom out (-)"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </button>
                      <span className="text-xs px-2 min-w-[3rem] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={() => adjustZoom(0.25)}
                        disabled={zoom >= 3}
                        className="p-1 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Zoom in (+)"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                      <div className="w-px h-4 bg-white/30 mx-1"></div>
                      <button
                        onClick={() => setZoom(1)}
                        className="p-1 px-2 rounded hover:bg-white/20 text-xs"
                        aria-label="Reset zoom (0)"
                      >
                        Reset
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 p-8 text-slate-400">
                  <div className="p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                    <FileText className="h-16 w-16" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                      Preview not available
                    </p>
                    <p className="text-sm">
                      {item.mime || 'Unknown file type'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - WordPress style */}
            <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col">
              {/* File info section */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                  Attachment Details
                </h3>
                
                <div className="space-y-4">
                  {/* Filename */}
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Filename
                    </label>
                    <p className="mt-1 text-sm text-slate-900 dark:text-white font-medium break-all">
                      {item.productName || 'Untitled'}
                    </p>
                  </div>

                  {/* File details grid */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">File type</span>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {item.mime || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">File size</span>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {formatFileSize(item.size)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 dark:text-slate-400">Uploaded on</span>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 dark:text-slate-400">Product</span>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {item.productName || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alt text section */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Alternative Text
                </label>
                <textarea
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the purpose of the image..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Alternative text describes the image for screen readers and appears when the image fails to load.
                </p>
              </div>

              {/* Actions section */}
              <div className="flex-1 p-6 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Actions
                </h3>
                
                <div className="space-y-3">
                  {/* Copy URL */}
                  <button
                    onClick={handleCopyUrl}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {showCopiedFeedback ? 'Copied!' : 'Copy URL'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Copy the file URL to clipboard
                      </p>
                    </div>
                  </button>

                  {/* View full size */}
                  {item.type === 'image' && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-3 text-left bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <div className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          View full size
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Open in new tab
                        </p>
                      </div>
                    </a>
                  )}

                  {/* Delete */}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded">
                      <Trash2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        {isDeleting ? 'Deleting...' : 'Delete permanently'}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        This action cannot be undone
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Keyboard shortcuts hint */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Shortcuts:</span> Esc (close) • ← → (navigate) • + - (zoom) • 0 (reset)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
