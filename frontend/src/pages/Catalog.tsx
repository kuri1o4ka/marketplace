import { Link } from 'react-router-dom';
import { useListings } from '../api';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Catalog() {
  const { data: listings, isLoading, isError } = useListings();

  if (isLoading) return <div className="text-center mt-32 text-xl font-serif text-stone-500 animate-pulse">Загрузка каталога...</div>;
  if (isError) return <div className="text-center mt-32 text-xl text-red-500">Ошибка. Бэкенд мертв?</div>;

  return (
    <div>
      <div className="bg-polyclothes text-white py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"></div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto relative z-10 text-center"
        >
          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">Твой стиль.<br/><span className="text-accent italic">Твой гардероб.</span></h1>
          <p className="text-lg md:text-xl text-stone-300 mb-10 max-w-2xl mx-auto">Покупай и продавай брендовую, редкую и коллекционную одежду. Каждая вещь проверена экспертами и AI.</p>
          
          <div className="max-w-2xl mx-auto relative">
            <input type="text" placeholder="Поиск бренда или категории..." className="w-full py-4 px-6 pr-12 rounded-full text-polyclothes focus:outline-none focus:ring-2 focus:ring-accent" />
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400" />
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-8 border-b border-stone-300 pb-4">
          <h2 className="text-3xl font-serif font-bold text-polyclothes">Свежие поступления</h2>
          <div className="flex gap-2">
            <button className="text-sm font-semibold px-4 py-2 border border-stone-300 rounded-full hover:bg-stone-200 transition">Все</button>
            <button className="text-sm font-semibold px-4 py-2 border border-stone-300 rounded-full hover:bg-stone-200 transition">Аукционы</button>
          </div>
        </div>

        {listings?.length === 0 ? (
          <div className="text-center py-20 text-stone-500">Пока пусто. Добавь вещи через pgAdmin.</div>
        ) : (
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {listings?.map((item) => (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <Link to={`/listing/${item.id}`} className="group flex flex-col">
                  <div className="aspect-[3/4] bg-stone-200 rounded-xl overflow-hidden relative shadow-sm group-hover:shadow-2xl transition-all duration-500">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-stone-400 font-serif italic">Нет фото</div>
                    )}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="bg-white/90 backdrop-blur text-polyclothes text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{item.brand || 'No Brand'}</span>
                      {item.sale_type === 'auction' && (
                        <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">Аукцион</span>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-serif font-semibold text-polyclothes leading-tight mb-1 group-hover:text-accent transition line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-stone-500 mb-2">{item.category}</p>
                    <div className="mt-auto flex justify-between items-center">
                      <span className="text-xl font-bold text-polyclothes">{item.price.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}