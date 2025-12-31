import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { FilterProvider } from './context/FilterContext';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Bag = lazy(() => import('./pages/Bag'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Confirmation = lazy(() => import('./pages/Confirmation'));
const Wishlist = lazy(() => import('./pages/Wishlist'));

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
      <FilterProvider>
        <WishlistProvider>
          <CartProvider>
            <Routes>
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
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </CartProvider>
        </WishlistProvider>
      </FilterProvider>
    </ErrorBoundary>
  );
}

export default App;
