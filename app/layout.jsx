import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TelegramPopup from './components/TelegramPopup';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata = {
  title: 'Mission JEET',
  description: 'Crack JEE & NEET with Mission JEET',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white antialiased" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <div className="pt-[72px]">
            {children}
            <Footer />
          </div>
          <TelegramPopup />
        </AuthProvider>
      </body>
    </html>
  );
}
