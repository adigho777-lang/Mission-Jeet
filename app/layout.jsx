import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TelegramPopup from './components/TelegramPopup';
import NotificationInit from './components/NotificationInit';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata = {
  title: 'Mission JEET',
  description: 'Crack JEE & NEET with Mission JEET',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/mission-jeet.jpg" type="image/jpeg" />
        <link rel="shortcut icon" href="/mission-jeet.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/mission-jeet.jpg" />
      </head>
      <body className="bg-white antialiased" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          <div className="pt-[72px]">
            {children}
            <Footer />
          </div>
          <TelegramPopup />
          <NotificationInit />
        </AuthProvider>
      </body>
    </html>
  );
}
