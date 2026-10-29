import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Trash2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await api.get('/cart');
      return data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: (listingId: number) => api.delete(`/cart/items/${listingId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => api.post('/orders/checkout'),
    onSuccess: () => {
      alert('Заказ оформлен! Деньги в эскроу.');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/');
    },
    onError: (err: any) => alert(err.response?.data || 'Ошибка оформления. Проверьте баланс.'),
  });

  if (isLoading) return <div className="text-center mt-32">Загрузка корзины...</div>;
  if (!cart || cart.items.length === 0) return <div className="text-center mt-32 text-2xl font-serif text-stone-500">Корзина пуста</div>;

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-3xl font-serif font-bold text-polyclothes mb-8">Корзина</h1>
      
      <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
        {cart.items.map((item: any) => (
          <div key={item.listing_id} className="flex items-center gap-4 p-4 border-b border-stone-100 last:border-0">
            <img src={item.cover_image} alt={item.title} className="w-20 h-24 object-cover rounded-lg bg-stone-100" />
            <div className="flex-grow">
              <h3 className="font-serif font-bold text-lg text-polyclothes">{item.title}</h3>
              <p className="text-accent font-bold">{item.price.toLocaleString('ru-RU')} ₽</p>
            </div>
            <button 
              onClick={() => removeMutation.mutate(item.listing_id)}
              className="p-2 text-stone-400 hover:text-red-500 transition"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
        
        <div className="p-6 bg-stone-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xl">
            Итого: <span className="font-bold text-polyclothes">{cart.total.toLocaleString('ru-RU')} ₽</span>
          </div>
          <button 
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            className="w-full md:w-auto bg-accent text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition"
          >
            {checkoutMutation.isPending ? 'Оформляем...' : 'Оформить заказ'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}