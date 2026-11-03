import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';
import { ScrollToTop } from './ScrollToTop'; // We'll create this to reset scroll on route change

export default function Layout() {
    return (
        <div className="flex flex-col min-h-screen">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:p-4">Skip to content</a>
            <ScrollToTop />
            <AnnouncementBar />
            <Navbar />
            <main id="main-content" tabIndex={-1} className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
