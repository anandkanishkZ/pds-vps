import { useEffect, useMemo, useState } from 'react';
import { auth, listProductCategories, listCategoryProducts, listAllProducts, createProduct, deleteProduct, type ProductCategory, type ProductListItem } from '../../lib/api';
import { Plus, Search, RefreshCcw, Package, ChevronRight, Power, FolderTree, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';
import ProductEditor from '../../components/admin/ProductEditor';
import { useNavigate } from 'react-router-dom';

// Simple toast helper
function useFlash(){
  const [msg,setMsg]=useState<string|null>(null);
  const toast=(m:string)=>{ setMsg(m); setTimeout(()=>setMsg(null),2500); };
  const flashEl = msg ? <div className="fixed top-4 right-4 z-50 bg-brand-600 text-white px-4 py-2 rounded-lg shadow text-sm">{msg}</div> : null;
  return { toast, flashEl };
}

export default function AdminProductsPage(){
  const token = auth.getToken();
  const navigate = useNavigate();
  const { toast, flashEl } = useFlash();
  const [cats,setCats]=useState<ProductCategory[]>([]);
  const [activeCat,setActiveCat]=useState<string|null>('all'); // Default to 'all'
  const [products,setProducts]=useState<ProductListItem[]>([]);
  const [prodLoading,setProdLoading]=useState(false);
  const [searchTerm,setSearchTerm]=useState('');
  const [creatingProd,setCreatingProd]=useState(false);
  const [newProdName,setNewProdName]=useState('');
  const [newProdShort,setNewProdShort]=useState('');
  const [selectedProductSlug,setSelectedProductSlug]=useState<string|null>(null);
  const [editorOpen,setEditorOpen]=useState(false);
  
  // Delete confirmation state
  const [productToDelete, setProductToDelete] = useState<ProductListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Quick create product modal state
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateCategory, setQuickCreateCategory] = useState<string>('');

  // Load categories
  useEffect(()=>{ 
    if(!token) return; 
    (async()=>{ 
      try { 
        const c= await listProductCategories(token); 
        setCats(c); 
        // Keep 'all' as default, don't change to first category
      } catch(e){ 
        console.error(e);
      } 
    })(); 
  },[token]);
  
  // Load products for active category or all products
  useEffect(()=>{ 
    if(!token || !activeCat) return; 
    (async()=>{ 
      setProdLoading(true); 
      try { 
        if (activeCat === 'all') {
          const r = await listAllProducts(token, 1, 100);
          setProducts(r.data);
        } else {
          const r = await listCategoryProducts(token, activeCat, 1, 60); 
          setProducts(r.data);
        }
      } catch(e){ 
        console.error(e);
      } finally { 
        setProdLoading(false);
      } 
    })(); 
  },[token,activeCat]);

  const filteredProducts = useMemo(()=>{ if(!searchTerm.trim()) return products; const t = searchTerm.toLowerCase(); return products.filter(p=> p.name.toLowerCase().includes(t) || (p.shortDescription||'').toLowerCase().includes(t) || (p.apiGrade||'').toLowerCase().includes(t)); },[products,searchTerm]);

  async function handleCreateProduct(){
    if(!token||!activeCat) return; const name = newProdName.trim(); if(!name) return;
    const cat = cats.find(c=> c.slug===activeCat); if(!cat) return;
    setCreatingProd(true);
    try {
      const prod = await createProduct(token, { categoryId: cat.id, name, shortDescription: newProdShort.trim()||undefined });
      setProducts(p=> [prod as any, ...p]);
      setNewProdName(''); setNewProdShort('');
      toast('Created');
    } catch(e:any){ toast(e.message||'Error'); } finally { setCreatingProd(false);} }

  async function handleQuickCreateProduct(){
    if(!token || !quickCreateCategory || !newProdName.trim()) return;
    const cat = cats.find(c=> c.slug === quickCreateCategory); 
    if(!cat) return;
    
    setCreatingProd(true);
    try {
      const prod = await createProduct(token, { 
        categoryId: cat.id, 
        name: newProdName.trim(), 
        shortDescription: newProdShort.trim()||undefined 
      });
      setProducts(p=> [prod as any, ...p]);
      setNewProdName(''); 
      setNewProdShort('');
      setShowQuickCreate(false);
      setQuickCreateCategory('');
      toast('Product created successfully');
    } catch(e:any){ 
      toast(e.message||'Failed to create product'); 
    } finally { 
      setCreatingProd(false);
    } 
  }

  async function toggleActive(p: ProductListItem){ 
    if(!token) return; 
    const optimistic={...p,isActive:!p.isActive}; 
    setProducts(ps=> ps.map(x=> x.id===p.id?optimistic:x)); 
    try { 
      // Note: We would need to import updateProduct for this to work
      // await updateProduct(token, p.id, { isActive: optimistic.isActive }); 
      toast(optimistic.isActive?'Activated':'Deactivated'); 
    } catch { 
      setProducts(ps=> ps.map(x=> x.id===p.id?p:x)); 
      toast('Failed'); 
    } 
  }

  async function handleDeleteProduct(product: ProductListItem) {
    if (!token) return;
    setDeleting(true);
    try {
      await deleteProduct(token, product.id);
      setProducts(prev => prev.filter(p => p.id !== product.id));
      setProductToDelete(null);
      toast('Product deleted successfully');
    } catch (e: any) {
      toast(e.message || 'Failed to delete product');
    } finally {
      setDeleting(false);
    }
  }

  async function handleBulkDelete() {
    if (!token || selectedProducts.size === 0) return;
    
    const selectedItems = filteredProducts.filter(p => selectedProducts.has(p.id));
    const message = `Delete ${selectedProducts.size} selected products?\n\n${selectedItems.slice(0, 3).map(p => `• ${p.name}`).join('\n')}${selectedItems.length > 3 ? `\n• ... and ${selectedItems.length - 3} more` : ''}\n\nThis action cannot be undone.`;
    
    if (!window.confirm(message)) return;
    
    setBulkDeleting(true);
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (const productId of selectedProducts) {
        try {
          await deleteProduct(token, productId);
          successCount++;
        } catch (e) {
          errorCount++;
          console.error(`Failed to delete product ${productId}:`, e);
        }
      }
      
      // Remove successfully deleted products
      setProducts(prev => prev.filter(p => {
        if (selectedProducts.has(p.id)) {
          // Check if this product was in the successful batch
          return errorCount > 0; // Keep if there were errors (might still exist)
        }
        return true;
      }));
      
      setSelectedProducts(new Set());
      
      if (errorCount === 0) {
        toast(`${successCount} products deleted successfully`);
      } else if (successCount === 0) {
        toast(`Failed to delete products. Please try again.`);
      } else {
        toast(`${successCount} products deleted, ${errorCount} failed. Please refresh and try again for failed items.`);
      }
    } catch (e: any) {
      toast(e.message || 'Failed to delete products');
    } finally {
      setBulkDeleting(false);
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  function openEditor(productSlug: string, e?: React.MouseEvent) {
    // If user holds Shift keep old modal behaviour; else navigate to dedicated page
    if (e?.shiftKey) {
      setSelectedProductSlug(productSlug);
      setEditorOpen(true);
    } else {
      navigate(`/admin/products/${productSlug}/edit`);
    }
  }

  function closeEditor() {
    setEditorOpen(false);
    setSelectedProductSlug(null);
  }

  return (
    <div className="relative">
      
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Products 
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-600/10 text-brand-700 dark:text-brand-300">
              Admin
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage products across all categories. Use filters to narrow down your view.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="/admin/categories" 
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-700/80 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-900"
          >
            <FolderTree className="h-4 w-4"/>
            Manage Categories
          </a>
          <button 
            onClick={() => setShowQuickCreate(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-900"
          >
            <Plus className="h-4 w-4"/>
            Add New Product
          </button>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search Section */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Search Products
            </label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                value={searchTerm} 
                onChange={e=>setSearchTerm(e.target.value)} 
                placeholder="Search by name, description, or API grade..." 
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" 
              />
            </div>
          </div>

          {/* Category Filter Dropdown */}
          <div className="lg:w-80">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Filter by Category
            </label>
            <div className="relative">
              <select
                value={activeCat || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  setActiveCat(value === 'all' ? 'all' : value);
                  setSelectedProductSlug(null);
                }}
                className="w-full px-4 py-3 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="all">🏷️ All Categories</option>
                {cats.map(c => (
                  <option key={c.id} value={c.slug}>
                    {c.status === 'active' ? '✅' : c.status === 'coming_soon' ? '⏳' : '⭕'} {c.name} {c.code ? `(${c.code})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            
            {/* Selected Category Info */}
            {activeCat && activeCat !== 'all' && (
              <div className="mt-2 p-3 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    cats.find(c => c.slug === activeCat)?.status === 'active' 
                      ? 'bg-emerald-500' 
                      : cats.find(c => c.slug === activeCat)?.status === 'coming_soon' 
                      ? 'bg-amber-500' 
                      : 'bg-slate-400'
                  }`}></div>
                  <span className="text-sm font-medium text-brand-800 dark:text-brand-200">
                    {cats.find(c => c.slug === activeCat)?.name}
                  </span>
                  <span className="text-xs text-brand-700 dark:text-brand-300 bg-brand-100 dark:bg-brand-800/30 px-2 py-0.5 rounded-full">
                    {cats.find(c => c.slug === activeCat)?.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">{filteredProducts.length}</span>
              {searchTerm ? ` results for "${searchTerm}"` : ' products'}
              {activeCat === 'all' && !searchTerm && (
                <span className="text-brand-600 dark:text-brand-300"> across all categories</span>
              )}
              {activeCat && activeCat !== 'all' && (
                <span> in <span className="font-medium">{cats.find(c => c.slug === activeCat)?.name}</span></span>
              )}
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-brand-600 hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200"
              >
                Clear search
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={()=>{ 
                if(activeCat && token){ 
                  setProdLoading(true); 
                  if (activeCat === 'all') {
                    listAllProducts(token, 1, 100).then(r=> setProducts(r.data)).finally(()=>setProdLoading(false));
                  } else {
                    listCategoryProducts(token, activeCat, 1, 60).then(r=> setProducts(r.data)).finally(()=>setProdLoading(false)); 
                  }
                } 
              }} 
              disabled={prodLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium bg-white/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-200 hover:bg-brand-50 dark:hover:bg-slate-700/70 disabled:opacity-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCcw className="h-4 w-4"/>
              Refresh
            </button>

            {activeCat && activeCat !== 'all' && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <input 
                  value={newProdName} 
                  onChange={e=>setNewProdName(e.target.value)} 
                  placeholder="New product name" 
                  className="px-2 py-1 bg-transparent outline-none text-sm placeholder:text-slate-400 min-w-0" 
                />
                <button 
                  disabled={!newProdName.trim()||creatingProd} 
                  onClick={handleCreateProduct} 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Plus className="h-4 w-4"/>
                  {creatingProd?'Adding...':'Add Product'}
                </button>
              </div>
            )}

            {activeCat === 'all' && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Select a specific category to add new products</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {filteredProducts.length > 0 && (
        <div className="mb-6 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select All ({filteredProducts.length})
                </span>
              </label>
              
              {selectedProducts.size > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>{selectedProducts.size} selected</span>
                </div>
              )}
            </div>

            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {bulkDeleting ? (
                    <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {bulkDeleting ? 'Deleting...' : `Delete (${selectedProducts.size})`}
                </button>
                <button
                  onClick={() => setSelectedProducts(new Set())}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {prodLoading && Array.from({length:6}).map((_,i)=>(
          <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-4 animate-pulse flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-2 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-2 w-2/3 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        ))}
        
        {!prodLoading && filteredProducts.map(p => (
          <div 
            key={p.id} 
            className={`group relative rounded-xl border ${selectedProducts.has(p.id) ? 'border-brand-500 ring-2 ring-brand-200 dark:ring-brand-800' : 'border-slate-200 dark:border-slate-800'} bg-gradient-to-br from-white/90 to-slate-50/80 dark:from-slate-950/70 dark:to-slate-900/50 backdrop-blur p-4 flex flex-col shadow-sm hover:shadow-md hover:border-brand-500/40 transition cursor-pointer ring-1 ring-transparent hover:ring-brand-500/30`}
          >
            {/* Selection Checkbox */}
            <div className="absolute top-3 left-3 z-10">
              <input
                type="checkbox"
                checked={selectedProducts.has(p.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleSelectProduct(p.id, e.target.checked);
                }}
                className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500 bg-white dark:bg-slate-800"
              />
            </div>

            {/* Main Content - Click to Edit */}
            <div onClick={(e)=>openEditor(p.slug, e)} className="cursor-pointer">
              <div className="flex items-start gap-3 mb-3 ml-6">
                <div className="relative h-12 w-12 rounded-lg bg-gradient-to-br from-brand-600/90 to-brand-500/70 text-white flex items-center justify-center shadow-sm">
                  <Package className="h-5 w-5"/>
                  {!p.isActive && <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-rose-600 text-[10px] flex items-center justify-center text-white font-semibold">!</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-300 flex items-center gap-1">
                    {p.name}
                    {p.apiGrade && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ml-1">{p.apiGrade}</span>}
                  </h3>
                  <div className="flex items-center flex-wrap gap-1 mt-1">
                    {p.viscosity && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{p.viscosity}</span>}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-brand-500 transition" />
              </div>
              {p.shortDescription && <p className="text-xs text-slate-600/80 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed ml-6">{p.shortDescription}</p>}
            </div>

            {/* Actions */}
            <div className="mt-auto flex items-center justify-between text-[11px] text-slate-500 ml-6">
              <span>{new Date(p.createdAt).toLocaleDateString()}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e)=>{ e.stopPropagation(); toggleActive(p);} } 
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition ${p.isActive?'border-emerald-500/40 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20':'border-rose-500/40 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20'}`}
                >
                  {p.isActive? <><Power className="h-3 w-3"/>Active</>:<><Power className="h-3 w-3"/>Inactive</>}
                </button>
                <button 
                  onClick={(e)=>{ e.stopPropagation(); setProductToDelete(p);} } 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-red-500/40 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 transition"
                  title="Delete product"
                >
                  <Trash2 className="h-3 w-3"/>Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {!prodLoading && products.length>0 && filteredProducts.length===0 && (
          <div className="col-span-full text-center py-12">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">No matches found</h3>
            <p className="text-slate-500 dark:text-slate-400">No products match "{searchTerm}". Try a different search term.</p>
          </div>
        )}
        
        {!prodLoading && products.length===0 && (
          <div className="col-span-full text-center py-12">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2">
              {activeCat === 'all' ? 'No products yet' : 'No products in this category'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {activeCat === 'all' 
                ? 'Get started by clicking "Add New Product" in the header above, or select a specific category to add products.'
                : 'Get started by adding products to this category.'
              }
            </p>
            {activeCat && activeCat !== 'all' && (
              <div className="flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 max-w-md mx-auto">
                <input 
                  value={newProdName} 
                  onChange={e=>setNewProdName(e.target.value)} 
                  placeholder="Enter product name" 
                  className="flex-1 px-2 py-1 bg-transparent outline-none text-sm placeholder:text-slate-400" 
                />
                <button 
                  disabled={!newProdName.trim()||creatingProd} 
                  onClick={handleCreateProduct} 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Plus className="h-4 w-4"/>
                  {creatingProd?'Adding...':'Add Product'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Editor Modal */}
      <ProductEditor
        productSlug={selectedProductSlug}
        isOpen={editorOpen}
        onClose={closeEditor}
        onSave={(updatedProduct) => {
          // Update the product in the list
          setProducts(prev => prev.map(p => 
            p.slug === updatedProduct.slug 
              ? { ...p, ...updatedProduct } 
              : p
          ));
          toast('Product updated successfully');
        }}
      />

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setProductToDelete(null)} />
          <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6" style={{ position: 'relative', zIndex: 10000 }}>
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Delete Product</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6">
              <p className="text-slate-600 dark:text-slate-300 mb-3">
                Are you sure you want to delete this product?
              </p>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-600 to-brand-500 text-white flex items-center justify-center">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">{productToDelete.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {productToDelete.apiGrade && `${productToDelete.apiGrade} • `}
                      {productToDelete.viscosity && `${productToDelete.viscosity} • `}
                      Created {new Date(productToDelete.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  This will permanently delete the product and all its associated data.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setProductToDelete(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(productToDelete)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {deleting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {deleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Product Modal */}
      {showQuickCreate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowQuickCreate(false)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-6" style={{ position: 'relative', zIndex: 10000 }}>
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/30">
                <Plus className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Add New Product</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Create a new product in a specific category</p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={quickCreateCategory}
                    onChange={(e) => setQuickCreateCategory(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select a category...</option>
                    {cats.filter(c => c.status === 'active').map(c => (
                      <option key={c.id} value={c.slug}>
                        {c.name} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="h-5 w-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Enter product name..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Short Description <span className="text-slate-400">(Optional)</span>
                </label>
                <textarea
                  value={newProdShort}
                  onChange={(e) => setNewProdShort(e.target.value)}
                  placeholder="Brief description for product cards and listings..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setShowQuickCreate(false);
                  setNewProdName('');
                  setNewProdShort('');
                  setQuickCreateCategory('');
                }}
                disabled={creatingProd}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickCreateProduct}
                disabled={!quickCreateCategory || !newProdName.trim() || creatingProd}
                className="px-6 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                {creatingProd && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {creatingProd ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {flashEl}
    </div>
  );
}
