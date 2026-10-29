import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Package } from 'lucide-react';

export default function Orders() {
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data || []; // Защита от null
    },
  });

  if (isLoading) return <div className="text-center mt-32 text-xl">Загрузка...</div>;
  if (isError) return <div className="text-center mt-32 text-red-500">Ошибка. Вы авторизованы?</div>;

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-3xl font-serif font-bold text-polyclothes mb-8 flex items-center gap-3">
        <Package size={32} className="text-accent" /> Мои заказы
      </h1>

      {!orders || orders.length === 0 ? (
        <p className="text-stone-500">У вас пока нет заказов.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((o: any) => (
            <div key={o.id} className="bg-white rounded-xl shadow border border-stone-200 p-6 flex flex-col md:flex-row justify-between items-center">
              <div>
                <p className="text-sm text-stone-400 mb-1">Заказ #{o.id} от {new Date(o.created_at).toLocaleDateString()}</p>
                <h3 className="font-bold text-lg text-polyclothes">Сумма: {o.total} ₽</h3>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                  {o.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}