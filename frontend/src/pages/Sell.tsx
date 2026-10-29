import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Upload, Plus } from 'lucide-react';

export default function Sell() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', category_id: 1, brand_id: 1, condition: 'excellent', sale_type: 'fixed_price', image_urls: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        image_urls: formData.image_urls.split(',').map(s => s.trim()).filter(Boolean)
      };
      await api.post('/listings', payload);
      alert('Объявление отправлено на модерацию!');
      navigate('/');
    } catch (err: any) {
      alert(err.response?.data || 'Ошибка создания');
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl">
      <h1 className="text-3xl font-serif font-bold text-polyclothes mb-8">Продать вещь</h1>
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-2">Название</label>
              <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" placeholder="Винтажная куртка Nike" />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-2">Цена (₽)</label>
              <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" placeholder="5000" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-600 mb-2">Описание</label>
            <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" placeholder="Расскажите об истории вещи..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-2">Категория</label>
              <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: parseInt(e.target.value)})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent outline-none">
                <option value={1}>Куртки</option>
                <option value={2}>Обувь</option>
                <option value={3}>Аксессуары</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-2">Состояние</label>
              <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent outline-none">
                <option value="new">Новое</option>
                <option value="excellent">Отличное</option>
                <option value="good">Хорошее</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-600 mb-2">Тип продажи</label>
              <select value={formData.sale_type} onChange={e => setFormData({...formData, sale_type: e.target.value})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent outline-none">
                <option value="fixed_price">Фиксированная цена</option>
                <option value="auction">Аукцион</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-600 mb-2">Ссылки на фото (через запятую)</label>
            <input type="text" value={formData.image_urls} onChange={e => setFormData({...formData, image_urls: e.target.value})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" placeholder="https://image1.jpg, https://image2.jpg" />
          </div>

          <button type="submit" className="w-full bg-polyclothes text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-stone-800 transition">
            <Upload size={20} /> Отправить на модерацию
          </button>
        </form>
      </div>
    </div>
  );
}