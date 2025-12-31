import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';
import { ScrollToTop } from './ScrollToTop'; // We'll create this to reset scroll on route change

export default function Layout() {
    return (
        <div className="flex flex-col min-h-screen">
            <ScrollToTop />
            <AnnouncementBar />
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
