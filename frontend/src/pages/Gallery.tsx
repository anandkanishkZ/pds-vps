import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ZoomIn, Calendar, MapPin, Eye, ChevronLeft, ChevronRight, Filter, Search, Star } from 'lucide-react';
import { listGalleryItems } from '../lib/api';
import { SEO } from '../components/SEO';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
  date: string;
  location: string;
  featured: boolean;
}

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimated, setIsAnimated] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(24);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsAnimated(true);
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listGalleryItems({ pageSize: 100 });
      
      // Map API response to our interface
      const items: GalleryItem[] = response.data.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        imageUrl: item.imageUrl,
        description: item.description || '',
        date: item.date,
        location: item.location || '',
        featured: item.featured
      }));
      
      setGalleryItems(items);
    } catch (err) {
      console.error('Failed to load gallery items:', err);
      setError('Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'facility', 'products', 'events', 'achievements'];
  
  const filteredItems = useMemo(() => {
    let items = activeFilter === 'all' ? galleryItems : galleryItems.filter(i => i.category === activeFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeFilter, galleryItems, searchTerm]);

  const featuredItems = galleryItems.filter(item => item.featured);

  const openModal = (item: GalleryItem) => {
    setSelectedImage(item);
    setCurrentIndex(galleryItems.indexOf(item));
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const nextImage = useCallback(() => {
    const nextIndex = (currentIndex + 1) % galleryItems.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(galleryItems[nextIndex]);
  }, [currentIndex, galleryItems]);

  const prevImage = useCallback(() => {
    const prevIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    setCurrentIndex(prevIndex);
    setSelectedImage(galleryItems[prevIndex]);
  }, [currentIndex, galleryItems]);

  // Keyboard navigation for modal
  useEffect(() => {
    if (!selectedImage) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      else if (e.key === 'ArrowRight') nextImage();
      else if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedImage, nextImage, prevImage]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredItems.length;

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'facility': return 'Facilities';
      case 'products': return 'Products';
      case 'events': return 'Events';
      case 'achievements': return 'Achievements';
      default: return 'All Categories';
    }
  };

  // Structured data (limit to first 20 images for payload size)
  const imageObjects = galleryItems.slice(0, 20).map(img => ({
    '@type': 'ImageObject',
    contentUrl: img.imageUrl,
    caption: img.title,
    datePublished: img.date
  }));
  const galleryJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: 'Power Drive Solution Gallery',
    description: 'Images of facilities, products, events and achievements.',
    dateCreated: galleryItems[0]?.date || new Date().toISOString(),
    image: imageObjects
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <SEO title="Gallery | Power Drive Solution" description="Explore photos of our facilities, products, events and achievements." />
        <div className="pt-32 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Gallery</h1>
              <p className="text-lg text-gray-200">Loading our gallery...</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
        <SEO title="Gallery | Power Drive Solution" description="Explore photos of our facilities, products, events and achievements." />
        <div className="pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Gallery</h1>
            <p className="text-lg text-gray-200 mb-8">{error}</p>
            <button
              onClick={loadGalleryItems}
              className="bg-[#fec216] hover:bg-[#fdb913] text-[#06477f] px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <SEO title="Gallery | Power Drive Solution" description="Explore photos of our facilities, products, events and achievements." jsonLd={galleryJsonLd} />
      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 overflow-hidden bg-[#06477f]">
        <div className="container mx-auto px-4 relative z-10">
          <div className={`text-center transition-all duration-1000 ${isAnimated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Our Gallery
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8 leading-relaxed">
              Explore our world-class facilities, premium products, and memorable moments. 
              Witness the excellence that drives Power Drive Solution forward.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-white/70">
              <Eye className="h-4 w-4" />
              <span>{galleryItems.length} Images</span>
              <span className="mx-2">•</span>
              <Calendar className="h-4 w-4" />
              <span>Updated Daily</span>
            </div>
          </div>
        </div>
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-64 h-64 bg-[#fec216]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 -left-10 w-80 h-80 bg-[#ffffff]/10 rounded-full blur-2xl" />
        </div>
      </section>

      {/* Featured Gallery Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-12 transition-all duration-1000 delay-300 ${isAnimated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Featured Highlights
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Our most impactful moments and achievements
            </p>
          </div>

          <div className={`grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 transition-all duration-1000 delay-500 ${isAnimated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
            {featuredItems.map((item, index) => {
              const loaded = imageLoaded[item.id];
              return (
                <button
                  key={item.id}
                  aria-label={`Open image ${item.title}`}
                  className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#fec216]/40 bg-white/5 backdrop-blur-sm"
                  onClick={() => openModal(item)}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="aspect-square overflow-hidden relative">
                    {/* Skeleton placeholder */}
                    <div
                      className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse transition-opacity duration-500 ${loaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                      aria-hidden={loaded}
                    />
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      onLoad={() => setImageLoaded(l => ({ ...l, [item.id]: true }))}
                      className={`w-full h-full object-cover transition-all duration-700 ${loaded ? 'scale-100 blur-0 opacity-100' : 'scale-105 blur-sm opacity-0'} group-hover:scale-110`}
                      loading="lazy"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-bold text-lg mb-1 line-clamp-2 flex items-start gap-2">{item.featured && <Star className="h-5 w-5 text-[#fec216]" />}{item.title}</h3>
                      <div className="flex items-center text-sm opacity-90">
                        <MapPin className="h-3 w-3 mr-1" />
                        {item.location}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                        <ZoomIn className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full Gallery Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-12 transition-all duration-1000 delay-700 ${isAnimated ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
            <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Complete Gallery
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Browse through our comprehensive image collection
            </p>
          </div>

          {/* Search + Category Filter */}
          <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10 transition-all duration-1000 delay-900 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => { setActiveFilter(category); setVisibleCount(24); }}
                  className={`px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 flex items-center gap-2 border ${
                    activeFilter === category
                      ? 'bg-[#06477f] text-white border-[#06477f] shadow-lg'
                      : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-[#06477f] hover:text-white'
                  }`}
                  aria-pressed={activeFilter === category}
                >
                  <Filter className="h-4 w-4" />
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(24); }}
                className="w-full pl-9 pr-4 py-2 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#06477f] dark:focus:ring-[#fec216] text-sm"
              />
            </div>
          </div>

          {/* Gallery Grid */}
      <ul className={`grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-700 delay-300 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} aria-live="polite">
            {visibleItems.map((item, index) => {
              const loaded = imageLoaded[item.id];
              return (
                <li key={item.id} className="list-none">
                  <button
                    onClick={() => openModal(item)}
          className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer bg-white dark:bg-gray-800 w-full text-left focus:outline-none focus:ring-2 focus:ring-[#06477f] dark:focus:ring-[#fec216]"
                    style={{ animationDelay: `${index * 40}ms` }}
                    aria-label={`Open image ${item.title}`}
                  >
                    <div className="aspect-[4/3] overflow-hidden relative">
                      {/* Skeleton placeholder */}
                      <div
                        className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse transition-opacity duration-500 ${loaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                        aria-hidden={loaded}
                      />
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        onLoad={() => setImageLoaded(l => ({ ...l, [item.id]: true }))}
            className={`w-full h-full object-cover transition-all duration-500 ${loaded ? 'scale-100 blur-0 opacity-100' : 'scale-105 blur-sm opacity-0'} group-hover:scale-105`}
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          item.category === 'facility' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          item.category === 'products' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          item.category === 'events' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {getCategoryLabel(item.category)}
                        </span>
                        {item.featured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#fec216] bg-[#fec216]/10 px-2 py-1 rounded-full">
                            <Star className="h-3 w-3" /> Featured
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2 group-hover:text-[#06477f] dark:group-hover:text-[#fec216] transition-colors duration-300">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 min-h-[32px]">
                        {item.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center max-w-[50%] truncate">
                          <MapPin className="h-3 w-3 mr-1 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-500" />
                  </button>
                </li>
              );
            })}
          </ul>

          {canLoadMore && (
            <div className="flex justify-center mt-12">
              <button
                onClick={() => setVisibleCount(c => c + 24)}
                className="px-8 py-3 rounded-full bg-[#06477f] hover:bg-[#053961] text-white font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-[#06477f]/40"
              >
                Load More ({filteredItems.length - visibleCount} remaining)
              </button>
            </div>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Eye className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                No gallery items found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                {activeFilter === 'all' 
                  ? 'No gallery items have been added yet. Check back later for updates.'
                  : `No ${getCategoryLabel(activeFilter).toLowerCase()} items found. Try selecting a different category.`
                }
              </p>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="bg-[#06477f] hover:bg-[#053961] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  View All Categories
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={closeModal}>
          <div className="relative w-full max-w-6xl h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row" onClick={(e)=>e.stopPropagation()}>
            {/* Image Area */}
            <div className="relative flex-1 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="max-h-full max-w-full object-contain select-none" draggable={false}
              />
              {/* Navigation zones */}
              <button onClick={prevImage} aria-label="Previous image" className="hidden md:flex absolute left-0 top-0 h-full w-16 items-center justify-center text-gray-500 hover:text-white bg-black/0 hover:bg-black/20 transition-colors">
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button onClick={nextImage} aria-label="Next image" className="hidden md:flex absolute right-0 top-0 h-full w-16 items-center justify-center text-gray-500 hover:text-white bg-black/0 hover:bg-black/20 transition-colors">
                <ChevronRight className="h-8 w-8" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/80 bg-black/40 px-3 py-1 rounded-full tracking-wide">
                {currentIndex + 1} / {galleryItems.length}
              </div>
            </div>
            {/* Meta Panel */}
            <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  {selectedImage.featured && <Star className="h-5 w-5 text-[#fec216]" />}
                  <span className="line-clamp-2 leading-snug">{selectedImage.title}</span>
                </h3>
                <button onClick={closeModal} aria-label="Close" className="ml-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto text-sm leading-relaxed space-y-5">
                {selectedImage.description && (
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{selectedImage.description}</p>
                )}
                <div className="grid grid-cols-1 gap-3 text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Details</div>
                  <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-gray-400" /> {new Date(selectedImage.date).toLocaleDateString()}</div>
                  {selectedImage.location && <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-gray-400" /> {selectedImage.location}</div>}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-[11px] font-medium">
                      {getCategoryLabel(selectedImage.category)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Thumbnail strip */}
              {galleryItems.length > 1 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <div className="flex gap-2 overflow-x-auto scrollbar-thin" aria-label="Thumbnails">
                    {galleryItems.slice(0, 30).map((g, i) => (
                      <button
                        key={g.id}
                        onClick={() => { setCurrentIndex(i); setSelectedImage(g); }}
                        aria-label={`View image ${g.title}`}
                        className={`relative flex-shrink-0 w-14 h-14 rounded border ${i === currentIndex ? 'border-[#06477f] ring-2 ring-[#06477f]/40' : 'border-gray-200 dark:border-gray-700 hover:border-[#06477f]'}`}
                      >
                        <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover rounded" />
                        {g.featured && <Star className="absolute top-1 right-1 h-3 w-3 text-[#fec216] drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

  {/* Floating Elements subtle */}
  <div className="pointer-events-none fixed top-24 left-10 w-20 h-20 bg-[#fec216]/10 rounded-full blur-xl animate-pulse opacity-60" style={{ animationDelay: '2s' }} />
  <div className="pointer-events-none fixed bottom-24 right-10 w-32 h-32 bg-[#06477f]/10 rounded-full blur-2xl animate-pulse opacity-50" style={{ animationDelay: '3s' }} />
    </div>
  );
};

export default Gallery;
