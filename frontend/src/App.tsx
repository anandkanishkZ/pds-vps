import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import CategoryProductsPage from './pages/CategoryProducts';
import ProductItemDetailPage from './pages/ProductItemDetail';
import DieselProductDetail from './pages/DieselProductDetail';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import DealershipInquiry from './pages/DealershipInquiry';
import DieselEngineOil from './pages/DieselEngineOil';
import NotFound from './pages/NotFound';
import Career from './pages/Career';
import Gallery from './pages/Gallery';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import AdminProductsPage from './pages/admin/Products';
import AdminEditProductPage from './pages/admin/EditProduct';
import AdminCategoriesPage from './pages/admin/Categories';
import MediaLibrary from './pages/admin/MediaLibrary';
import AdminInquiriesPage from './pages/admin/Inquiries';
import AdminDealershipInquiriesPage from './pages/admin/DealershipInquiries';
import AdminGalleryPage from './pages/admin/Gallery';
import AdminCareersPage from './pages/admin/Careers';
import CareerApplications from './pages/admin/CareerApplications';
import AdminJobForm from './pages/admin/CareerJobForm';
import AdminLeadershipPage from './pages/admin/Leadership';
import AdminHeroSlidesPage from './pages/admin/HeroSlides';

import { useEffect } from 'react';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Use smooth scroll for small transitions, instant for large distance
    if (typeof window !== 'undefined') {
      const distance = Math.abs(window.scrollY);
      window.scrollTo({ top: 0, behavior: distance > 1200 ? 'auto' : 'smooth' });
    }
  }, [pathname]);
  return null;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        {/* Hide public Navbar/Footer on /admin routes by checking location in route structure */}
        <ScrollToTop />
        <Routes>
          {/* Admin routes (no public header/footer) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/:productSlug/edit" element={<AdminEditProductPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="media" element={<MediaLibrary />} />
            <Route path="gallery" element={<AdminGalleryPage />} />
            <Route path="hero-slides" element={<AdminHeroSlidesPage />} />
            <Route path="inquiries" element={<AdminInquiriesPage />} />
            <Route path="dealership-inquiries" element={<AdminDealershipInquiriesPage />} />
            <Route path="careers" element={<AdminCareersPage />} />
            <Route path="careers/applications" element={<CareerApplications />} />
            <Route path="careers/new" element={<AdminJobForm />} />
            <Route path="careers/edit/:id" element={<AdminJobForm />} />
            <Route path="leadership" element={<AdminLeadershipPage />} />
            <Route path="settings" element={<Settings />} />
            {/* Future nested routes: products, inquiries */}
          </Route>

          {/* Public routes with Navbar/Footer */}
          <Route
            path="/*"
            element={
              <>
                <Navbar />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/category/:categorySlug" element={<CategoryProductsPage />} />
                    <Route path="/products/item/:productSlug" element={<ProductItemDetailPage />} />
                    <Route path="/products/diesel-engine-oil" element={<DieselEngineOil />} />
                    <Route path="/products/diesel-engine-oil/:dieselId" element={<DieselProductDetail />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/career" element={<Career />} />
                    <Route path="/dealership-inquiry" element={<DealershipInquiry />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    {/* Auth */}
                    <Route path="/login" element={<Login />} />
                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </>
            }
          />
        </Routes>

        {/* Global Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </div>
    </Router>
  );
}

export default App;