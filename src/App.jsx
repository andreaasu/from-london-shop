import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Bag from "./pages/Bag";
import Checkout from "./pages/Checkout";
import Confirmation from "./pages/Confirmation";
import Wishlist from "./pages/Wishlist";

import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { FilterProvider } from './context/FilterContext';

// Lazy Load Pages

// Lazy Load Admin Pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./layout/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const ProductForm = lazy(() => import('./pages/admin/ProductForm'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));

// Auth & Admin Route
import { AuthProvider } from './context/AuthContext';
import AdminRoute from './routes/AdminRoute';

// Import static pages from the single file we created (named exports)
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { About, Contact, NotFound } from './pages/StaticPages';

function App() {
  const PageLoader = () => (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#333'
    }}>
      Loading...
    </div>
  );

  return (
    <ErrorBoundary>
      <AuthProvider>
        <FilterProvider>
          <WishlistProvider>
            <CartProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Layout />}>
                  <Route index element={
                    <Suspense fallback={<PageLoader />}>
                      <Home />
                    </Suspense>
                  } />
                  <Route path="shop" element={
                    <Suspense fallback={<PageLoader />}>
                      <Shop />
                    </Suspense>
                  } />
                  <Route path="product/:id" element={
                    <Suspense fallback={<PageLoader />}>
                      <ProductDetails />
                    </Suspense>
                  } />
                  <Route path="bag" element={
                    <Suspense fallback={<PageLoader />}>
                      <Bag />
                    </Suspense>
                  } />
                  <Route path="checkout" element={
                    <Suspense fallback={<PageLoader />}>
                      <Checkout />
                    </Suspense>
                  } />
                  <Route path="order-confirmation" element={
                    <Suspense fallback={<PageLoader />}>
                      <Confirmation />
                    </Suspense>
                  } />
                  <Route path="wishlist" element={
                    <Suspense fallback={<PageLoader />}>
                      <Wishlist />
                    </Suspense>
                  } />
                  <Route path="about" element={<About />} />
                  <Route path="contact" element={<Contact />} />
                </Route>

                {/* Admin Login */}
                <Route path="/admin/login" element={
                  <Suspense fallback={<PageLoader />}>
                    <AdminLogin />
                  </Suspense>
                } />

                {/* Protected Admin Routes */}
                <Route path="/admin" element={<AdminRoute />}>
                  <Route element={
                    <Suspense fallback={<PageLoader />}>
                      <AdminLayout />
                    </Suspense>
                  }>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<ProductForm />} />
                    <Route path="products/:id" element={<ProductForm />} />
                    <Route path="orders" element={<AdminOrders />} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </WishlistProvider>
        </FilterProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
