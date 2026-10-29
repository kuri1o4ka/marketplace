import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ShoppingBag, User, Wallet, Package, Gavel, PlusSquare, ShieldAlert } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import './index.css';

import Catalog from './pages/Catalog';
import ItemDetail from './pages/ItemDetail';
import Login from './pages/Login';
import Cart from './pages/Cart';
import Sell from './pages/Sell';
import WalletPage from './pages/Wallet';
import Auctions from './pages/Auctions';
import Orders from './pages/Orders';
import Moderation from './pages/Moderation';

const queryClient = new QueryClient();

// 1. Выносим анимированные роуты в отдельный компонент
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {/* ВАЖНО: передаем location, чтобы старый компонент не рендерил новый контент */}
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Catalog />} />
          <Route path="/listing/:id" element={<ItemDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/moderation" element={<Moderation />} />
          <Route path="*" element={<div className="text-center mt-32 text-2xl font-serif text-stone-500">404</div>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// 2. Layout теперь не принимает children, а сам рендерит AnimatedRoutes
function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    setIsAuth(!!localStorage.getItem('token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuth(false);
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-polyclothes text-stone-300 sticky top-0 z-50 border-b border-stone-800 shadow-xl">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-serif font-bold tracking-widest text-white hover:text-accent transition-colors">
            POLYCLOTHES<span className="text-accent">.</span>
          </Link>
          
          <nav className="hidden md:flex gap-6 text-sm font-semibold items-center">
            <Link to="/" className={`transition ${location.pathname === '/' ? 'text-white' : 'hover:text-white'}`}>Каталог</Link>
            <Link to="/auctions" className={`transition flex items-center gap-1 ${location.pathname === '/auctions' ? 'text-white' : 'hover:text-white'}`}><Gavel size={16}/> Аукционы</Link>
            {isAuth && (
              <>
                <Link to="/sell" className="hover:text-white transition flex items-center gap-1"><PlusSquare size={16}/> Продать</Link>
                <Link to="/orders" className="hover:text-white transition flex items-center gap-1"><Package size={16}/> Заказы</Link>
                <Link to="/wallet" className="hover:text-white transition flex items-center gap-1"><Wallet size={16}/> Кошелек</Link>
                <Link to="/moderation" className="hover:text-red-400 transition flex items-center gap-1"><ShieldAlert size={16}/> Модерация</Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/cart" className="relative hover:text-white transition p-2">
              <ShoppingBag size={22} />
            </Link>
            {isAuth ? (
              <button onClick={handleLogout} className="text-sm border border-stone-700 hover:border-red-500 hover:text-red-500 px-4 py-2 rounded-full transition">
                Выйти
              </button>
            ) : (
              <Link to="/login" className="flex items-center gap-2 hover:text-white transition border border-stone-700 px-4 py-2 rounded-full text-sm">
                <User size={18} /> Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow relative bg-stone-100">
        <AnimatedRoutes />
      </main>

      <footer className="bg-polyclothes text-stone-400 py-12 border-t border-stone-800">
        <div className="container mx-auto px-6 text-center">
          <div className="text-2xl font-serif text-white mb-2">POLYCLOTHES.</div>
          <p className="text-sm">© 2024 Polyclothes. Маркетплейс одежды.</p>
        </div>
      </footer>
    </div>
  );
}

// 3. Убрали <React.StrictMode> чтобы не было двойного рендера в браузере
ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  </QueryClientProvider>
);