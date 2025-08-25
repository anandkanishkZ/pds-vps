import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Save, Image as ImageIcon, Tag, Layers,
  Package, Shield, Upload, Clock, CheckCircle,
  AlertCircle, FileText, Loader2, X, Calendar, Eye, GripVertical, Search
} from 'lucide-react';
import { 
  auth, updateProduct, getProduct, uploadProductMedia,
  replaceProductFeatures, replaceProductApplications, replaceProductPacks,
  listMedia, type MediaLibraryItem, API_BASE,
  type ProductDetail 
} from '../../lib/api';
import ModalPortal from '../ModalPortal';

interface ProductEditorProps {
  productSlug: string | null;
  isOpen: boolean;               // existing modal usage (Products listing)
  onClose: () => void;            // close handler
  onSave?: (product: ProductDetail) => void; // callback after save
  inline?: boolean;               // render inline as full page
}

interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  message?: string;
}

const ProductEditor: React.FC<ProductEditorProps> = ({
  productSlug,
  isOpen,
  onClose,
  onSave,
  inline
}) => {
  const token = auth.getToken();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  // Scroll state for top bar shadow
  const [scrolled, setScrolled] = useState(false);
  // UI state
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({ status: 'idle' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [customSlug, setCustomSlug] = useState<string>('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [slugTouched, setSlugTouched] = useState(false);

  // Helper to compute effective slug
  const computeEffectiveSlug = useCallback((nameVal: string | undefined | null, custom: string, auto: boolean) => {
    const base = (nameVal||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    return auto ? base : custom;
  }, []);
  
  // Local state for different sections
  const [basicData, setBasicData] = useState<Partial<ProductDetail>>({});
  const [features, setFeatures] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [packSizes, setPackSizes] = useState<{displayLabel: string}[]>([]);
  // Media library picker state
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<MediaLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [librarySelected, setLibrarySelected] = useState<number | null>(null);
  const [libraryAlt, setLibraryAlt] = useState('');

  const loadLibrary = useCallback(async (q?: string) => {
    if (!token) return;
    setLibraryLoading(true);
    try {
      const r = await listMedia(token, { q: q || libraryQuery || undefined, pageSize: 60 });
      // Normalize relative URLs
      const base = API_BASE.replace(/\/$/, '');
      const items = r.data.map(m => ({
        ...m,
        url: m.url.startsWith('http') ? m.url : base + (m.url.startsWith('/') ? m.url : '/' + m.url)
      }));
      setLibraryItems(items);
      setLibrarySelected(null);
    } catch (e) { console.error(e); }
    finally { setLibraryLoading(false); }
  }, [token, libraryQuery]);
  
  // Form inputs
  const [featureInput, setFeatureInput] = useState('');
  const [applicationInput, setApplicationInput] = useState('');
  const [packInput, setPackInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  // Simple ephemeral message (instead of toast lib here)
  const [flash, setFlash] = useState<string | null>(null);
  const flashMsg = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 2500); };

  // Load product data
  useEffect(() => {
    if (!token || !productSlug) return;
    
    const loadProduct = async () => {
      setLoading(true);
      try {
        const data = await getProduct(token, productSlug);
        setProduct(data);
        setBasicData(data);
        setFeatures(data.features?.map(f => f.label) || []);
        setApplications(data.applications?.map(a => a.label) || []);
        setPackSizes(data.packSizes?.map(p => ({ displayLabel: p.displayLabel })) || []);
  // (media listing not shown yet)
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadProduct();
    }
  }, [token, productSlug, isOpen]);

  const refreshProduct = useCallback(async () => {
    if (!token || !product?.slug) return;
    try {
      const data = await getProduct(token, product.slug);
      setProduct(data);
    } catch (e) {
      console.error('Failed to refresh product after upload:', e);
    }
  }, [token, product]);

  // Handle basic data changes
  const handleBasicDataChange = useCallback((field: string, value: any) => {
    setBasicData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    setAutoSaveStatus({ status: 'idle' });
    if (field === 'name' && autoSlug) {
      const gen = (value||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      setCustomSlug(gen);
    }
  }, [autoSlug]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
  // NOTE: Admin update endpoints require the product UUID, not the public slug.
  const productId = product?.id;
  if (!token || !productId || !hasUnsavedChanges) return;
    if (!basicData.name || !basicData.name.trim()) return; // don't autosave invalid state
    setAutoSaveStatus({ status: 'saving' });
    try {
      // Build minimal patch only including defined values (avoid sending empty strings that backend rejects)
      const base: any = {};
      const effSlug = computeEffectiveSlug(basicData.name, customSlug, autoSlug);
      const slugInvalid = effSlug && (effSlug.length < 3 || /--/.test(effSlug));
      const src = {
        name: basicData.name?.trim(),
        slug: (!autoSlug && !slugInvalid) ? effSlug : undefined,
        shortDescription: basicData.shortDescription,
        longDescription: basicData.longDescription,
        imageUrl: basicData.imageUrl,
        viscosity: basicData.viscosity,
        apiGrade: basicData.apiGrade,
        healthSafety: basicData.healthSafety,
        isActive: basicData.isActive,
        categoryId: basicData.categoryId || product?.categoryId,
        meta: basicData.meta
      };
      Object.entries(src).forEach(([k,v])=> {
        if (v !== undefined && v !== null && (typeof v !== 'string' || v.trim() !== '')) base[k]=v;
      });
      // Required field name always included
      base.name = src.name;
      const cleanData = base;
    const updatedProduct = await updateProduct(token, productId, cleanData);
      setProduct(updatedProduct);
      setAutoSaveStatus({ status: 'saved', lastSaved: new Date(), message: 'Saved' });
      setHasUnsavedChanges(false);
    } catch {
      setAutoSaveStatus({ status: 'error', message: 'Failed' });
    }
  }, [token, basicData, hasUnsavedChanges, product]);

  // Manual save
  const handleSave = useCallback(async () => {
  const productId = product?.id;
  if (!token || !productId) return;
    if (!basicData.name || !basicData.name.trim()) { flashMsg('Name required'); return; }
    setAutoSaveStatus({ status: 'saving' });
    try {
      const effSlug = computeEffectiveSlug(basicData.name, customSlug, autoSlug);
      const slugInvalid = effSlug && (effSlug.length < 3 || /--/.test(effSlug));
      const src: any = {
        name: basicData.name?.trim(),
        slug: (!autoSlug && !slugInvalid) ? effSlug : undefined,
        shortDescription: basicData.shortDescription,
        longDescription: basicData.longDescription,
        imageUrl: basicData.imageUrl,
        viscosity: basicData.viscosity,
        apiGrade: basicData.apiGrade,
        healthSafety: basicData.healthSafety,
        isActive: basicData.isActive,
        categoryId: basicData.categoryId || product?.categoryId,
        meta: basicData.meta
      };
      const patch: any = {};
      Object.entries(src).forEach(([k,v])=> {
        if (v !== undefined && v !== null && (typeof v !== 'string' || v.trim() !== '')) patch[k]=v;
      });
      patch.name = src.name; // ensure name
  const updated = await updateProduct(token, productId, patch);
      await Promise.all([
    replaceProductFeatures(token, productId, features),
    replaceProductApplications(token, productId, applications),
    replaceProductPacks(token, productId, packSizes)
      ]);
      setProduct(updated);
      setAutoSaveStatus({ status: 'saved', lastSaved: new Date(), message: 'Updated' });
      setHasUnsavedChanges(false);
      onSave?.(updated);
      flashMsg('Product updated');
    } catch (e) {
      console.error(e);
      setAutoSaveStatus({ status: 'error', message: 'Save failed' });
      flashMsg('Save failed');
    }
  }, [token, basicData, features, applications, packSizes, onSave, product]);

  // Media upload
  const handleMediaUpload = useCallback(async (file: File, type: 'image' | 'spec' | 'msds' | 'brochure') => {
    const productId = product?.id;
    if (!token || !productId) return;
    
    try {
      const media = await uploadProductMedia(token, productId, file, type);
  // (media listing not shown yet)
      if (type === 'image' && !basicData.imageUrl) {
        setBasicData(prev => ({ ...prev, imageUrl: media.url }));
        setHasUnsavedChanges(true);
      }
      if (type !== 'image') {
        // Refresh product to pull updated media list
        await refreshProduct();
        flashMsg('Document uploaded');
      }
    } catch (error) {
      console.error('Media upload failed:', error);
    }
  }, [token, product, basicData.imageUrl, refreshProduct]);

  // Media delete
  // (Media delete currently unused in simplified view)

  // Feature management
  const addFeature = useCallback(() => {
    if (featureInput.trim()) {
      setFeatures(prev => [...prev, featureInput.trim()]);
      setFeatureInput('');
      setHasUnsavedChanges(true);
    }
  }, [featureInput]);

  const syncFeatures = useCallback(async () => {
    const productId = product?.id;
    if (!token || !productId) return;
    try { await replaceProductFeatures(token, productId, features); flashMsg('Features saved'); }
    catch (e){ console.error(e); flashMsg('Features failed'); }
  }, [token, product, features]);

  // Application management
  const addApplication = useCallback(() => {
    if (applicationInput.trim()) {
      setApplications(prev => [...prev, applicationInput.trim()]);
      setApplicationInput('');
      setHasUnsavedChanges(true);
    }
  }, [applicationInput]);

  const syncApplications = useCallback(async () => {
    const productId = product?.id;
    if (!token || !productId) return;
    try { await replaceProductApplications(token, productId, applications); flashMsg('Applications saved'); }
    catch (e){ console.error(e); flashMsg('Applications failed'); }
  }, [token, product, applications]);

  // Pack size management
  const addPackSize = useCallback(() => {
    if (packInput.trim()) {
      setPackSizes(prev => [...prev, { displayLabel: packInput.trim() }]);
      setPackInput('');
      setHasUnsavedChanges(true);
    }
  }, [packInput]);

  const syncPackSizes = useCallback(async () => {
    const productId = product?.id;
    if (!token || !productId) return;
    try { await replaceProductPacks(token, productId, packSizes); flashMsg('Pack sizes saved'); }
    catch (e){ console.error(e); flashMsg('Pack sizes failed'); }
  }, [token, product, packSizes]);

  // Auto-save timer
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const timer = setTimeout(autoSave, 2000);
    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, autoSave]);

  // Inline vs modal container helpers
  if (!isOpen) return null; // if closed

  // Slug preview (client-side) if product not yet saved/new name typed
  const derivedSlug = (basicData.name||'')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const effectiveSlug = autoSlug ? derivedSlug : customSlug;
  const slugInvalid = !!effectiveSlug && (effectiveSlug.length < 3 || /--/.test(effectiveSlug));

  const scrollContainerRef = useRef<HTMLDivElement|null>(null);
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 4);
    el.addEventListener('scroll', onScroll);
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollContainerRef]);

  const statusChip = () => {
    if (autoSaveStatus.status === 'saving') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-[11px]"><Loader2 className="h-3 w-3 animate-spin"/>Saving…</span>;
    if (autoSaveStatus.status === 'error') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 text-[11px]"><AlertCircle className="h-3 w-3"/>Error</span>;
    if (autoSaveStatus.status === 'saved') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[11px]"><CheckCircle className="h-3 w-3"/>Saved</span>;
    if (hasUnsavedChanges) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 text-[11px]"><Clock className="h-3 w-3"/>Unsaved</span>;
    return null;
  };

  const EditorCore = (
    <div className="relative flex-1 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Top bar */}
      <div className={`sticky top-0 z-20 px-6 py-3 transition-shadow ${scrolled ? 'shadow-sm shadow-slate-200/80 dark:shadow-black/40' : ''} bg-white/90 dark:bg-slate-900/85 backdrop-blur border-b border-slate-200 dark:border-slate-700`}> 
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-6">
            {/* Left */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide font-medium text-slate-400 dark:text-slate-500 mb-1">
                <span>Products</span>
                <span className="opacity-40">/</span>
                <span className="text-slate-600 dark:text-slate-300">{product ? 'Edit' : 'New Product'}</span>
              </div>
              <div className="group relative">
                <input
                  type="text"
                  placeholder="Enter product name"
                  value={basicData.name || ''}
                  onChange={e => handleBasicDataChange('name', e.target.value)}
                  onBlur={()=> setNameTouched(true)}
                  className={`w-full pr-40 text-2xl font-semibold tracking-tight bg-transparent outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-0 border-none ${(!basicData.name?.trim() && nameTouched)?'text-rose-600':''}`}
                />
                {/* Slug + status on right of input */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-3">
                  {statusChip()}
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 font-mono max-w-full">
                  <span className="opacity-60">slug:</span>
                  <div className="flex items-center gap-1 max-w-[320px]">
                    <input
                      value={effectiveSlug}
                      onChange={e=> { setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g,'').replace(/--+/g,'-').replace(/^-|-$/g,'')); setAutoSlug(false); setSlugTouched(true); setHasUnsavedChanges(true); setAutoSaveStatus({ status:'idle' }); }}
                      onBlur={()=> setSlugTouched(true)}
                      disabled={autoSlug}
                      placeholder="auto-generated"
                      className={`text-xs px-2 py-1 rounded border bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none w-56 truncate ${autoSlug?'opacity-60 cursor-not-allowed':''} ${slugTouched && slugInvalid?'border-rose-400 text-rose-600':''}`}
                    />
                    <label className="flex items-center gap-1 text-[11px] select-none">
                      <input type="checkbox" checked={autoSlug} onChange={e=> { setAutoSlug(e.target.checked); if (e.target.checked) { setCustomSlug(derivedSlug); } else { setSlugTouched(true); } setHasUnsavedChanges(true); setAutoSaveStatus({ status:'idle' }); }} />
                      <span className="uppercase tracking-wide">Auto</span>
                    </label>
                  </div>
                  {slugTouched && slugInvalid && <span className="text-[10px] text-rose-500">Invalid</span>}
                </div>
                {product && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(product.createdAt).toLocaleDateString()}</span>}
                {basicData.name && <span>{(basicData.name||'').length} chars</span>}
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {product?.slug && (
                <button
                  onClick={() => window.open(`/products/item/${product.slug}`, '_blank')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Eye className="h-4 w-4" /> Preview
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={autoSaveStatus.status === 'saving' || !basicData.name?.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white disabled:opacity-50"
              >
                {autoSaveStatus.status === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {product ? 'Update' : 'Save'}
              </button>
              <button onClick={onClose} className="p-2 rounded-md border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close editor">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Scrollable body with main + sidebar (like WP) */}
  <div ref={scrollContainerRef} className="h-full overflow-y-auto">
              {flash && <div className="sticky top-16 z-10 mx-6 mt-4 bg-brand-600 text-white text-xs font-medium px-3 py-2 rounded-md shadow inline-flex items-center gap-2">{flash}</div>}
              {loading ? (
                <div className="flex items-center justify-center h-80"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>
              ) : (
                <div className="mx-auto max-w-screen-xl px-8 py-8 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-10">
                  {/* MAIN COLUMN */}
                  <div className="space-y-8">
                    {/* Short Description */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Short Description</label>
                      <textarea
                        value={basicData.shortDescription || ''}
                        onChange={e => handleBasicDataChange('shortDescription', e.target.value)}
                        rows={8}
                        className="w-full h-32 max-h-40 overflow-y-auto resize-none px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="Brief description shown in listings"
                      />
                    </div>
                    {/* Long Description */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> Detailed Description</label>
                      <textarea
                        value={basicData.longDescription || ''}
                        onChange={e => handleBasicDataChange('longDescription', e.target.value)}
                        rows={10}
                        className="w-full h-96 max-h-[42rem] overflow-y-auto resize-none px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder={`Detailed product description...\n\n• Bullet points\n• Technical specs\n• Benefits`}
                      />
                    </div>
                    {/* Features */}
                    <EditableListBox
                      title="Features"
                      icon={Tag}
                      items={features}
                      inputPlaceholder="Add feature"
                      inputValue={featureInput}
                      onInputChange={setFeatureInput}
                      onAdd={addFeature}
                      onRemove={i => setFeatures(f => f.filter((_, idx) => idx !== i))}
                      onReorder={(from,to)=> setFeatures(list=> reorderArray(list, from, to))}
                      onSave={syncFeatures}
                    />
                    {/* Applications */}
                    <EditableListBox
                      title="Applications"
                      icon={Layers}
                      items={applications}
                      inputPlaceholder="Add application"
                      inputValue={applicationInput}
                      onInputChange={setApplicationInput}
                      onAdd={addApplication}
                      onRemove={i => setApplications(a => a.filter((_, idx) => idx !== i))}
                      onReorder={(from,to)=> setApplications(list=> reorderArray(list, from, to))}
                      onSave={syncApplications}
                    />
                    {/* Pack Sizes */}
                    <EditableListBox
                      title="Pack Sizes"
                      icon={Package}
                      items={packSizes.map(p => p.displayLabel)}
                      inputPlaceholder="e.g. 1L, 5L"
                      inputValue={packInput}
                      onInputChange={setPackInput}
                      onAdd={addPackSize}
                      onRemove={i => setPackSizes(ps => ps.filter((_, idx) => idx !== i))}
                      onReorder={(from,to)=> setPackSizes(list=> reorderArray(list, from, to))}
                      onSave={syncPackSizes}
                    />
                    {/* Safety */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                      <label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Shield className="h-4 w-4" /> Health & Safety</label>
                      <textarea
                        value={basicData.healthSafety || ''}
                        onChange={e => handleBasicDataChange('healthSafety', e.target.value)}
                        rows={6}
                        className="w-full resize-y px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="Phrases, handling instructions, PPE, disposal info..."
                      />
                    </div>
                    <div className="h-20" />
                  </div>
                  {/* SIDE COLUMN */}
                  <aside className="space-y-6 lg:sticky lg:top-24 self-start">
                    {/* Status */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Status</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${basicData.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>{basicData.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                      <select
                        value={basicData.isActive ? 'active' : 'inactive'}
                        onChange={e => handleBasicDataChange('isActive', e.target.value === 'active')}
                        className="w-full text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-1.5 focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Inactive products are hidden from public catalog.</p>
                    </div>
                    {/* Technical */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
                      <div className="text-sm font-semibold">Technical Specs</div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">Viscosity</label>
                          <input value={basicData.viscosity || ''} onChange={e => handleBasicDataChange('viscosity', e.target.value)} className="w-full text-sm px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="15W-40" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">API Grade</label>
                          <input value={basicData.apiGrade || ''} onChange={e => handleBasicDataChange('apiGrade', e.target.value)} className="w-full text-sm px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-brand-500 outline-none" placeholder="CF-4" />
                        </div>
                      </div>
                    </div>
                    {/* Documents (PDF) */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Product PDF</span>
                      </div>
                      {(() => {
                        const pdfs = (product?.media||[]).filter(m => m.type === 'spec' || m.type === 'brochure' || m.type === 'msds');
                        if (!pdfs.length) {
                          return <div className="text-xs text-slate-500">No PDF uploaded</div>;
                        }
                        return (
                          <div className="space-y-4">
                            {pdfs.map((pdf)=> (
                              <div key={pdf.id} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-medium">
                                    <FileText className="h-4 w-4" /> View PDF ({pdf.type})
                                  </a>
                                </div>
                                <div className="w-full h-80 border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-900">
                                  <iframe title={`pdf-${pdf.id}`} src={pdf.url} className="w-full h-full" />
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <div className="flex gap-2">
                        <button onClick={() => pdfInputRef.current?.click()} className="flex-1 text-[11px] px-2 py-1.5 rounded-md bg-slate-900 text-white dark:bg-slate-700 hover:bg-slate-700 inline-flex items-center justify-center gap-2">
                          <Upload className="h-4 w-4" /> Upload/Replace PDF
                        </button>
                        <input ref={pdfInputRef} type="file" accept="application/pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f, 'spec'); }} />
                      </div>
                      <p className="text-[10px] text-slate-500">PDF up to 10MB. Used for "View PDF" on product page.</p>
                    </div>
                    {/* Hero image */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold flex items-center gap-1"><ImageIcon className="h-4 w-4" /> Featured Image</span>
                        {basicData.imageUrl && <button onClick={() => handleBasicDataChange('imageUrl', '')} className="text-[11px] text-rose-600 hover:underline">Remove</button>}
                      </div>
                      <div className="aspect-video w-full rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-dashed border-slate-300 dark:border-slate-600">
                        {basicData.imageUrl ? (
                          <img src={basicData.imageUrl} alt={basicData.name} className="object-cover w-full h-full" />
                        ) : (
                          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                            <Upload className="h-6 w-6" />
                            Upload image
                          </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f, 'image'); }} />
                      </div>
                      <p className="text-[10px] text-slate-500">JPG / PNG up to 2MB. First image used on listings.</p>
                      <div className="flex gap-2">
                        <button onClick={()=> { setLibraryOpen(true); if(libraryItems.length===0) loadLibrary(); }} className="flex-1 text-[11px] px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">Choose from Library</button>
                        <button onClick={()=> fileInputRef.current?.click()} className="flex-1 text-[11px] px-2 py-1.5 rounded-md bg-slate-900 text-white dark:bg-slate-700 hover:bg-slate-700">Upload</button>
                      </div>
                      {libraryOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center">
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={()=> setLibraryOpen(false)} />
                          <div className="relative w-full max-w-5xl mx-auto h-[560px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 backdrop-blur">
                              <div className="text-sm font-semibold">Media Library</div>
                              <button onClick={()=> setLibraryOpen(false)} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Close"><X className="h-4 w-4" /></button>
                            </div>
                            {/* Body split */}
                            <div className="flex flex-1 min-h-0">
                              {/* Grid Panel */}
                              <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-700">
                                <div className="p-4 pb-2">
                                  <div className="flex gap-2 items-center">
                                    <div className="relative flex-1">
                                      <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                      <input value={libraryQuery} onChange={e=> setLibraryQuery(e.target.value)} onKeyDown={e=> { if(e.key==='Enter') loadLibrary(); }} placeholder="Search media..." className="w-full pl-7 pr-2 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm" />
                                    </div>
                                    <button onClick={()=> loadLibrary()} className="px-3 py-2 rounded-md text-sm bg-brand-600 text-white hover:bg-brand-500">Search</button>
                                  </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                  <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                                    {libraryLoading && <div className="col-span-full flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>}
                                    {!libraryLoading && libraryItems.length===0 && <div className="col-span-full text-xs text-slate-500">No media found.</div>}
                                    {libraryItems.map((item, idx) => {
                                      const selected = idx === librarySelected;
                                      return (
                                        <button
                                          key={item.id||item.url}
                                          type="button"
                                          onClick={()=> { setLibrarySelected(idx); setLibraryAlt(item.altText||''); }}
                                          onDoubleClick={()=> { handleBasicDataChange('imageUrl', item.url); setLibraryOpen(false); }}
                                          className={`relative group aspect-square rounded-md overflow-hidden border text-left ${selected ? 'border-brand-600 ring-2 ring-brand-500' : 'border-slate-200 dark:border-slate-700 hover:border-brand-400'}`}
                                        >
                                          <img
                                            src={item.url}
                                            alt={item.altText||''}
                                            className="object-cover w-full h-full bg-slate-100 dark:bg-slate-800"
                                            onError={(e)=> { (e.currentTarget as HTMLImageElement).style.opacity='0'; }}
                                          />
                                          <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900/70 to-transparent text-[10px] text-white px-1.5 py-0.5 line-clamp-1 opacity-0 group-hover:opacity-100 transition">{item.altText || item.ext || 'image'}</span>
                                          {selected && <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-brand-600 text-[10px] text-white flex items-center justify-center font-semibold">✓</span>}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                              {/* Detail Panel */}
                              <div className="w-72 shrink-0 flex flex-col">
                                <div className="p-4 border-b border-slate-200 dark:border-slate-700 text-sm font-medium">Details</div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                  {librarySelected === null && <div className="text-xs text-slate-500">Select an item to view details.</div>}
                                  {librarySelected !== null && libraryItems[librarySelected] && (
                                    <>
                                      <div className="aspect-video rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <img src={libraryItems[librarySelected].url} alt={libraryItems[librarySelected].altText||''} className="object-contain w-full h-full" />
                                      </div>
                                      <div className="space-y-2 text-xs">
                                        <div className="font-semibold break-all">{libraryItems[librarySelected].altText || 'Untitled'}</div>
                                        {libraryItems[librarySelected].mime && <div className="text-slate-500">{libraryItems[librarySelected].mime}</div>}
                                        {libraryItems[librarySelected].size && <div className="text-slate-500">{(libraryItems[librarySelected].size/1024).toFixed(1)} KB</div>}
                                        {libraryItems[librarySelected].createdAt && <div className="text-slate-500">{new Date(libraryItems[librarySelected].createdAt!).toLocaleDateString()}</div>}
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-slate-500">Alt Text</label>
                                        <textarea value={libraryAlt} onChange={e=> setLibraryAlt(e.target.value)} rows={2} className="w-full resize-none px-2 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Describe the image for accessibility" />
                                        <p className="text-[10px] text-slate-400 leading-snug">Good alt text improves SEO & accessibility.</p>
                                      </div>
                                      <button
                                        onClick={()=> { if(librarySelected!==null) { const item = libraryItems[librarySelected]; handleBasicDataChange('imageUrl', item.url); setLibraryOpen(false); } }}
                                        disabled={librarySelected===null}
                                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-sm font-medium disabled:opacity-40"
                                      >
                                        Use Featured Image
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Quick save box (duplicate button for convenience) */}
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
                      <div className="text-sm font-semibold">Publish</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Status:</span>
                        <span className={basicData.isActive ? 'text-emerald-600' : 'text-slate-600'}>{basicData.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                      <button onClick={handleSave} disabled={autoSaveStatus.status === 'saving' || !basicData.name?.trim()} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-sm font-medium disabled:opacity-50">
                        {autoSaveStatus.status === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {product ? 'Update' : 'Save'}
                      </button>
                      <button onClick={onClose} className="w-full text-center text-[11px] text-slate-500 hover:underline">Close editor</button>
                    </div>
                  </aside>
                </div>
              )}
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="relative -m-6 sm:-m-8 lg:-m-10">{/* stretch to page shell edges */}
        {EditorCore}
      </div>
    );
  }

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[80] pointer-events-none">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <div className="absolute top-16 left-64 right-0 bottom-0 flex pointer-events-auto">
          {EditorCore}
        </div>
      </div>
    </ModalPortal>
  );
};

// Small reusable list editor (features/applications/packs)
interface EditableListBoxProps {
  title: string;
  icon: React.ComponentType<any>;
  items: string[];
  inputPlaceholder: string;
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onReorder: (from:number, to:number)=> void;
  onSave: () => void;
}
const reorderArray = <T,>(arr: T[], from: number, to: number): T[] => {
  const copy = [...arr];
  const [m] = copy.splice(from,1);
  copy.splice(to,0,m);
  return copy;
};
const EditableListBox: React.FC<EditableListBoxProps> = ({ title, icon: Icon, items, inputPlaceholder, inputValue, onInputChange, onAdd, onRemove, onReorder, onSave }) => {
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } };
  const dragFrom = useRef<number | null>(null);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Icon className="h-4 w-4" /><h3 className="text-sm font-semibold">{title}</h3></div>
        <button onClick={onSave} className="text-[11px] font-medium px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">Save</button>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          value={inputValue}
            onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={inputPlaceholder}
          className="flex-1 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
        />
        <button onClick={onAdd} disabled={!inputValue.trim()} className="px-3 py-2 rounded-md bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white text-xs font-semibold disabled:opacity-40">Add</button>
      </div>
      <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {items.length === 0 && <li className="text-xs text-slate-500">No items yet.</li>}
        {items.map((it, i) => (
          <li
            key={i}
            draggable
            onDragStart={()=> { dragFrom.current = i; }}
            onDragOver={e=> { e.preventDefault(); e.dataTransfer.dropEffect='move'; }}
            onDrop={e=> { e.preventDefault(); if(dragFrom.current===null) return; if(dragFrom.current!==i) onReorder(dragFrom.current, i); dragFrom.current=null; }}
            className="group flex items-center gap-3 text-sm bg-slate-50 dark:bg-slate-700/40 rounded-md px-2 py-1.5 border border-transparent hover:border-brand-400 cursor-move"
          >
            <span className="text-slate-400 group-hover:text-brand-500"><GripVertical className="h-4 w-4" /></span>
            <span className="flex-1 leading-snug select-none">{it}</span>
            <button onClick={() => onRemove(i)} className="opacity-60 group-hover:opacity-100 text-[11px] text-rose-600 hover:underline">Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
};


export default ProductEditor;
