import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListingDetail, api } from '../api';
import { ArrowLeft, ShoppingBag, Sparkles, ShieldCheck, Truck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading } = useListingDetail(id!);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (isLoading) return <div className="text-center mt-32 text-xl font-serif text-stone-500 animate-pulse">Загрузка лота...</div>;
  if (!item) return <div className="text-center mt-32 text-xl text-red-500">Вещь не найдена</div>;

  const handleAddToCart = async () => {
    try {
      await api.post('/cart/items', { listing_id: item.id });
      alert('Добавлено в корзину!');
    } catch (e: any) {
      const errorMsg = e.response?.data?.error || e.response?.data || 'Ошибка добавления. Возможно, вы не авторизованы.';
      alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  const handleAiCheck = async () => {
    setIsAiLoading(true);
    try {
      const { data } = await api.post(`/listings/${item.id}/ai-check`);
      setAiResult(data);
    } catch (e) {
      alert('AI сломался');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <button onClick={() => navigate(-1)} className="flex items-center text-stone-500 hover:text-polyclothes mb-8 transition-colors">
        <ArrowLeft size={20} className="mr-2" /> Назад в каталог
      </button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-stone-200"
      >
        
        <div className="lg:w-3/5 bg-stone-100 relative overflow-hidden min-h-[400px] lg:min-h-full">
          {item.images && item.images.length > 0 ? (
            <motion.img 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              src={item.images[0]} 
              alt={item.title} 
              className="w-full h-full object-cover aspect-[3/4] lg:aspect-auto" 
            />
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 font-serif text-xl italic">Нет фото</div>
          )}
          {item.sale_type === 'auction' && (
            <div className="absolute top-6 left-6 bg-accent text-white font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-lg">
              Аукцион
            </div>
          )}
        </div>
        
        <div className="p-8 lg:p-12 lg:w-2/5 flex flex-col">
          <div className="mb-2">
            <span className="text-sm font-bold text-accent uppercase tracking-widest">{item.brand || 'No Brand'}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-serif font-bold text-polyclothes mb-4 leading-tight">{item.title}</h1>
          
          <div className="text-3xl font-bold text-polyclothes mb-8 border-b border-stone-200 pb-6">
            {item.price.toLocaleString('ru-RU')} ₽
          </div>
          
          <div className="space-y-4 mb-8 text-stone-600">
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="text-stone-400">Категория</span>
              <span className="font-medium text-polyclothes">{item.category || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="text-stone-400">Размер</span>
              <span className="font-medium text-polyclothes">{item.size || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="text-stone-400">Цвет</span>
              <span className="font-medium text-polyclothes">{item.color || '-'}</span>
            </div>
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="text-stone-400">Состояние</span>
              <span className="font-medium text-polyclothes">{item.condition || 'Не указано'}</span>
            </div>
            <div className="flex justify-between border-b border-stone-100 pb-2">
              <span className="text-stone-400">Продавец</span>
              <span className="font-medium text-polyclothes flex items-center gap-1">
                {item.seller_name} <ShieldCheck size={16} className="text-green-600" />
              </span>
            </div>
          </div>

          {item.description && (
            <div className="mb-8">
              <h3 className="font-serif font-bold text-lg mb-2 text-polyclothes">Описание</h3>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          )}

          <div className="mt-auto space-y-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              className="w-full bg-polyclothes text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors shadow-lg"
            >
              <ShoppingBag size={22} /> Добавить в корзину
            </motion.button>
            
            <div className="flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAiCheck}
                disabled={isAiLoading}
                className="flex-1 border-2 border-accent text-accent py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {isAiLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />} 
                {isAiLoading ? 'Сканируем...' : 'AI Оценка'}
              </motion.button>
            </div>

            {aiResult && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-sm shadow-inner"
              >
                <p className="font-bold text-amber-900 mb-1 flex items-center gap-2">
                  <Sparkles size={16} /> Результат AI-анализа:
                </p>
                <p className="text-amber-800">Состояние: <span className="font-bold uppercase">{aiResult.condition}</span></p>
                <p className="text-amber-800">Уверенность: <span className="font-bold">{(aiResult.confidence * 100).toFixed(1)}%</span></p>
              </motion.div>
            )}
            
            <div className="flex justify-center items-center gap-6 mt-6 pt-4 text-stone-400 text-xs">
              <span className="flex items-center gap-1"><Truck size={16} /> Доставка по РФ</span>
              <span className="flex items-center gap-1"><ShieldCheck size={16} /> Безопасная сделка</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}