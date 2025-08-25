import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { auth, listHeroSlidesAdmin, createHeroSlide, updateHeroSlide, deleteHeroSlide, reorderHeroSlides, directMediaUploadWithProgress, type HeroSlide, API_BASE } from '../../lib/api';
import { Image as ImageIcon, Plus, Save, Trash2, GripVertical, UploadCloud, Loader2, Eye, EyeOff, Calendar, Type, Link as LinkIcon, Clock, Pencil, X } from 'lucide-react';
import { toast as notify } from 'react-toastify';
import MediaPicker from '../../components/MediaPicker';

export default function AdminHeroSlidesPage(){
  const token = auth.getToken();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [uploadingId, setUploadingId] = useState<string|null>(null);
  const [draggingId, setDraggingId] = useState<string|null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  
  // Modal functionality
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewImages, setPreviewImages] = useState<{ desktop?: string; mobile?: string }>({});
  const [selectedImages, setSelectedImages] = useState<{ desktop?: string; mobile?: string }>({});
  const [mediaPicker, setMediaPicker] = useState<{ 
    isOpen: boolean; 
    type: 'desktop' | 'mobile'; 
    context: 'create' | 'edit';
    slideId?: string;
  }>({ isOpen: false, type: 'desktop', context: 'create' });
  
  // Edit modal functionality
  const [editing, setEditing] = useState<HeroSlide|null>(null);
  const [editingChanges, setEditingChanges] = useState<Partial<HeroSlide> & { meta?: any }>({});
  const [manualSaving, setManualSaving] = useState(false);
  
  // Delete confirmation modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    slide: HeroSlide | null;
  }>({ isOpen: false, slide: null });

  const timersRef = useRef<Map<string, any>>(new Map());

  // Auto-save for meta fields with debouncing
  const debounceAutoSave = useCallback((patch: Record<string, any>) => {
    const autoSaveKey = `meta_${editing?.id || 'unknown'}`;
    
    // Clear existing timer
    if (timersRef.current.has(autoSaveKey)) {
      clearTimeout(timersRef.current.get(autoSaveKey));
    }
    
    // Set new timer for auto-save
    const timerId = setTimeout(async () => {
      if (!editing || !token) return;
      
      try {
        console.log('🤖 AUTO-SAVING meta changes:', patch);
        const currentChanges = { 
          meta: { ...(editing.meta || {}), ...(editingChanges.meta || {}), ...patch }
        };
        
        setSaving(editing.id, true);
        const updated = await updateHeroSlide(token, editing.id, currentChanges);
        console.log('✅ AUTO-SAVE successful:', updated.meta);
        
        // Update the slides list and editing state with fresh data
        setSlides(prev => prev.map(s => s.id === updated.id ? updated : s));
        setEditing(updated);
        setEditingChanges({});
        
        notify.success('Auto-saved successfully');
      } catch (error) {
        console.error('❌ AUTO-SAVE failed:', error);
        notify.error('Auto-save failed');
      } finally {
        setSaving(editing.id, false);
        timersRef.current.delete(autoSaveKey);
      }
    }, 1500); // 1.5 second delay
    
    timersRef.current.set(autoSaveKey, timerId);
  }, [editing, editingChanges, token]);

  // Debounce engine per slide+field
  const setSaving = useCallback((id: string, saving: boolean)=>{
    setSavingIds(prev => {
      const next = new Set(prev);
      if (saving) next.add(id); else next.delete(id);
      return next;
    });
  },[]);
  const debounced = useCallback((key: string, fn: ()=>Promise<void>, delay=600)=>{
    if (timersRef.current.has(key)) clearTimeout(timersRef.current.get(key));
    const t = setTimeout(async ()=>{
      timersRef.current.delete(key);
      try { await fn(); } catch(e: any){ notify.error(e.message||'Save failed'); }
    }, delay);
    timersRef.current.set(key, t);
  },[]);

  // Modal helper functions
  const startEditing = useCallback((slide: HeroSlide) => {
    console.log('🏁 Starting edit for slide:', slide.id);
    console.log('🎨 Initial slide meta:', slide.meta);
    console.log('🎨 Initial watermark font:', slide.meta?.watermarkFontFamily);
    setEditing(slide);
    setEditingChanges({});
  }, []);

  // Manual save function for edit modal
  const saveChanges = useCallback(async () => {
    if (!editing || !token || Object.keys(editingChanges).length === 0) return;
    
    console.log('💾 SAVING CHANGES:');
    console.log('📤 Sending to API:', editingChanges);
    console.log('🎨 Watermark font in changes:', editingChanges.meta?.watermarkFontFamily);
    
    setManualSaving(true);
    try {
      const updated = await updateHeroSlide(token, editing.id, editingChanges);
      console.log('📥 Received from API:', updated);
      console.log('🎨 Watermark font from API:', updated.meta?.watermarkFontFamily);
      
      setSlides(prev => prev.map(s => s.id === editing.id ? updated : s));
      setEditingChanges({});
      notify.success('Slide updated successfully');
    } catch (e: any) {
      notify.error(e.message || 'Failed to save changes');
    } finally {
      setManualSaving(false);
    }
  }, [editing, token, editingChanges]);

  // Update field in edit modal (local state only)
  const updateField = useCallback((field: keyof HeroSlide, value: any) => {
    setEditingChanges(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update meta in edit modal (local state only)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateMetaField = useCallback((patch: Record<string, any>) => {
    console.log('🔧 updateMetaField called with:', patch);
    console.log('📊 Current editing.meta:', editing?.meta);
    console.log('📝 Current editingChanges.meta:', editingChanges.meta);
    setEditingChanges(prev => ({ 
      ...prev, 
      meta: { ...(editing?.meta || {}), ...(prev.meta || {}), ...patch } 
    }));
    
    // Auto-save meta field changes after a short delay
    debounceAutoSave(patch);
  }, [editing, editingChanges.meta, debounceAutoSave]);

  // Handle image preview for create modal
  const handleImagePreview = (file: File, type: 'desktop' | 'mobile') => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImages(prev => ({ ...prev, [type]: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Media picker handlers
  const openMediaPicker = (type: 'desktop' | 'mobile', context: 'create' | 'edit', slideId?: string) => {
    setMediaPicker({ isOpen: true, type, context, slideId });
  };

  const closeMediaPicker = () => {
    setMediaPicker({ isOpen: false, type: 'desktop', context: 'create' });
  };

  const handleMediaSelect = async (imageUrl: string) => {
    const { type, context, slideId } = mediaPicker;
    
    if (context === 'create') {
      // For create modal, set the selected image and preview
      setSelectedImages(prev => ({ ...prev, [type]: imageUrl }));
      setPreviewImages(prev => ({ ...prev, [type]: imageUrl }));
    } else if (context === 'edit' && slideId && editing && token) {
      // For edit modal, update the slide immediately
      try {
        setUploadingId(slideId + (type === 'mobile' ? '-m' : ''));
        const updateData = type === 'desktop' ? { imageUrl } : { mobileImageUrl: imageUrl };
        const updated = await updateHeroSlide(token, slideId, updateData);
        setSlides(prev => prev.map(s => s.id === slideId ? updated : s));
        
        // Update editing state if this is the currently edited slide
        if (editing.id === slideId) {
          setEditing(updated);
          setEditingChanges({});
        }
        
        notify.success(`${type === 'desktop' ? 'Desktop' : 'Mobile'} image updated successfully`);
      } catch (e: any) {
        notify.error(e.message || 'Failed to update image');
      } finally {
        setUploadingId(null);
      }
    }
    
    closeMediaPicker();
  };

  useEffect(()=>{ if(!token) return; (async()=>{ setLoading(true); try { const s = await listHeroSlidesAdmin(token); setSlides(s); } finally { setLoading(false);} })(); },[token]);

  async function handleUpload(file: File): Promise<string> {
    if (!token) throw new Error('No token');
    const media = await directMediaUploadWithProgress(token, file, { type: 'image' });
    const base = API_BASE.replace(/\/$/, '');
    return media.url.startsWith('http') ? media.url : base + (media.url.startsWith('/') ? media.url : '/' + media.url);
  }

  async function handleCreate(e: React.FormEvent){
    e.preventDefault();
    if (!token) return;
    
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const title = String(fd.get('title')||'');
    const subtitle = String(fd.get('subtitle')||'');
    const description = String(fd.get('description')||'');
    const ctaLabel = String(fd.get('ctaLabel')||'');
    const ctaUrl = String(fd.get('ctaUrl')||'');
    const altText = String(fd.get('altText')||'');
    
    // Schedule fields
    const startAt = fd.get('startAt') ? new Date(String(fd.get('startAt'))).toISOString() : null;
    const endAt = fd.get('endAt') ? new Date(String(fd.get('endAt'))).toISOString() : null;
    
    // Watermark fields
    const watermarkEnabled = fd.get('watermarkEnabled') === 'on';
    const watermarkPosition = String(fd.get('watermarkPosition') || 'bottom-right');
    const watermarkOpacity = Number(fd.get('watermarkOpacity') || 0.9);
    const watermarkScale = Number(fd.get('watermarkScale') || 1);
    const watermarkRotation = Number(fd.get('watermarkRotation') || 0);
    const watermarkOffsetX = Number(fd.get('watermarkOffsetX') || 16);
    const watermarkOffsetY = Number(fd.get('watermarkOffsetY') || 16);
    const watermarkText = String(fd.get('watermarkText') || '');
    const watermarkFontFamily = String(fd.get('watermarkFontFamily') || 'Arial, sans-serif');
    const watermarkFontWeight = String(fd.get('watermarkFontWeight') || 'normal');
    const watermarkFontStyle = String(fd.get('watermarkFontStyle') || 'normal');
    const watermarkFontSize = Number(fd.get('watermarkFontSize') || 16);
    
    // Build watermark metadata
    const watermarkMeta = watermarkEnabled ? {
      watermarkEnabled,
      watermarkPosition,
      watermarkOpacity,
      watermarkScale,
      watermarkRotation,
      watermarkOffsetX,
      watermarkOffsetY,
      ...(watermarkText && { watermarkText }),
      watermarkFontFamily,
      watermarkFontWeight,
      watermarkFontStyle,
      watermarkFontSize
    } : {};
    
    console.log('🏗️ CREATE - Watermark Meta:', watermarkMeta);
    console.log('🎨 CREATE - Font Family:', watermarkFontFamily);
    
    // Use selected images from media picker if available, otherwise use file inputs
    let imageUrl = selectedImages.desktop;
    let mobileImageUrl = selectedImages.mobile;
    
    // If no image selected from media picker, check file inputs
    if (!imageUrl) {
      const file = (fd.get('image') as File);
      if (!file || !file.size) return notify.error('Please select a desktop image');
      imageUrl = await handleUpload(file);
    }
    
    if (!mobileImageUrl) {
      const mobileFile = fd.get('mobileImage') as File;
      if (mobileFile && mobileFile.size) {
        mobileImageUrl = await handleUpload(mobileFile);
      }
    }
    
    setCreating(true);
    try {
      const s = await createHeroSlide(token, { 
        title, 
        subtitle, 
        description, 
        imageUrl, 
        mobileImageUrl, 
        altText: altText||undefined, 
        ctaLabel: ctaLabel||undefined, 
        ctaUrl: ctaUrl||undefined,
        startAt,
        endAt,
        status:'active',
        meta: Object.keys(watermarkMeta).length > 0 ? watermarkMeta : undefined
      });
      setSlides(prev => [...prev, s].sort((a,b)=> (a.sortOrder??0) - (b.sortOrder??0)));
      form.reset();
      setPreviewImages({});
      setSelectedImages({});
      setShowCreateModal(false);
      notify.success('Slide created successfully');
    } catch (e:any){ 
      notify.error(e.message||'Failed to create slide'); 
    }
    finally { setCreating(false); }
  }

  function onDragStart(e: React.DragEvent, id: string){ setDraggingId(id); e.dataTransfer.effectAllowed='move'; }
  function onDragOver(e: React.DragEvent, overId: string){ e.preventDefault(); if (draggingId===overId) return; }
  function onDrop(e: React.DragEvent, overId: string){ e.preventDefault(); if(!draggingId || draggingId===overId) return; setSlides(prev => { const arr=[...prev]; const from = arr.findIndex(s=>s.id===draggingId); const to = arr.findIndex(s=>s.id===overId); if(from<0||to<0) return prev; const [m]=arr.splice(from,1); arr.splice(to,0,m); return arr.map((s,i)=> ({ ...s, sortOrder: i })); }); setDraggingId(null); }
  async function persistOrder(){ if(!token) return; try { await reorderHeroSlides(token, slides.map(s=>({ id:s.id }))); alert('Order saved'); } catch(e:any){ alert(e.message||'Failed to save order'); } }

  async function toggleStatus(slide: HeroSlide){ if(!token) return; const newStatus = slide.status === 'active' ? 'draft' : 'active'; setSaving(slide.id, true); try { const updated = await updateHeroSlide(token, slide.id, { status: newStatus }); setSlides(prev => prev.map(s=> s.id===slide.id ? updated : s)); } finally { setSaving(slide.id, false);} }
  
  // Show delete confirmation modal
  function showDeleteConfirmation(slide: HeroSlide) {
    setDeleteConfirmation({ isOpen: true, slide });
  }
  
  // Close delete confirmation modal
  function closeDeleteConfirmation() {
    setDeleteConfirmation({ isOpen: false, slide: null });
  }
  
  // Perform actual deletion
  async function confirmDelete() {
    const slide = deleteConfirmation.slide;
    if (!token || !slide) return;
    
    try {
      await deleteHeroSlide(token, slide.id);
      setSlides(prev => prev.filter(s => s.id !== slide.id));
      notify.success('Slide deleted successfully');
      closeDeleteConfirmation();
    } catch (error) {
      console.error('Delete failed:', error);
      notify.error('Failed to delete slide');
    }
  }
  
  async function remove(slide: HeroSlide){ showDeleteConfirmation(slide); }
  // Legacy debounced field update (for inline editing compatibility)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function updateFieldDebounced(slide: HeroSlide, field: keyof HeroSlide, value: any){
    if (!token) return;
    // Optimistic local update
    setSlides(prev => prev.map(s => s.id===slide.id ? ({ ...s, [field]: value }) : s));
    setSaving(slide.id, true);
    debounced(`${slide.id}:${String(field)}`, async ()=>{
      await updateHeroSlide(token, slide.id, { [field]: value } as any);
      setSaving(slide.id, false);
    });
  }

  // Watermark helpers
  function wm(slide: HeroSlide){ return (slide.meta||{}) as any; }
  async function updateMetaImmediate(slide: HeroSlide, patch: Record<string, any>){
    if (!token) return;
    const nextMeta = { ...(slide.meta||{}), ...patch };
    const updated = await updateHeroSlide(token, slide.id, { meta: nextMeta });
    setSlides(prev => prev.map(s => s.id===slide.id ? updated : s));
  }
  // Legacy metadata update (for inline editing compatibility)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function updateMeta(slide: HeroSlide, patch: Record<string, any>){
    if (!token) return;
    setSlides(prev => prev.map(s => s.id===slide.id ? ({ ...s, meta: { ...(s.meta||{}), ...patch } }) : s));
    setSaving(slide.id, true);
    debounced(`${slide.id}:meta`, async ()=>{
      const nextMeta = { ...(slide.meta||{}), ...patch };
      await updateHeroSlide(token, slide.id, { meta: nextMeta });
      setSaving(slide.id, false);
    });
  }
  // Legacy watermark logo upload (for inline editing compatibility)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function uploadWatermarkLogo(slide: HeroSlide, file: File){
    if (!token) return;
    setUploadingId(slide.id + '-wm');
    try {
      const url = await handleUpload(file);
      await updateMetaImmediate(slide, { watermarkLogoUrl: url });
    } catch(e:any){ alert(e.message||'Upload failed'); }
    finally { setUploadingId(null); }
  }

  const sortedSlides = useMemo(()=> {
    // Suppress unused function warnings for legacy inline editing functions
    void updateFieldDebounced; void updateMeta; void uploadWatermarkLogo; void updateMetaField;
    
    const arr = [...slides].sort((a,b)=> (a.sortOrder??0)-(b.sortOrder??0));
    if (!query.trim()) return arr;
    const q = query.toLowerCase();
    return arr.filter(s => (s.title||'').toLowerCase().includes(q) || (s.subtitle||'').toLowerCase().includes(q) || (s.description||'').toLowerCase().includes(q));
  }, [slides, query]);

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hero Slider</h1>
          <p className="text-slate-500">Manage slides shown on the landing page hero.</p>
        </div>
        <div className="flex items-center gap-3">
          <input value={query} onChange={e=> setQuery(e.target.value)} placeholder="Search slides…" className="px-3 py-2 rounded-lg border bg-white dark:bg-slate-900" />
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" /> New Slide
          </button>
          <button onClick={persistOrder} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200">
            <Save className="h-4 w-4" /> Save order
          </button>
        </div>
      </div>

      {/* Create Slide Modal */}
      {showCreateModal && (
        <Modal
          onClose={() => {
            setShowCreateModal(false);
            setPreviewImages({});
            setSelectedImages({});
          }}
          header={
            <div className="flex items-start justify-between gap-3 py-3 md:py-4">
              <div>
                <h2 className="text-xl font-semibold">Create New Slide</h2>
                <p className="text-slate-500 text-sm">Add a new hero slide to your landing page</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200" onClick={() => {setShowCreateModal(false); setPreviewImages({}); setSelectedImages({});}} aria-label="Close">
                  <X className="h-5 w-5"/>
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleCreate} className="mt-4 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Content Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  <Type className="h-4 w-4" />
                  <span>Content</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600"></div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Title *</label>
                  <input 
                    name="title" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 hover:border-slate-300 dark:hover:border-slate-600" 
                    placeholder="Powering Every Engine" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subtitle</label>
                  <input 
                    name="subtitle" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 hover:border-slate-300 dark:hover:border-slate-600" 
                    placeholder="Every Ride" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                  <textarea 
                    name="description" 
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 hover:border-slate-300 dark:hover:border-slate-600 resize-none" 
                    placeholder="Short tagline that describes your slide..." 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Alt Text</label>
                  <input 
                    name="altText" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 hover:border-slate-300 dark:hover:border-slate-600" 
                    placeholder="Descriptive alt text for accessibility" 
                  />
                </div>
              </div>

              {/* Media & CTA Section */}
              <div className="space-y-4">
                {/* Images Section */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                    <ImageIcon className="h-4 w-4" />
                    <span>Images</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600"></div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Desktop Image Preview */}
                    {previewImages.desktop && (
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-900">
                        <img src={previewImages.desktop} alt="Desktop preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md backdrop-blur-sm">
                          Desktop Preview
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewImages(prev => ({ ...prev, desktop: undefined }))}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors duration-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Desktop Image *</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => openMediaPicker('desktop', 'create')}
                          className="flex-1 p-4 border-2 border-dashed border-brand-300 dark:border-brand-600 rounded-xl bg-brand-50/50 dark:bg-brand-900/20 transition-all duration-200 hover:border-brand-400 hover:bg-brand-100/50 dark:hover:bg-brand-900/30 group"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-brand-500 mb-2 group-hover:scale-110 transition-transform duration-200" />
                            <p className="text-sm font-medium text-brand-700 dark:text-brand-300">Choose from Library</p>
                            <p className="text-xs text-brand-600 dark:text-brand-400">Browse your media library</p>
                          </div>
                        </button>
                        <div className="relative group/upload">
                          <input 
                            name="image" 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImagePreview(file, 'desktop');
                                setSelectedImages(prev => ({ ...prev, desktop: undefined })); // Clear selected image if file is chosen
                              }
                            }}
                            className="w-full p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 transition-all duration-200 hover:border-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-500 file:text-white file:font-medium file:cursor-pointer file:transition-all file:duration-200 file:hover:bg-slate-600"
                          />
                          {!previewImages.desktop && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group-hover/upload:opacity-60 transition-opacity duration-200">
                              <UploadCloud className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-2" />
                              <p className="text-xs text-slate-500 dark:text-slate-400">Or upload new image</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Image Preview */}
                    {previewImages.mobile && (
                      <div className="relative aspect-[9/16] max-w-48 rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-900 mx-auto">
                        <img src={previewImages.mobile} alt="Mobile preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md backdrop-blur-sm">
                          Mobile Preview
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewImages(prev => ({ ...prev, mobile: undefined }))}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors duration-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mobile Image</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => openMediaPicker('mobile', 'create')}
                          className="flex-1 p-3 border border-brand-200 dark:border-brand-700 rounded-xl bg-brand-50/30 dark:bg-brand-900/10 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 group"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <ImageIcon className="h-4 w-4 text-brand-500 group-hover:scale-110 transition-transform duration-200" />
                            <span className="text-sm font-medium text-brand-700 dark:text-brand-300">Choose from Library</span>
                          </div>
                        </button>
                        <input 
                          name="mobileImage" 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImagePreview(file, 'mobile');
                              setSelectedImages(prev => ({ ...prev, mobile: undefined })); // Clear selected image if file is chosen
                            }
                          }}
                          className="flex-1 p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 hover:border-slate-300 dark:hover:border-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200 file:text-sm file:font-medium file:cursor-pointer file:transition-all file:duration-200 file:hover:bg-slate-200 dark:file:hover:bg-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call to Action Section */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                    <LinkIcon className="h-4 w-4" />
                    <span>Call to Action</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">CTA Label</label>
                      <input 
                        name="ctaLabel" 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 hover:border-slate-300 dark:hover:border-slate-600" 
                        placeholder="View Products" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">CTA URL</label>
                      <input 
                        name="ctaUrl" 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 hover:border-slate-300 dark:hover:border-slate-600" 
                        placeholder="/products" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Schedule (Optional)</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600"></div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Date & Time</label>
                    <input 
                      name="startAt" 
                      type="datetime-local"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 hover:border-slate-300 dark:hover:border-slate-600" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End Date & Time</label>
                    <input 
                      name="endAt" 
                      type="datetime-local"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 hover:border-slate-300 dark:hover:border-slate-600" 
                    />
                  </div>
                </div>
              </div>

              {/* Watermark Section */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-white text-xs">W</span>
                  </div>
                  <span>Watermark Settings</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent dark:from-slate-600"></div>
                </div>
                <div className="space-y-3">
                  {/* Enable Watermark */}
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input 
                        name="watermarkEnabled" 
                        type="checkbox" 
                        defaultChecked
                        className="rounded text-purple-600 focus:ring-purple-500"
                        onChange={(e) => {
                          const container = document.getElementById('create-watermark-preview-container');
                          const textInput = document.querySelector('input[name="watermarkText"]') as HTMLInputElement;
                          if (container) {
                            if (e.target.checked && textInput?.value) {
                              container.style.display = 'block';
                            } else {
                              container.style.display = 'none';
                            }
                          }
                        }}
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Watermark</span>
                    </label>
                  </div>

                  {/* Position & Opacity */}
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Position</label>
                      <select 
                        name="watermarkPosition"
                        defaultValue="bottom-right"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 hover:border-slate-300 dark:hover:border-slate-600"
                      >
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="center">Center</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Opacity</label>
                      <input 
                        name="watermarkOpacity" 
                        type="range" 
                        min={0} 
                        max={1} 
                        step={0.05} 
                        defaultValue={0.9}
                        className="w-full accent-purple-500"
                        onChange={(e) => {
                          const percentSpan = e.target.nextElementSibling?.querySelector('span');
                          if (percentSpan) {
                            percentSpan.textContent = Math.round(Number(e.target.value) * 100) + '%';
                          }
                        }}
                      />
                      <div className="text-xs text-purple-600 mt-1"><span>90%</span></div>
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-200">
                      Advanced Settings ▼
                    </summary>
                    <div className="mt-3 space-y-3 pl-2 border-l border-purple-200 dark:border-purple-700">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Scale</label>
                          <input name="watermarkScale" type="range" min={0.2} max={3} step={0.05} defaultValue={1} className="w-full accent-purple-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rotation</label>
                          <input name="watermarkRotation" type="range" min={-45} max={45} step={1} defaultValue={0} className="w-full accent-purple-500" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Offset X</label>
                          <input name="watermarkOffsetX" type="number" defaultValue={16} className="w-full px-2 py-1 text-sm rounded border bg-transparent" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Offset Y</label>
                          <input name="watermarkOffsetY" type="number" defaultValue={16} className="w-full px-2 py-1 text-sm rounded border bg-transparent" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Watermark Text</label>
                        <input 
                          name="watermarkText" 
                          className="w-full px-3 py-2 rounded border bg-transparent text-sm" 
                          placeholder="Optional watermark text"
                          onChange={(e) => {
                            // Update live preview
                            const preview = document.getElementById('create-watermark-preview');
                            const container = document.getElementById('create-watermark-preview-container');
                            if (preview && container && e.target.value) {
                              preview.textContent = e.target.value;
                              container.style.display = 'block';
                            } else if (container) {
                              container.style.display = 'none';
                            }
                          }}
                        />
                        {/* Live Preview for Create Modal */}
                        <div id="create-watermark-preview-container" className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 border border-dashed border-purple-200 dark:border-purple-800 mt-2" style={{ display: 'none' }}>
                          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Preview:</div>
                          <div 
                            id="create-watermark-preview"
                            className="text-sm text-slate-700 dark:text-slate-300 text-center py-1"
                            style={{
                              fontFamily: 'Arial, sans-serif',
                              fontWeight: 'normal',
                              fontStyle: 'normal',
                              fontSize: '16px'
                            }}
                          >
                            Sample Text
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Font Family</label>
                        <select 
                          name="watermarkFontFamily" 
                          className="w-full px-3 py-2 rounded border bg-transparent text-sm" 
                          defaultValue="Arial, sans-serif"
                          onChange={(e) => {
                            const preview = document.getElementById('create-watermark-preview');
                            if (preview) {
                              preview.style.fontFamily = e.target.value;
                            }
                          }}
                        >
                          <optgroup label="System Fonts">
                            <option value="Arial, sans-serif">Arial</option>
                            <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                            <option value="'Times New Roman', Times, serif">Times New Roman</option>
                            <option value="Georgia, serif">Georgia</option>
                            <option value="Verdana, Geneva, sans-serif">Verdana</option>
                            <option value="'Courier New', Courier, monospace">Courier New</option>
                            <option value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</option>
                            <option value="Impact, Charcoal, sans-serif">Impact</option>
                          </optgroup>
                          <optgroup label="Modern Fonts">
                            <option value="'Poppins', sans-serif">Poppins</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Open Sans', sans-serif">Open Sans</option>
                            <option value="'Lato', sans-serif">Lato</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                            <option value="'Source Sans Pro', sans-serif">Source Sans Pro</option>
                            <option value="'Nunito', sans-serif">Nunito</option>
                            <option value="'Inter', sans-serif">Inter</option>
                          </optgroup>
                          <optgroup label="Display & Decorative">
                            <option value="'Teko', sans-serif">Teko</option>
                            <option value="'Orbitron', sans-serif">Orbitron</option>
                            <option value="'Bebas Neue', cursive">Bebas Neue</option>
                            <option value="'Oswald', sans-serif">Oswald</option>
                            <option value="'Anton', sans-serif">Anton</option>
                            <option value="'Bangers', cursive">Bangers</option>
                            <option value="'Righteous', cursive">Righteous</option>
                            <option value="'Fredoka One', cursive">Fredoka One</option>
                          </optgroup>
                          <optgroup label="Script & Handwriting">
                            <option value="'Dancing Script', cursive">Dancing Script</option>
                            <option value="'Pacifico', cursive">Pacifico</option>
                            <option value="'Great Vibes', cursive">Great Vibes</option>
                            <option value="'Lobster', cursive">Lobster</option>
                            <option value="'Caveat', cursive">Caveat</option>
                          </optgroup>
                          <optgroup label="Monospace">
                            <option value="'Fira Code', monospace">Fira Code</option>
                            <option value="'Source Code Pro', monospace">Source Code Pro</option>
                            <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                            <option value="'Inconsolata', monospace">Inconsolata</option>
                          </optgroup>
                          <optgroup label="Serif">
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="'Merriweather', serif">Merriweather</option>
                            <option value="'Crimson Text', serif">Crimson Text</option>
                            <option value="'EB Garamond', serif">EB Garamond</option>
                          </optgroup>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Font Weight</label>
                          <select 
                            name="watermarkFontWeight" 
                            className="w-full px-2 py-1 rounded border bg-transparent text-xs" 
                            defaultValue="normal"
                            onChange={(e) => {
                              const preview = document.getElementById('create-watermark-preview');
                              if (preview) {
                                preview.style.fontWeight = e.target.value;
                              }
                            }}
                          >
                            <option value="100">Thin</option>
                            <option value="200">Extra Light</option>
                            <option value="300">Light</option>
                            <option value="normal">Normal</option>
                            <option value="500">Medium</option>
                            <option value="600">Semi Bold</option>
                            <option value="bold">Bold</option>
                            <option value="800">Extra Bold</option>
                            <option value="900">Black</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Font Style</label>
                          <select 
                            name="watermarkFontStyle" 
                            className="w-full px-2 py-1 rounded border bg-transparent text-xs" 
                            defaultValue="normal"
                            onChange={(e) => {
                              const preview = document.getElementById('create-watermark-preview');
                              if (preview) {
                                preview.style.fontStyle = e.target.value;
                              }
                            }}
                          >
                            <option value="normal">Normal</option>
                            <option value="italic">Italic</option>
                            <option value="oblique">Oblique</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Font Size (px)</label>
                        <input 
                          name="watermarkFontSize" 
                          type="number" 
                          defaultValue={16} 
                          min={8} 
                          max={72} 
                          className="w-full px-2 py-1 text-sm rounded border bg-transparent"
                          onChange={(e) => {
                            const preview = document.getElementById('create-watermark-preview');
                            if (preview) {
                              preview.style.fontSize = e.target.value + 'px';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </details>
                </div>
              </div>
            </div>

            {/* Helper Text */}
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                <span>Desktop image is required. Mobile image is optional - if not provided, desktop image will be used on mobile devices.</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button 
                type="button" 
                onClick={() => {setShowCreateModal(false); setPreviewImages({}); setSelectedImages({});}}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={creating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:hover:scale-100"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Slide
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
        ) : sortedSlides.length === 0 ? (
          <div className="text-slate-500 flex items-center gap-2"><ImageIcon className="h-4 w-4" /> No slides yet</div>
        ) : (
          <>
            {sortedSlides.map(s => (
              <div key={s.id} draggable onDragStart={e=>onDragStart(e,s.id)} onDragOver={e=>onDragOver(e,s.id)} onDrop={e=>onDrop(e,s.id)} className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200/50 dark:border-slate-800/50 hover:shadow-md hover:border-brand-200/50 dark:hover:border-brand-800/50 transition-all duration-300">
                {/* Header */}
                <div className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="cursor-grab inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                        <GripVertical className="h-5 w-5" />
                        <span className="font-mono text-sm">#{s.sortOrder ?? 0}</span>
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300':'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {s.status}
                      </span>
                      {savingIds.has(s.id) && (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3 animate-spin"/>
                          Saving...
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startEditing(s)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 text-sm font-medium transition-all duration-200 group/edit"
                      >
                        <Pencil className="h-3.5 w-3.5 group-hover/edit:scale-110 transition-transform" /> 
                        Edit
                      </button>
                      <button 
                        onClick={()=> toggleStatus(s)} 
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${s.status==='active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                      >
                        {s.status==='active' ? (<><Eye className="h-3.5 w-3.5" /> Active</>) : (<><EyeOff className="h-3.5 w-3.5" /> Draft</>)}
                      </button>
                      <button 
                        onClick={()=> remove(s)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium text-red-600 dark:text-red-400 transition-all duration-200 group/delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 group-hover/delete:scale-110 transition-transform" /> 
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
                    {/* Image Preview */}
                    <div className="space-y-3">
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 ring-1 ring-slate-200 dark:ring-slate-700">
                        {s.imageUrl ? (
                          <img src={s.imageUrl} alt={s.altText || s.title || ''} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <ImageIcon className="h-8 w-8 mb-2" />
                            <span className="text-sm">No image</span>
                          </div>
                        )}
                        
                        {/* Mobile image indicator */}
                        {s.mobileImageUrl && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-md backdrop-blur-sm">
                            📱 Mobile Ready
                          </div>
                        )}
                      </div>

                      {/* Image info */}
                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Desktop:</span>
                          <span className={s.imageUrl ? 'text-emerald-600' : 'text-slate-400'}>
                            {s.imageUrl ? '✓ Set' : '⚠ Missing'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Mobile:</span>
                          <span className={s.mobileImageUrl ? 'text-emerald-600' : 'text-slate-400'}>
                            {s.mobileImageUrl ? '✓ Set' : '○ Optional'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="space-y-4">
                      {/* Title & Subtitle */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                          {s.title || <span className="text-slate-400 italic">No title</span>}
                        </h3>
                        {s.subtitle && (
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {s.subtitle}
                          </p>
                        )}
                        {s.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-500 line-clamp-2">
                            {s.description}
                          </p>
                        )}
                      </div>

                      {/* CTA Info */}
                      {(s.ctaLabel || s.ctaUrl) && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800/30">
                          <LinkIcon className="h-4 w-4 text-brand-500 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-brand-700 dark:text-brand-300">
                              {s.ctaLabel || 'No label'}
                            </div>
                            <div className="text-xs text-brand-600 dark:text-brand-400 truncate">
                              {s.ctaUrl || 'No URL'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Schedule Info */}
                      {(s.startAt || s.endAt) && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50">
                          <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                            {s.startAt && (
                              <div>
                                <span className="font-medium">Start:</span> {new Date(s.startAt).toLocaleString()}
                              </div>
                            )}
                            {s.endAt && (
                              <div>
                                <span className="font-medium">End:</span> {new Date(s.endAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Watermark Info */}
                      {wm(s).watermarkEnabled && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                          <div className="w-4 h-4 rounded-full bg-purple-500 shrink-0 flex items-center justify-center">
                            <span className="text-white text-xs">W</span>
                          </div>
                          <div className="text-xs text-purple-700 dark:text-purple-300">
                            <span className="font-medium">Watermark:</span> {wm(s).watermarkPosition || 'bottom-right'} • {Math.round((wm(s).watermarkOpacity ?? 0.9) * 100)}% opacity
                          </div>
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                        <span>ID: {s.id}</span>
                        {s.altText && <span className="truncate max-w-48" title={s.altText}>Alt: {s.altText}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        {uploadingId && <div className="fixed bottom-4 right-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black/80 text-white"><UploadCloud className="h-4 w-4" /> Uploading…</div>}
      </div>

      {/* Edit Modal */}
      {editing && (
        <Modal
          onClose={() => setEditing(null)}
          header={
            <div className="flex items-start justify-between gap-3 py-3 md:py-4">
              <div>
                <h2 className="text-xl font-semibold">Edit slide</h2>
                <p className="text-slate-500 text-sm">#{editing.sortOrder ?? 0} • ID {editing.id}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${editing.status==='active'?'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300':'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>{editing.status}</span>
                {Object.keys(editingChanges).length > 0 && (
                  <button 
                    onClick={saveChanges}
                    disabled={manualSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    {manualSaving ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="h-4 w-4" /> Save Changes</>
                    )}
                  </button>
                )}
                <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200" onClick={() => setEditing(null)} aria-label="Close">
                  <X className="h-5 w-5"/>
                </button>
              </div>
            </div>
          }
        >
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
            {/* Preview */}
            <div className="space-y-3">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-900">
                {editing.imageUrl ? <img src={editing.imageUrl} alt={editing.altText || editing.title || ''} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-slate-400"><ImageIcon className="h-6 w-6" /></div>}
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Desktop image</label>
                  <button
                    type="button"
                    onClick={() => openMediaPicker('desktop', 'edit', editing.id)}
                    className="w-full p-3 border border-brand-200 dark:border-brand-700 rounded-lg bg-brand-50/30 dark:bg-brand-900/10 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 group"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ImageIcon className="h-4 w-4 text-brand-500 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-sm font-medium text-brand-700 dark:text-brand-300">Choose from Library</span>
                    </div>
                  </button>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Mobile image</label>
                  <button
                    type="button"
                    onClick={() => openMediaPicker('mobile', 'edit', editing.id)}
                    className="w-full p-3 border border-brand-200 dark:border-brand-700 rounded-lg bg-brand-50/30 dark:bg-brand-900/10 transition-all duration-200 hover:border-brand-300 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 group"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ImageIcon className="h-4 w-4 text-brand-500 group-hover:scale-110 transition-transform duration-200" />
                      <span className="text-sm font-medium text-brand-700 dark:text-brand-300">Choose from Library</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Title</label>
                  <input className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={(editingChanges.title !== undefined ? editingChanges.title : editing.title)||''} onChange={e=> updateField('title', e.target.value)} placeholder="Title" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Subtitle</label>
                  <input className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={(editingChanges.subtitle !== undefined ? editingChanges.subtitle : editing.subtitle)||''} onChange={e=> updateField('subtitle', e.target.value)} placeholder="Subtitle" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium">Description</label>
                <textarea className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={(editingChanges.description !== undefined ? editingChanges.description : editing.description)||''} onChange={e=> updateField('description', e.target.value)} placeholder="Description" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Alt text</label>
                  <input className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={(editingChanges.altText !== undefined ? editingChanges.altText : editing.altText)||''} onChange={e=> updateField('altText', e.target.value)} placeholder="Alt text" />
                </div>
                <div>
                  <label className="block text-sm font-medium">CTA Label</label>
                  <input className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={(editingChanges.ctaLabel !== undefined ? editingChanges.ctaLabel : editing.ctaLabel)||''} onChange={e=> updateField('ctaLabel', e.target.value)} placeholder="CTA Label" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium">CTA URL</label>
                <input className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" value={(editingChanges.ctaUrl !== undefined ? editingChanges.ctaUrl : editing.ctaUrl)||''} onChange={e=> updateField('ctaUrl', e.target.value)} placeholder="CTA URL" />
              </div>

              {/* Schedule Fields */}
              <div className="">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-brand-500" />
                  Schedule (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      value={
                        (editingChanges.startAt !== undefined ? editingChanges.startAt : editing.startAt) 
                          ? new Date((editingChanges.startAt !== undefined ? editingChanges.startAt : editing.startAt)!).toISOString().slice(0,16) 
                          : ''
                      }
                      onChange={e=> updateField('startAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                      value={
                        (editingChanges.endAt !== undefined ? editingChanges.endAt : editing.endAt) 
                          ? new Date((editingChanges.endAt !== undefined ? editingChanges.endAt : editing.endAt)!).toISOString().slice(0,16) 
                          : ''
                      }
                      onChange={e=> updateField('endAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                    />
                  </div>
                </div>
              </div>

              {/* Watermark Settings */}
              <div className="">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-white text-xs">W</span>
                  </div>
                  Watermark Settings
                </h4>
                <div className="space-y-4 p-4 rounded-lg bg-purple-50/30 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                  {/* Enable/Disable */}
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={
                          (() => {
                            const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                            return currentMeta.watermarkEnabled !== false; // default true
                          })()
                        }
                        onChange={e=> updateMetaField({ watermarkEnabled: e.target.checked })}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium">Enable Watermark</span>
                    </label>
                  </div>

                  {/* Watermark Settings (only show if enabled) */}
                  {(() => {
                    const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                    return currentMeta.watermarkEnabled !== false;
                  })() && (
                    <>
                      {/* Position */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">Position</label>
                          <select 
                            className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={
                              (() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                return currentMeta.watermarkPosition || 'bottom-right';
                              })()
                            }
                            onChange={e=> updateMetaField({ watermarkPosition: e.target.value })}
                          >
                            <option value="top-left">Top Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="center">Center</option>
                          </select>
                        </div>

                        {/* Opacity */}
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                            <span>Opacity</span>
                            <span className="text-xs text-purple-600">
                              {Math.round(((() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                return currentMeta.watermarkOpacity ?? 0.9;
                              })()) * 100)}%
                            </span>
                          </label>
                          <input 
                            type="range" 
                            min={0} 
                            max={1} 
                            step={0.05} 
                            value={
                              (() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                return currentMeta.watermarkOpacity ?? 0.9;
                              })()
                            }
                            onChange={e=> updateMetaField({ watermarkOpacity: Number(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                        </div>
                      </div>

                      {/* Scale & Rotation */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                            <span>Scale</span>
                            <span className="text-xs text-purple-600">
                              {((() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                return currentMeta.watermarkScale ?? 1;
                              })()).toFixed(2)}x
                            </span>
                          </label>
                          <input 
                            type="range" 
                            min={0.2} 
                            max={3} 
                            step={0.05} 
                            value={
                              (() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                return currentMeta.watermarkScale ?? 1;
                              })()
                            }
                            onChange={e=> updateMetaField({ watermarkScale: Number(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                            <span>Rotation</span>
                            <span className="text-xs text-purple-600">
                              {(() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                const rotation = currentMeta.watermarkRotation;
                                return typeof rotation === 'number' ? rotation : 0;
                              })()}°
                            </span>
                          </label>
                          <input 
                            type="range" 
                            min={-45} 
                            max={45} 
                            step={1} 
                            value={
                              (() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                const rotation = currentMeta.watermarkRotation;
                                return typeof rotation === 'number' ? rotation : 0;
                              })()
                            }
                            onChange={e=> updateMetaField({ watermarkRotation: Number(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                          {/* Reset button for rotation */}
                          <div className="flex justify-center mt-1">
                            <button
                              type="button"
                              onClick={() => updateMetaField({ watermarkRotation: 0 })}
                              className="px-2 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors duration-200"
                            >
                              Reset to 0°
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Offset X & Y */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">Offset X (pixels)</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                            value={
                              (() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                return currentMeta.watermarkOffsetX ?? 16;
                              })()
                            }
                            onChange={e=> updateMetaField({ watermarkOffsetX: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Offset Y (pixels)</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                            value={
                              (() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                return currentMeta.watermarkOffsetY ?? 16;
                              })()
                            }
                            onChange={e=> updateMetaField({ watermarkOffsetY: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      {/* Watermark Text */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Watermark Text (Optional)</label>
                          <input 
                            className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" 
                            placeholder="Enter watermark text..."
                            value={
                              (() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                return currentMeta.watermarkText || '';
                              })()
                            }
                            onChange={e=> updateMetaField({ watermarkText: e.target.value })}
                          />
                        </div>

                        {/* Live Preview */}
                        {(() => {
                          const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                          const watermarkText = currentMeta.watermarkText;
                          if (watermarkText) {
                            return (
                              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 border-2 border-dashed border-purple-200 dark:border-purple-800">
                                <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Live Preview:</div>
                                <div 
                                  className="text-lg text-slate-700 dark:text-slate-300 text-center py-2"
                                  style={{
                                    fontFamily: currentMeta.watermarkFontFamily || 'Arial, sans-serif',
                                    fontWeight: currentMeta.watermarkFontWeight || 'normal',
                                    fontStyle: currentMeta.watermarkFontStyle || 'normal',
                                    fontSize: `${currentMeta.watermarkFontSize || 16}px`,
                                    opacity: (currentMeta.watermarkOpacity || 0.9),
                                    transform: `scale(${currentMeta.watermarkScale || 1}) rotate(${currentMeta.watermarkRotation || 0}deg)`
                                  }}
                                >
                                  {watermarkText}
                                </div>
                              </div>
                            );
                          }
                        })()}
                        
                        {/* Font Family Selector */}
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                            <span>Font Family</span>
                            {savingIds.has(editing.id) && (
                              <span className="text-xs text-purple-600 flex items-center gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Auto-saving...
                              </span>
                            )}
                          </label>
                          <select 
                            className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            value={
                              (() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                const fontValue = currentMeta.watermarkFontFamily || 'Arial, sans-serif';
                                console.log('🎨 Font selector - editingChanges.meta:', editingChanges.meta);
                                console.log('🎨 Font selector - editing.meta:', editing?.meta);
                                console.log('🎨 Font selector - resolved font value:', fontValue);
                                return fontValue;
                              })()
                            }
                            onChange={e=> {
                              console.log('🎨 Font changed to:', e.target.value);
                              updateMetaField({ watermarkFontFamily: e.target.value });
                            }}
                          >
                            <optgroup label="System Fonts">
                              <option value="Arial, sans-serif">Arial</option>
                              <option value="Helvetica, Arial, sans-serif">Helvetica</option>
                              <option value="'Times New Roman', Times, serif">Times New Roman</option>
                              <option value="Georgia, serif">Georgia</option>
                              <option value="Verdana, Geneva, sans-serif">Verdana</option>
                              <option value="'Courier New', Courier, monospace">Courier New</option>
                              <option value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</option>
                              <option value="Impact, Charcoal, sans-serif">Impact</option>
                            </optgroup>
                            <optgroup label="Modern Fonts">
                              <option value="'Poppins', sans-serif">Poppins</option>
                              <option value="'Roboto', sans-serif">Roboto</option>
                              <option value="'Open Sans', sans-serif">Open Sans</option>
                              <option value="'Lato', sans-serif">Lato</option>
                              <option value="'Montserrat', sans-serif">Montserrat</option>
                              <option value="'Source Sans Pro', sans-serif">Source Sans Pro</option>
                              <option value="'Nunito', sans-serif">Nunito</option>
                              <option value="'Inter', sans-serif">Inter</option>
                            </optgroup>
                            <optgroup label="Display & Decorative">
                              <option value="'Teko', sans-serif">Teko</option>
                              <option value="'Orbitron', sans-serif">Orbitron</option>
                              <option value="'Bebas Neue', cursive">Bebas Neue</option>
                              <option value="'Oswald', sans-serif">Oswald</option>
                              <option value="'Anton', sans-serif">Anton</option>
                              <option value="'Bangers', cursive">Bangers</option>
                              <option value="'Righteous', cursive">Righteous</option>
                              <option value="'Fredoka One', cursive">Fredoka One</option>
                            </optgroup>
                            <optgroup label="Script & Handwriting">
                              <option value="'Dancing Script', cursive">Dancing Script</option>
                              <option value="'Pacifico', cursive">Pacifico</option>
                              <option value="'Great Vibes', cursive">Great Vibes</option>
                              <option value="'Lobster', cursive">Lobster</option>
                              <option value="'Caveat', cursive">Caveat</option>
                            </optgroup>
                            <optgroup label="Monospace">
                              <option value="'Fira Code', monospace">Fira Code</option>
                              <option value="'Source Code Pro', monospace">Source Code Pro</option>
                              <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                              <option value="'Inconsolata', monospace">Inconsolata</option>
                            </optgroup>
                            <optgroup label="Serif">
                              <option value="'Playfair Display', serif">Playfair Display</option>
                              <option value="'Merriweather', serif">Merriweather</option>
                              <option value="'Crimson Text', serif">Crimson Text</option>
                              <option value="'EB Garamond', serif">EB Garamond</option>
                            </optgroup>
                          </select>
                        </div>

                        {/* Font Weight and Style */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium mb-2">Font Weight</label>
                            <select 
                              className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              value={
                                (() => {
                                  const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                  return currentMeta.watermarkFontWeight || 'normal';
                                })()
                              }
                              onChange={e=> updateMetaField({ watermarkFontWeight: e.target.value })}
                            >
                              <option value="100">Thin (100)</option>
                              <option value="200">Extra Light (200)</option>
                              <option value="300">Light (300)</option>
                              <option value="normal">Normal (400)</option>
                              <option value="500">Medium (500)</option>
                              <option value="600">Semi Bold (600)</option>
                              <option value="bold">Bold (700)</option>
                              <option value="800">Extra Bold (800)</option>
                              <option value="900">Black (900)</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-2">Font Style</label>
                            <select 
                              className="w-full px-3 py-2 rounded border bg-transparent transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              value={
                                (() => {
                                  const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                  return currentMeta.watermarkFontStyle || 'normal';
                                })()
                              }
                              onChange={e=> updateMetaField({ watermarkFontStyle: e.target.value })}
                            >
                              <option value="normal">Normal</option>
                              <option value="italic">Italic</option>
                              <option value="oblique">Oblique</option>
                            </select>
                          </div>
                        </div>

                        {/* Font Size */}
                        <div>
                          <label className="block text-sm font-medium mb-2 flex items-center justify-between">
                            <span>Font Size</span>
                            <span className="text-xs text-purple-600">
                              {(() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                return currentMeta.watermarkFontSize || 16;
                              })()}px
                            </span>
                          </label>
                          <input 
                            type="range" 
                            min={8} 
                            max={72} 
                            step={1} 
                            value={
                              (() => {
                                const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                return currentMeta.watermarkFontSize || 16;
                              })()
                            }
                            onChange={e=> updateMetaField({ watermarkFontSize: Number(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                        </div>
                      </div>

                      {/* Watermark Logo Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Watermark Logo (Optional)</label>
                        <div className="flex gap-3">
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={async e=> {
                              if (!e.target.files || !e.target.files[0]) return;
                              const file = e.target.files[0];
                              if (!token) return;
                              try {
                                setUploadingId(editing.id + '-wm');
                                const url = await handleUpload(file);
                                updateMetaField({ watermarkLogoUrl: url });
                                notify.success('Watermark logo uploaded');
                              } catch (error) {
                                console.error('Upload failed:', error);
                                notify.error('Upload failed');
                              } finally {
                                setUploadingId(null);
                              }
                            }}
                            className="flex-1 p-3 border border-purple-200 dark:border-purple-700 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 hover:border-purple-300 dark:hover:border-purple-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-100 dark:file:bg-purple-700 file:text-purple-700 dark:file:text-purple-200 file:text-sm file:font-medium file:cursor-pointer file:transition-all file:duration-200 file:hover:bg-purple-200 dark:file:hover:bg-purple-600"
                          />
                          {(() => {
                            const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                            return currentMeta.watermarkLogoUrl;
                          })() && (
                            <button 
                              type="button" 
                              className="px-3 py-2 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300"
                              onClick={() => updateMetaField({ watermarkLogoUrl: null })}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {/* Logo Preview */}
                        {(() => {
                          const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                          return currentMeta.watermarkLogoUrl;
                        })() && (
                          <div className="mt-3">
                            <img 
                              src={
                                (() => {
                                  const currentMeta = editingChanges.meta !== undefined ? editingChanges.meta : (editing.meta || {});
                                  return currentMeta.watermarkLogoUrl;
                                })()
                              }
                              alt="Watermark logo preview" 
                              className="h-16 object-contain rounded border p-2 bg-white dark:bg-slate-800 shadow-sm" 
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Media Picker */}
      <MediaPicker
        isOpen={mediaPicker.isOpen}
        onClose={closeMediaPicker}
        onSelect={handleMediaSelect}
        title={`Select ${mediaPicker.type === 'desktop' ? 'Desktop' : 'Mobile'} Image`}
        allowedTypes={['image']}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.slide && (
        <Modal 
          onClose={closeDeleteConfirmation}
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Delete Slide</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={closeDeleteConfirmation}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          }
        >
          <div className="py-4">
            {/* Slide Preview */}
            <div className="mb-6">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700 bg-slate-50 dark:bg-slate-900 max-w-md mx-auto">
                {deleteConfirmation.slide.imageUrl ? (
                  <img 
                    src={deleteConfirmation.slide.imageUrl} 
                    alt={deleteConfirmation.slide.altText || deleteConfirmation.slide.title || ''} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
            </div>

            {/* Slide Details */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                {deleteConfirmation.slide.title || 'Untitled Slide'}
              </h4>
              {deleteConfirmation.slide.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {deleteConfirmation.slide.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  deleteConfirmation.slide.status === 'active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                  {deleteConfirmation.slide.status}
                </span>
                <span>Order: {deleteConfirmation.slide.sortOrder}</span>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-red-500 mt-0.5">
                  ⚠️
                </div>
                <div>
                  <h5 className="font-medium text-red-800 dark:text-red-200 mb-1">
                    Are you sure you want to delete this slide?
                  </h5>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    This slide will be permanently removed from your hero slider. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeDeleteConfirmation}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Slide
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Enhanced modal with smooth transitions and modern styling
function Modal({ children, onClose, header }: { children: React.ReactNode; onClose: ()=>void; header?: React.ReactNode }){
  const overlayRef = useRef<HTMLDivElement|null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(()=>{
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10);
    
    return () => { 
      document.removeEventListener('keydown', onKey); 
      document.body.style.overflow = ''; 
    };
  }, [onClose]);

  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>)=>{ if (e.target === overlayRef.current) onClose(); };
  
  return createPortal(
    <div 
      ref={overlayRef} 
      onClick={onOverlayClick} 
      className={`fixed inset-0 z-[100] bg-slate-950/75 flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Centered modal container with smooth scale animation */}
      <div className={`relative w-[min(1100px,92vw)] max-w-[92vw] h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden flex flex-col transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        {/* Header with glassmorphism effect */}
        <div className="flex-none px-4 md:px-6 pt-4 pb-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
          {header}
        </div>
        {/* Body with smooth scroll */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
