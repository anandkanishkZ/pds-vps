import { useEffect, useMemo, useRef, useState } from 'react';
import { auth, listMedia, deleteProductMedia, directMediaUploadWithProgress, API_BASE } from '../../lib/api';
import { 
  FolderOpen, Trash2, Download, Copy,
  Image, FileText, File, RefreshCw, Search,
  Grid, List, X, Edit, UploadCloud,
  Eye, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut
} from 'lucide-react';


// A professional WordPress‑style media library (grid + details panel + bulk selection)
// NOTE: Backend lacks a global media listing endpoint; we aggregate via products (see api helper).

interface MediaItem { id:string; type:string; url:string; altText?:string; productId:string; productName:string; createdAt?:string; size?:number; mime?:string }

type ViewMode = 'grid'|'list';

const MediaManagementComponent = () => {
  const token = auth.getToken();
  const [loading, setLoading] = useState(true);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [groupedMedia, setGroupedMedia] = useState<{[key: string]: MediaItem[]}>({});
  // Infinite scroll pagination state
  const PAGE_SIZE = 60;
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState<ViewMode>('grid');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<MediaItem | null>(null);
  const [detailIndex, setDetailIndex] = useState<number>(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  // Removed product attachment states
  const [flash, setFlash] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, totalSize: '0 Bytes' });
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current:number; total:number; fileName:string; fraction:number } | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  function toast(msg: string) { 
    setFlash(msg); 
    setTimeout(() => setFlash(null), 2500); 
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '0 Bytes';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function mapItems(list: any[]): MediaItem[] {
    return list.map(i => {
      let type = i.type as string | null;
      if (!type) {
        const mime = i.mime || '';
        if (mime.startsWith?.('image/')) type = 'image';
        else {
          const ext = (i.ext || (i.url.split('.').pop() || '')).toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) type = 'image';
          else if (ext === 'pdf') type = 'brochure';
          else type = 'file';
        }
      }
      const absUrl = i.url?.startsWith('/') ? API_BASE.replace(/\/$/, '') + i.url : i.url;
      return { 
        id: i.id || i.url, 
        type: type || 'file', 
        url: absUrl, 
        altText: i.altText || undefined, 
        productId: i.productId || '', 
        productName: i.productName || (i.url.split('/').pop() || ''), 
        createdAt: i.createdAt, 
        size: i.size, 
        mime: i.mime || undefined 
      };
    });
  }

  // Group media by folder/category
  function groupMediaByFolder(mediaList: MediaItem[]) {
    const grouped: {[key: string]: MediaItem[]} = {};
    
    mediaList.forEach(item => {
      // Extract folder from URL or use product category
      const urlParts = item.url.split('/');
      let folder = 'root';
      
      if (urlParts.length > 2) {
        // Try to get meaningful folder name from URL path
        const pathIndex = urlParts.findIndex(part => part === 'uploads');
        if (pathIndex !== -1 && pathIndex + 1 < urlParts.length) {
          folder = urlParts[pathIndex + 1] || 'root';
        }
      }
      
      if (!grouped[folder]) {
        grouped[folder] = [];
      }
      grouped[folder].push(item);
    });
    
    return grouped;
  }

  // Fetch media on component mount
  // (Replaced by paginated loader)

  const filtered = useMemo(() => 
    media.filter(m => {
      if (q && !(m.productName.toLowerCase().includes(q.toLowerCase()) || (m.altText || '').toLowerCase().includes(q.toLowerCase()))) {
        return false;
      }
      return true;
    }), [media, q]
  );

  // Get current folder's media files
  const currentFolderMedia = currentFolder === 'all' 
    ? filtered 
    : groupedMedia[currentFolder] || [];

  function toggleSelect(id: string) {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  // Handle folder change
  const handleFolderChange = (folderName: string) => {
    setCurrentFolder(folderName);
    setDetail(null);
    setIsModalOpen(false);
  };

  // Handle file selection
  const handleFileSelect = (file: MediaItem) => {
    setDetail(file);
    setDetailIndex(currentFolderMedia.findIndex(f => f.id === file.id));
    setIsModalOpen(true);
  };

  // Copy file URL to clipboard
  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast('URL copied to clipboard');
    } catch (err) {
      toast('Failed to copy URL to clipboard');
    }
  };

  async function bulkDelete() {
    if (!token || selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} media item(s)?`)) return;
    
    const ids = [...selected];
    for (const id of ids) {
      try {
        await deleteProductMedia(token, id);
        setMedia(ms => ms.filter(x => x.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
    clearSelection();
    toast('Deleted');
  }

  async function loadPage(nextPage: number, append: boolean) {
    if (!token) return;
    if (!append) { setLoading(true); setError(null); } else { setLoadingMore(true); }
    try {
      const lib = await listMedia(token, { page: nextPage, pageSize: PAGE_SIZE, sort: '-createdAt', q: q || undefined });
      const mapped = mapItems(lib.data);
      setHasMore(nextPage < lib.pagination.pages);
      setPage(nextPage);
      setMedia(prev => {
        const newArr = append ? [...prev, ...mapped] : mapped;
        // derive grouped + stats from newArr to avoid stale closure
        setGroupedMedia(groupMediaByFolder(newArr));
        const totalSize = newArr.reduce((acc,i)=> acc + (i.size||0),0);
        setStats({ total: newArr.length, totalSize: formatFileSize(totalSize) });
        return newArr;
      });
    } catch(e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch media';
      setError(msg); toast(msg);
    } finally {
      setLoading(false); setLoadingMore(false);
    }
  }

  useEffect(()=> { if(!token) return; const h = setTimeout(()=> loadPage(1,false), 250); return ()=> clearTimeout(h); }, [token,q]);
  useEffect(()=> { if(!sentinelRef.current) return; const el = sentinelRef.current; const obs = new IntersectionObserver(es=>{ const f=es[0]; if(f.isIntersecting && hasMore && !loadingMore && !loading){ loadPage(page+1,true);} }, { root:null, rootMargin:'300px', threshold:0 }); obs.observe(el); return ()=> obs.disconnect(); }, [sentinelRef.current, hasMore, loadingMore, loading, page]);
  function reloadAll(){ loadPage(1,false); }

  // Product search (simple: search across first matched category products slug/name)
  // (Removed product search effect)

  // Delete media file
  const handleDeleteMedia = async (filepath: string) => {
    if (!token || !window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteProductMedia(token, filepath);
      
  const lib = await listMedia(token, { page: 1, pageSize: 500, sort: '-createdAt' });
      const mappedMedia = mapItems(lib.data);
      setMedia(mappedMedia);
      setGroupedMedia(groupMediaByFolder(mappedMedia));
      
      if (detail?.id === filepath) {
        setDetail(null);
        setIsModalOpen(false);
      }
      
      toast('File deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      toast(errorMessage);
    }
  };

  // Refresh media list
  const fetchMedia = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      reloadAll();
      toast('Refreshed');
    } finally {
      setLoading(false);
    }
  };

  // Handle direct uploads with progress + optimistic update
  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !token) return;
    const files = Array.from(fileList);
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length, fileName: '', fraction: 0 });
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        setUploadProgress(p => p ? { ...p, current: i + 1, fileName: f.name, fraction: i / files.length } : null);
        try {
          const uploaded = await directMediaUploadWithProgress(token, f, {}, (frac) => {
            setUploadProgress(p => p ? { ...p, fileName: f.name, fraction: (i + frac) / files.length } : null);
          });
          // Map single item to our MediaItem shape
          const mapped = mapItems([uploaded]);
          setMedia(prev => {
            // Insert at front (newest first) then recompute grouped + stats
            const newArr = [...mapped, ...prev];
            setGroupedMedia(groupMediaByFolder(newArr));
            const totalSize = newArr.reduce((acc,i)=> acc + (i.size||0),0);
            setStats({ total: newArr.length, totalSize: formatFileSize(totalSize) });
            return newArr;
          });
        } catch (err) {
          console.error('Upload failed for', f.name, err);
          toast(`Failed: ${f.name}`);
        }
      }
      // finish progress bar
      setUploadProgress(p => p ? { ...p, fraction: 1 } : null);
      setTimeout(()=> setUploadProgress(null), 800);
    } finally {
      setUploading(false);
      // Ensure server pagination sync (in case server adds metadata not in upload response)
      reloadAll();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Determine file icon based on type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="w-5 h-5" />;
      case 'brochure':
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {flash && (
        <div className="fixed top-4 right-4 z-50 bg-brand-600 text-white px-4 py-2 rounded-lg shadow text-sm">
          {flash}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <FolderOpen className="w-5 h-5 mr-2" />
        Media Management
      </h3>
      
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchMedia} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Refresh media list"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search files..." 
              className="pl-9 pr-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            <button 
              onClick={() => setView('grid')}
              className={`p-2 ${view === 'grid' ? 'bg-red-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-2 ${view === 'list' ? 'bg-red-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {stats.total} file(s) • {stats.totalSize}
        </div>
      </div>

      {/* Direct upload section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            disabled={uploading}
          >
            <UploadCloud className="h-4 w-4" /> {uploading ? 'Uploading…' : 'Upload Files'}
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
          <p className="text-xs text-slate-500 dark:text-slate-400">Images & PDF up to 10MB each. Files become available globally.</p>
          {selected.size > 0 && (
            <button 
              onClick={bulkDelete} 
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete ({selected.size})
            </button>
          )}
        </div>
        {uploadProgress && (
          <div className="flex-1 w-full sm:w-auto">
            <div className="mt-2 sm:mt-0 bg-slate-200/60 dark:bg-slate-700/60 border border-slate-300 dark:border-slate-600 rounded-lg p-3 shadow-inner relative overflow-hidden">
              <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                <span>Uploading {uploadProgress.current}/{uploadProgress.total}</span>
                <span>{Math.round(uploadProgress.fraction * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-300 dark:bg-slate-600 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 via-red-500 to-rose-500 animate-[pulse_2s_ease-in-out_infinite]" style={{ width: `${Math.max(5, uploadProgress.fraction * 100)}%`, transition: 'width .25s cubic-bezier(.4,0,.2,1)' }} />
              </div>
              <div className="mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400 font-medium" title={uploadProgress.fileName}>{uploadProgress.fileName}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Folder navigation */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button 
          onClick={() => handleFolderChange('all')}
          className={`px-3 py-1 text-sm rounded-full ${currentFolder === 'all' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
        >
          All Files
        </button>
        
        {Object.keys(groupedMedia).map(folder => (
          <button 
            key={folder}
            onClick={() => handleFolderChange(folder)}
            className={`px-3 py-1 text-sm rounded-full flex items-center ${currentFolder === folder ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}
          >
            <FolderOpen className="w-3 h-3 mr-1" />
            {folder}
            <span className="ml-1 text-xs">{groupedMedia[folder]?.length || 0}</span>
          </button>
        ))}
      </div>
      
      {loading && media.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 18 }).map((_,i)=>(
            <div key={i} className="border rounded-md overflow-hidden flex flex-col animate-pulse bg-white dark:bg-gray-800">
              <div className="h-24 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600" />
              <div className="p-2 space-y-2">
                <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-600" />
                <div className="h-2 w-1/3 rounded bg-slate-200 dark:bg-slate-600" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-md text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : currentFolderMedia.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {q ? 'No files matching your search' : 'No files in this folder'}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {currentFolderMedia.map(file => (
            <div 
              key={file.id} 
              className={`border rounded-md overflow-hidden flex flex-col cursor-pointer hover:border-red-300 dark:hover:border-red-700 ${selected.has(file.id) ? 'border-red-500 dark:border-red-500 ring-2 ring-red-500' : 'border-gray-200 dark:border-gray-700'}`}
              onClick={() => handleFileSelect(file)}
            >
              <div className="h-24 bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {file.type === 'image' ? (
                  <img 
                    src={file.url} 
                    alt={file.altText || file.productName} 
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1pbWFnZS1vZmYiPjxsaW5lIHgxPSIyIiB5MT0iMiIgeDI9IjIyIiB5Mj0iMjIiLz48cGF0aCBkPSJNMTAuNSA3LjVhMi41IDIuNSAwIDEgMC01IDB2OS04LjVhMi41IDIuNSAwIDAgMSA1IDB2OEwxOS41IDE2di04YTIuNSAyLjUgMCAwIDEgNSAwdjQuNSIvPjxwYXRoIGQ9Ik03IDdoMG0xMCAxMGgwIi8+PC9zdmc+';
                    }}
                  />
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">
                    {getFileIcon(file.type)}
                  </div>
                )}
              </div>
              <div className="p-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.productName}>
                  {file.productName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatFileSize(file.size)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <div className="overflow-x-auto w-full">
            <div className="min-w-max">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <input 
                        type="checkbox" 
                        checked={selected.size > 0 && selected.size === currentFolderMedia.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelected(new Set(currentFolderMedia.map(item => item.id)));
                          } else {
                            clearSelection();
                          }
                        }}
                        className="w-4 h-4 text-brand-600 bg-white border-slate-300 rounded focus:ring-brand-500"
                      />
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                      Size
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                      Modified
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {currentFolderMedia.map(file => (
                    <tr 
                      key={file.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer ${selected.has(file.id) ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
                      >
                        <input 
                          type="checkbox" 
                          checked={selected.has(file.id)} 
                          onChange={() => {}}
                          className="w-4 h-4 text-brand-600 bg-white border-slate-300 rounded focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
                            {file.type === 'image' ? (
                              <img 
                                src={file.url} 
                                alt={file.altText || file.productName} 
                                className="h-8 w-8 object-cover rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1pbWFnZS1vZmYiPjxsaW5lIHgxPSIyIiB5MT0iMiIgeDI9IjIyIiB5Mj0iMjIiLz48cGF0aCBkPSJNMTAuNSA3LjVhMi41IDIuNSAwIDEgMC01IDB2OS04LjVhMi41IDIuNSAwIDAgMSA1IDB2OEwxOS41IDE2di04YTIuNSAyLjUgMCAwIDEgNSAwdjQuNSIvPjxwYXRoIGQ9Ik03IDdoMG0xMCAxMGgwIi8+PC9zdmc+';
                                }}
                              />
                            ) : (
                              <div className="text-gray-500 dark:text-gray-400">
                                {getFileIcon(file.type)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white" title={file.productName}>
                              {file.productName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {file.url}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => copyToClipboard(file.url)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                            title="Copy URL to clipboard"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <a 
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title="View file"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <a 
                            href={file.url}
                            download={file.productName}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={() => handleDeleteMedia(file.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div ref={sentinelRef} className="h-14 flex items-center justify-center mt-6">
        {loadingMore && <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><RefreshCw className="w-4 h-4 animate-spin" /> Loading more…</div>}
        {!loadingMore && !hasMore && media.length > 0 && <div className="text-[10px] tracking-wide uppercase text-slate-400">End of library</div>}
      </div>

      {/* Enhanced Modal */}
      {isModalOpen && detail && (
        <WordPressStyleMediaModal
          item={detail}
          index={detailIndex}
          total={currentFolderMedia.length}
          onNavigate={(dir) => {
            setDetailIndex(i => {
              let next = dir === 'next' ? i + 1 : i - 1;
              if (next < 0) next = currentFolderMedia.length - 1; 
              else if (next >= currentFolderMedia.length) next = 0;
              const newItem = currentFolderMedia[next];
              setDetail(newItem);
              return next;
            });
          }}
          onClose={() => { setDetail(null); setDetailIndex(-1); setIsModalOpen(false); }}
          onDelete={async (id) => { 
            if (!token) return; 
            try { 
              await deleteProductMedia(token, id); 
              setMedia(m => m.filter(x => x.id !== id)); 
              setDetail(null); 
              setDetailIndex(-1); 
              setIsModalOpen(false); 
              toast('Deleted'); 
            } catch { 
              toast('Error'); 
            } 
          }}
          onAltChange={(v) => setDetail(d => d ? { ...d, altText: v } : d)}
        />
      )}
    </div>
  );
}; 
// Main Admin Page Component - Simplified without navigation
const AdminMediaManagementPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto w-full px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Media Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all uploaded media files in one place
          </p>
        </div>

        <MediaManagementComponent />
      </main>
    </div>
  );
};

// ---------------- Professional WordPress-Style Media Detail Modal -----------------
function WordPressStyleMediaModal({ item, onClose, onDelete, onAltChange, index, total, onNavigate }: { item: MediaItem; onClose: () => void; onDelete: (id: string) => void; onAltChange: (val: string) => void; index: number; total: number; onNavigate: (dir: 'prev' | 'next') => void }) {
  // Leaner, clean design: neutral surfaces, subtle borders, reduced visual noise
  const [zoom, setZoom] = useState(1);
  const [altText, setAltText] = useState(item.altText || '');
  const [busyDelete, setBusyDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMeta, setShowMeta] = useState(true);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onNavigate('prev'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onNavigate('next'); }
      else if (item.type === 'image') {
        if (e.key === '+' || e.key === '=') { e.preventDefault(); adjustZoom(0.25); }
        else if (e.key === '-') { e.preventDefault(); adjustZoom(-0.25); }
        else if (e.key === '0') { e.preventDefault(); setZoom(1); }
      }
    };
    document.addEventListener('keydown', h); return ()=> document.removeEventListener('keydown', h);
  }, [item.type, onNavigate, onClose]);

  // Debounce alt text propagation
  useEffect(()=>{ const t=setTimeout(()=> onAltChange(altText), 400); return ()=> clearTimeout(t); }, [altText, onAltChange]);

  function adjustZoom(delta:number){ setZoom(z=> Math.min(3, Math.max(0.1, +(z+delta).toFixed(2)))); }
  function formatFileSize(bytes?: number){ if(!bytes) return '—'; if(bytes<1024) return bytes+' B'; if(bytes<1024*1024) return (bytes/1024).toFixed(1)+' KB'; return (bytes/(1024*1024)).toFixed(1)+' MB'; }
  function formatDate(d?:string){ if(!d) return '—'; return new Date(d).toLocaleString(); }

  async function copyUrl(){ try{ await navigator.clipboard.writeText(item.url); setCopied(true); setTimeout(()=> setCopied(false),1500);}catch(e){ console.error(e);} }
  async function handleDelete(){ if(busyDelete) return; if(!confirm('Delete permanently?')) return; setBusyDelete(true); try{ await onDelete(item.id);} finally { setBusyDelete(false);} }

  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 backdrop-blur-sm">
            <div className="min-w-0 flex items-center gap-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[11px] font-medium tracking-wide text-slate-600 dark:text-slate-300">{item.type?.toUpperCase()||'FILE'}</span>
              <h2 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 truncate" title={item.productName}>{item.productName || 'Untitled'}</h2>
              <span className="text-xs text-slate-400 ml-1 shrink-0">{index+1} / {total}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button onClick={()=> onNavigate('prev')} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300" aria-label="Previous (←)"><ChevronLeft className="w-4 h-4"/></button>
              <button onClick={()=> onNavigate('next')} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300" aria-label="Next (→)"><ChevronRight className="w-4 h-4"/></button>
              <button onClick={()=> setShowMeta(s=>!s)} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs" aria-label="Toggle details">{showMeta? 'Hide' : 'Info'}</button>
              <button onClick={onClose} className="p-2 rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-500 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-300" aria-label="Close (Esc)"><X className="w-4 h-4"/></button>
            </div>
          </div>
          {/* Body */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] min-h-0">
            {/* Preview */}
            <div className="relative flex items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt={item.altText || item.productName}
                  className="max-w-full max-h-full object-contain transition-transform duration-300"
                  style={{ transform:`scale(${zoom})` }}
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-500 text-sm">
                  <FileText className="w-16 h-16 opacity-70" />
                  <div className="text-center space-y-1">
                    <p className="font-medium">No preview</p>
                    <p className="text-xs text-slate-400">{item.mime || 'Unknown type'}</p>
                  </div>
                </div>
              )}
              {/* Floating zoom controls (only images) */}
              {item.type === 'image' && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-md shadow border border-slate-200 dark:border-slate-700 p-1">
                  <button onClick={()=> adjustZoom(-0.25)} disabled={zoom<=0.25} className="px-2 py-1 text-xs rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"><ZoomOut className="w-3.5 h-3.5"/></button>
                  <span className="px-2 text-[11px] font-medium tabular-nums text-slate-600 dark:text-slate-300">{Math.round(zoom*100)}%</span>
                  <button onClick={()=> adjustZoom(0.25)} disabled={zoom>=3} className="px-2 py-1 text-xs rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"><ZoomIn className="w-3.5 h-3.5"/></button>
                  <button onClick={()=> setZoom(1)} className="ml-1 px-2 py-1 text-[10px] rounded hover:bg-slate-200 dark:hover:bg-slate-700">Reset</button>
                </div>
              )}
            </div>
            {/* Meta sidebar */}
            <div className={`flex flex-col border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition-[max-height] duration-300 overflow-y-auto ${showMeta? 'max-h-[1000px]' : 'max-h-0 lg:max-h-full lg:w-0 lg:p-0'}`}>
              <div className="p-4 space-y-5 text-sm">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">URL</label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={item.url} className="flex-1 px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 select-all" />
                    <button onClick={copyUrl} className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 text-xs flex items-center gap-1">{copied? 'Copied' : <Copy className="w-3.5 h-3.5"/>}</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">Size</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{formatFileSize(item.size)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">Type</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200 truncate" title={item.mime||''}>{item.mime || '—'}</p>
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">Uploaded</p>
                    <p className="font-medium text-slate-700 dark:text-slate-200">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
                {item.type === 'image' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1"><Edit className="w-3.5 h-3.5"/> Alt Text</label>
                    <textarea value={altText} onChange={e=> setAltText(e.target.value)} rows={3} placeholder="Describe for accessibility" className="w-full resize-none rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  {item.type === 'image' && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                      <Eye className="w-3.5 h-3.5"/> View
                    </a>
                  )}
                  <a href={item.url} download={item.productName} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                    <Download className="w-3.5 h-3.5"/> Download
                  </a>
                  <button onClick={handleDelete} disabled={busyDelete} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 disabled:opacity-50">
                    <Trash2 className="w-3.5 h-3.5"/> {busyDelete? 'Deleting…' : 'Delete'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed pt-1">Esc to close • ← → navigate • + - zoom • 0 reset</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMediaManagementPage;
