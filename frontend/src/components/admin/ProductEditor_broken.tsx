import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, Save, Eye, Settings, Image as ImageIcon, Tag, Layers, 
  Package, Shield, Upload, Trash2, Plus, Clock, CheckCircle,
  AlertCircle, Camera, FileText, Loader2, ArrowLeft,
  RefreshCw, ExternalLink, BookOpen, Calendar
} from 'lucide-react';
import { auth, updateProduct, getProduct, uploadProductMedia, deleteProductMedia,
         replaceProductFeatures, replaceProductApplications, replaceProductPacks, 
         type ProductDetail } from '../../lib/api';
import ModalPortal from '../ModalPortal';

interface ProductEditorProps {
  productSlug: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (product: ProductDetail) => void;
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
  onSave 
}) => {
  const token = auth.getToken();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('basics');
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({ status: 'idle' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Local state for different sections
  const [basicData, setBasicData] = useState<Partial<ProductDetail>>({});
  const [features, setFeatures] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [packSizes, setPackSizes] = useState<{displayLabel: string}[]>([]);
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  
  // Form inputs
  const [featureInput, setFeatureInput] = useState('');
  const [applicationInput, setApplicationInput] = useState('');
  const [packInput, setPackInput] = useState('');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<number>();

  // Navigation sections
  const sections = [
    { id: 'basics', name: 'Basics', icon: Settings, description: 'Name, descriptions, technical specs' },
    { id: 'media', name: 'Media', icon: ImageIcon, description: 'Images, documents, files' },
    { id: 'features', name: 'Features', icon: Tag, description: 'Product features and benefits' },
    { id: 'applications', name: 'Applications', icon: Layers, description: 'Use cases and applications' },
    { id: 'packaging', name: 'Packaging', icon: Package, description: 'Pack sizes and variants' },
    { id: 'safety', name: 'Safety', icon: Shield, description: 'Health and safety information' },
  ];

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
        setMediaFiles(data.media || []);
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

  // Auto-save functionality
  const triggerAutoSave = useCallback(() => {
    if (!hasUnsavedChanges || !product) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      setAutoSaveStatus({ status: 'saving' });
      try {
        // Convert null values to undefined for API compatibility
        const updateData = {
          ...basicData,
          shortDescription: basicData.shortDescription || undefined,
          longDescription: basicData.longDescription || undefined,
          viscosity: basicData.viscosity || undefined,
          apiGrade: basicData.apiGrade || undefined,
          imageUrl: basicData.imageUrl || undefined,
          healthSafety: basicData.healthSafety || undefined
        };
        await updateProduct(token!, product.id, updateData);
        setAutoSaveStatus({ 
          status: 'saved', 
          lastSaved: new Date(),
          message: 'Auto-saved successfully'
        });
        setHasUnsavedChanges(false);
      } catch (error) {
        setAutoSaveStatus({ 
          status: 'error', 
          message: 'Auto-save failed'
        });
      }
    }, 2000) as any;
  }, [hasUnsavedChanges, product, basicData, token]);

  // Trigger auto-save when data changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      triggerAutoSave();
    }
  }, [hasUnsavedChanges, triggerAutoSave]);

  // Handle basic data changes
  const handleBasicDataChange = (field: string, value: any) => {
    setBasicData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle manual save
  const handleSave = async () => {
    if (!token || !product) return;

    setAutoSaveStatus({ status: 'saving' });
    try {
      // Convert null values to undefined for API compatibility
      const updateData = {
        ...basicData,
        shortDescription: basicData.shortDescription || undefined,
        longDescription: basicData.longDescription || undefined,
        viscosity: basicData.viscosity || undefined,
        apiGrade: basicData.apiGrade || undefined,
        imageUrl: basicData.imageUrl || undefined,
        healthSafety: basicData.healthSafety || undefined
      };
      const updated = await updateProduct(token, product.id, updateData);
      setProduct(updated);
      onSave?.(updated);
      setAutoSaveStatus({ 
        status: 'saved', 
        lastSaved: new Date(),
        message: 'Saved successfully'
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      setAutoSaveStatus({ 
        status: 'error', 
        message: 'Save failed'
      });
    }
  };

  // Handle media upload
  const handleMediaUpload = async (file: File, type: 'image' | 'spec' | 'msds' | 'brochure') => {
    if (!token || !product) return;

    try {
      const media = await uploadProductMedia(token, product.id, file, type);
      setMediaFiles(prev => [...prev, media]);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  // Handle media deletion
  const handleMediaDelete = async (mediaId: string) => {
    if (!token) return;
    
    try {
      await deleteProductMedia(token, mediaId);
      setMediaFiles(prev => prev.filter(m => m.id !== mediaId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Handle feature/application/pack operations
  const addFeature = () => {
    if (featureInput.trim()) {
      setFeatures(prev => [...prev, featureInput.trim()]);
      setFeatureInput('');
      setHasUnsavedChanges(true);
    }
  };

  const addApplication = () => {
    if (applicationInput.trim()) {
      setApplications(prev => [...prev, applicationInput.trim()]);
      setApplicationInput('');
      setHasUnsavedChanges(true);
    }
  };

  const addPackSize = () => {
    if (packInput.trim()) {
      setPackSizes(prev => [...prev, { displayLabel: packInput.trim() }]);
      setPackInput('');
      setHasUnsavedChanges(true);
    }
  };

  // Sync arrays with backend
  const syncFeatures = async () => {
    if (!token || !product) return;
    try {
      await replaceProductFeatures(token, product.id, features);
      setAutoSaveStatus({ status: 'saved', message: 'Features synced' });
    } catch (error) {
      setAutoSaveStatus({ status: 'error', message: 'Sync failed' });
    }
  };

  const syncApplications = async () => {
    if (!token || !product) return;
    try {
      await replaceProductApplications(token, product.id, applications);
      setAutoSaveStatus({ status: 'saved', message: 'Applications synced' });
    } catch (error) {
      setAutoSaveStatus({ status: 'error', message: 'Sync failed' });
    }
  };

  const syncPackSizes = async () => {
    if (!token || !product) return;
    try {
      await replaceProductPacks(token, product.id, packSizes);
      setAutoSaveStatus({ status: 'saved', message: 'Pack sizes synced' });
    } catch (error) {
      setAutoSaveStatus({ status: 'error', message: 'Sync failed' });
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-900/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />
        
        {/* Main Editor Container - Full Screen */}
        <div className="relative h-full w-full bg-white dark:bg-slate-900 shadow-2xl flex">
          
          {/* Sidebar Navigation */}
          <div className="w-80 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.open(`/products/item/${product?.slug}`, '_blank')}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Preview"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                {product?.name || 'Loading...'}
              </h1>
              <p className="text-sm text-slate-500">
                Product Editor
              </p>
            </div>
          </div>

          {/* Auto-save Status */}
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm">
              {autoSaveStatus.status === 'saving' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-slate-600 dark:text-slate-400">Saving...</span>
                </>
              )}
              {autoSaveStatus.status === 'saved' && (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    {autoSaveStatus.lastSaved && 
                      `Saved ${autoSaveStatus.lastSaved.toLocaleTimeString()}`
                    }
                  </span>
                </>
              )}
              {autoSaveStatus.status === 'error' && (
                <>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">
                    {autoSaveStatus.message}
                  </span>
                </>
              )}
              {hasUnsavedChanges && autoSaveStatus.status === 'idle' && (
                <>
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-slate-600 dark:text-slate-400">Unsaved changes</span>
                </>
              )}
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="flex-1 overflow-y-auto p-6">
            <nav className="space-y-3">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      isActive 
                        ? 'bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-600/25 transform scale-105' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:shadow-md'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 to-brand-700/20 animate-pulse"></div>
                    )}
                    <div className="relative flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-base ${
                          isActive ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                        }`}>
                          {section.name}
                        </div>
                        <div className={`text-sm mt-1 ${
                          isActive 
                            ? 'text-brand-100' 
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {section.description}
                        </div>
                      </div>
                      {isActive && (
                        <div className="flex items-center">
                          <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
            <button
              onClick={handleSave}
              disabled={autoSaveStatus.status === 'saving'}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-600/25 hover:shadow-xl hover:shadow-brand-600/30 transform hover:scale-105"
            >
              {autoSaveStatus.status === 'saving' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.open(`/products/item/${product?.slug}`, '_blank')}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </button>
              
              <button
                onClick={() => setActiveSection('basics')}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Content Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-brand-100 dark:bg-brand-900/50 rounded-lg">
                    {React.createElement(sections.find(s => s.id === activeSection)?.icon || Settings, {
                      className: "h-5 w-5 text-brand-600 dark:text-brand-400"
                    })}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {sections.find(s => s.id === activeSection)?.name}
                  </h2>
                </div>
                <p className="text-base text-slate-600 dark:text-slate-400">
                  {sections.find(s => s.id === activeSection)?.description}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {product && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {product.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      Created {new Date(product.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  product?.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {product?.isActive ? '🟢 Active' : '⏸️ Inactive'}
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                  <span className="text-lg font-medium text-slate-600 dark:text-slate-400">Loading product...</span>
                  <div className="w-32 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-600 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl">
                {/* Render different sections based on activeSection */}
                {activeSection === 'basics' && (
                  <BasicsSection 
                    data={basicData} 
                    onChange={handleBasicDataChange}
                    fileInputRef={fileInputRef}
                    onMediaUpload={handleMediaUpload}
                  />
                )}
                
                {activeSection === 'media' && (
                  <MediaSection 
                    media={mediaFiles}
                    onUpload={handleMediaUpload}
                    onDelete={handleMediaDelete}
                    fileInputRef={fileInputRef}
                  />
                )}
                
                {activeSection === 'features' && (
                  <FeaturesSection 
                    features={features}
                    input={featureInput}
                    onInputChange={setFeatureInput}
                    onAdd={addFeature}
                    onRemove={(index) => setFeatures(prev => prev.filter((_, i) => i !== index))}
                    onSync={syncFeatures}
                  />
                )}
                
                {activeSection === 'applications' && (
                  <ApplicationsSection 
                    applications={applications}
                    input={applicationInput}
                    onInputChange={setApplicationInput}
                    onAdd={addApplication}
                    onRemove={(index) => setApplications(prev => prev.filter((_, i) => i !== index))}
                    onSync={syncApplications}
                  />
                )}
                
                {activeSection === 'packaging' && (
                  <PackagingSection 
                    packSizes={packSizes}
                    input={packInput}
                    onInputChange={setPackInput}
                    onAdd={addPackSize}
                    onRemove={(index) => setPackSizes(prev => prev.filter((_, i) => i !== index))}
                    onSync={syncPackSizes}
                  />
                )}
                
                {activeSection === 'safety' && (
                  <SafetySection 
                    data={basicData}
                    onChange={handleBasicDataChange}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

// Individual Section Components
const BasicsSection: React.FC<{
  data: Partial<ProductDetail>;
  onChange: (field: string, value: any) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onMediaUpload: (file: File, type: any) => void;
}> = ({ data, onChange, fileInputRef, onMediaUpload }) => (
  <div className="space-y-6">
    {/* Hero Image */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Camera className="h-5 w-5 text-brand-600" />
        Hero Image
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-brand-500 transition-all duration-200 flex flex-col items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20"
          >
            <Upload className="h-10 w-10" />
            <div className="text-center">
              <div className="font-medium text-base">Upload new image</div>
              <div className="text-sm mt-1">PNG, JPG up to 10MB</div>
            </div>
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onMediaUpload(file, 'image');
            }}
          />
        </div>
        
        <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-600">
          {data.imageUrl ? (
            <img 
              src={data.imageUrl} 
              alt={data.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">No image uploaded</p>
                <p className="text-xs text-slate-400 mt-1">Upload an image to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Basic Information */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <FileText className="h-5 w-5 text-brand-600" />
        Basic Information
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Product Name *
            </label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 text-base placeholder:text-slate-400"
              placeholder="Enter product name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Viscosity
            </label>
            <input
              type="text"
              value={data.viscosity || ''}
              onChange={(e) => onChange('viscosity', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 text-base placeholder:text-slate-400"
              placeholder="e.g., 15W-40"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              API Grade
            </label>
            <input
              type="text"
              value={data.apiGrade || ''}
              onChange={(e) => onChange('apiGrade', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 text-base placeholder:text-slate-400"
              placeholder="e.g., CF-4"
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Short Description
            </label>
            <textarea
              value={data.shortDescription || ''}
              onChange={(e) => onChange('shortDescription', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 resize-none text-base placeholder:text-slate-400"
              placeholder="Brief product description for listings..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              Status
              <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                Active products are visible to customers
              </span>
            </label>
            <select
              value={data.isActive ? 'active' : 'inactive'}
              onChange={(e) => onChange('isActive', e.target.value === 'active')}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 text-base"
            >
              <option value="active">✅ Active</option>
              <option value="inactive">⏸️ Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    {/* Detailed Description */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-brand-600" />
        Detailed Description
      </h3>
      
      <textarea
        value={data.longDescription || ''}
        onChange={(e) => onChange('longDescription', e.target.value)}
        rows={10}
        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all duration-200 resize-none text-base placeholder:text-slate-400"
        placeholder="Detailed product description, specifications, and benefits...

Example:
• High-performance diesel engine oil
• Designed for heavy-duty applications  
• Extended drain intervals
• Superior thermal stability
• Meets API CF-4 specifications"
      />
      
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div className="text-sm text-slate-600 dark:text-slate-400">
          💡 <strong>Pro tip:</strong> This will be displayed on the product detail page. Include technical specifications, benefits, and detailed information to help customers make informed decisions.
        </div>
      </div>
    </div>
  </div>
);

const MediaSection: React.FC<{
  media: any[];
  onUpload: (file: File, type: any) => void;
  onDelete: (mediaId: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}> = ({ media, onUpload, onDelete, fileInputRef }) => (
  <div className="space-y-6">
    {/* Upload Area */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Upload Media</h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { type: 'image', label: 'Images', icon: ImageIcon, accept: 'image/*' },
          { type: 'spec', label: 'Spec Sheet', icon: FileText, accept: '.pdf,.doc,.docx' },
          { type: 'msds', label: 'MSDS', icon: Shield, accept: '.pdf,.doc,.docx' },
          { type: 'brochure', label: 'Brochure', icon: BookOpen, accept: '.pdf,.doc,.docx' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = item.accept;
                  fileInputRef.current.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) onUpload(file, item.type);
                  };
                  fileInputRef.current.click();
                }
              }}
              className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-brand-500 transition-colors flex flex-col items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-brand-600"
            >
              <Icon className="h-8 w-8" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      
      <input ref={fileInputRef} type="file" className="hidden" />
    </div>

    {/* Media Gallery */}
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Media Gallery</h3>
      
      {media.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {media.map((item) => (
            <div key={item.id} className="relative group bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden aspect-square">
              {item.type === 'image' ? (
                <img src={item.url} alt={item.altText || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 dark:text-slate-300">
                  <FileText className="h-8 w-8 mb-2" />
                  <span className="text-xs font-medium uppercase">{item.type}</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => window.open(item.url, '_blank')}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No media files uploaded yet</p>
          <p className="text-sm">Upload images, documents, and brochures above</p>
        </div>
      )}
    </div>
  </div>
);

const FeaturesSection: React.FC<{
  features: string[];
  input: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onSync: () => void;
}> = ({ features, input, onInputChange, onAdd, onRemove, onSync }) => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Product Features</h3>
        <button
          onClick={onSync}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Sync Changes
        </button>
      </div>
      
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder="Add a new feature"
          className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
        />
        <button
          onClick={onAdd}
          disabled={!input.trim()}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
            <Tag className="h-4 w-4 text-slate-400" />
            <span className="flex-1 text-slate-900 dark:text-slate-100">{feature}</span>
            <button
              onClick={() => onRemove(index)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        
        {features.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No features added yet</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const ApplicationsSection: React.FC<{
  applications: string[];
  input: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onSync: () => void;
}> = ({ applications, input, onInputChange, onAdd, onRemove, onSync }) => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Applications</h3>
        <button
          onClick={onSync}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Sync Changes
        </button>
      </div>
      
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder="Add an application"
          className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
        />
        <button
          onClick={onAdd}
          disabled={!input.trim()}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      
      <div className="space-y-3">
        {applications.map((application, index) => (
          <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
            <Layers className="h-4 w-4 text-slate-400" />
            <span className="flex-1 text-slate-900 dark:text-slate-100">{application}</span>
            <button
              onClick={() => onRemove(index)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        
        {applications.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No applications added yet</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const PackagingSection: React.FC<{
  packSizes: {displayLabel: string}[];
  input: string;
  onInputChange: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onSync: () => void;
}> = ({ packSizes, input, onInputChange, onAdd, onRemove, onSync }) => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Package Sizes</h3>
        <button
          onClick={onSync}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Sync Changes
        </button>
      </div>
      
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder="Add package size (e.g., 1 Liter, 5L, 20L)"
          className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
        />
        <button
          onClick={onAdd}
          disabled={!input.trim()}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {packSizes.map((pack, index) => (
          <div key={index} className="relative group p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-slate-400" />
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{pack.displayLabel}</span>
            <button
              onClick={() => onRemove(index)}
              className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {packSizes.length === 0 && (
          <div className="col-span-full text-center py-8 text-slate-500 dark:text-slate-400">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No package sizes added yet</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const SafetySection: React.FC<{
  data: Partial<ProductDetail>;
  onChange: (field: string, value: any) => void;
}> = ({ data, onChange }) => (
  <div className="space-y-6">
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <Shield className="h-5 w-5 text-brand-600" />
        Health & Safety Information
      </h3>
      
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium mb-1">Important Safety Notice</p>
              <p>This information will be displayed on the product page and should include all relevant safety guidelines, handling instructions, and regulatory compliance information.</p>
            </div>
          </div>
        </div>
        
        <textarea
          value={data.healthSafety || ''}
          onChange={(e) => onChange('healthSafety', e.target.value)}
          rows={12}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors resize-none"
          placeholder="Enter health and safety information including:

• Handling and storage instructions
• Safety precautions and warnings
• Personal protective equipment requirements
• First aid measures
• Environmental considerations
• Regulatory compliance information
• Emergency contact information

This information should comply with local safety regulations and industry standards."
        />
        
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Include all relevant safety information, handling instructions, storage requirements, and regulatory compliance details.
        </div>
      </div>
    </div>
  </div>
);

export default ProductEditor;
