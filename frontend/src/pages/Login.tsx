import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Lock, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      
      // Отправляем и display_name, и displayName на всякий случай
      const payload = isLogin 
        ? { email, password } 
        : { email, password, display_name: displayName, displayName: displayName };
      
      console.log("ОТПРАВЛЯЕМ НА БЭКЕНД:", payload); // <--- Смотри сюда в консоль браузера (F12)
      
      const { data } = await api.post(endpoint, payload);
      localStorage.setItem('token', data.token);
      navigate('/');
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data || 'Ошибка авторизации');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center blur-sm scale-105"></div>
      <div className="absolute inset-0 bg-polyclothes/60 backdrop-blur-sm"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-white/90 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md border border-white/20"
      >
        <h1 className="text-4xl font-serif font-bold text-polyclothes text-center mb-2">
          {isLogin ? 'С возвращением' : 'Создать аккаунт'}
        </h1>
        <p className="text-center text-stone-500 mb-8 text-sm">
          {isLogin ? 'Войдите в свой личный архив' : 'Присоединяйтесь к POLYCLOTHES'}
        </p>

        {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm text-center font-medium border border-red-100">{error}</motion.div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-accent transition" size={20} />
              <input 
                type="text" placeholder="Ваше имя" required
                value={displayName} onChange={e => setDisplayName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-stone-50/50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
              />
            </div>
          )}
          
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-accent transition" size={20} />
            <input 
              type="email" placeholder="Email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-stone-50/50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-accent transition" size={20} />
            <input 
              type="password" placeholder="Пароль (мин. 8 символов)" required minLength={8}
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-stone-50/50 border border-stone-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent focus:bg-white transition-all"
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="w-full bg-polyclothes text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition shadow-xl mt-2"
          >
            {isLogin ? 'Войти в систему' : 'Зарегистрироваться'}
          </motion.button>
        </form>

        <div className="mt-8 text-center text-sm text-stone-500">
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-accent font-bold hover:underline transition">
            {isLogin ? 'Создать' : 'Войти'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}