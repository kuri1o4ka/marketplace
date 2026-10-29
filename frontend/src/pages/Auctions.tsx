import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Gavel } from 'lucide-react';

export default function Auctions() {
  const { data: auctions, isLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: async () => (await api.get('/auctions')).data,
  });

  if (isLoading) return <div className="text-center mt-32">Загрузка...</div>;

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-serif font-bold text-polyclothes mb-8 flex items-center gap-3">
        <Gavel size={32} className="text-accent" /> Аукционы
      </h1>
      
      {auctions?.length === 0 ? <p className="text-stone-500">Нет активных аукционов.</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {auctions.map((a: any) => (
            <div key={a.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-stone-200">
              <img src={a.cover_image} alt={a.title} className="w-full h-64 object-cover" />
              <div className="p-6">
                <h3 className="font-serif font-bold text-xl text-polyclothes mb-2">{a.title}</h3>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-xs text-stone-400 uppercase">Текущая ставка</p>
                    <p className="text-2xl font-bold text-accent">{a.current_price} ₽</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-400 uppercase">Ставок</p>
                    <p className="font-bold">{a.bids_count}</p>
                  </div>
                </div>
                <button onClick={() => alert('Для ставки нужна страница аукциона, мы ее еще не сделали!')} className="w-full bg-polyclothes text-white py-2 rounded-lg font-bold hover:bg-stone-800 transition">
                  Сделать ставку
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}