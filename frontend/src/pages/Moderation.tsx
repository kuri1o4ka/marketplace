import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Moderation() {
  const queryClient = useQueryClient();
  const { data: pending, isLoading } = useQuery({
    queryKey: ['moderation'],
    queryFn: async () => (await api.get('/moderation/pending')).data,
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action, comment }: { id: number, action: string, comment?: string }) => 
      api.post(`/moderation/${id}/${action}`, { comment }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moderation'] }),
  });

  if (isLoading) return <div className="text-center mt-32">Загрузка...</div>;

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-3xl font-serif font-bold text-polyclothes mb-8">Панель модератора</h1>
      {pending?.length === 0 ? <p className="text-stone-500">Нет объявлений на модерации.</p> : (
        <div className="space-y-4">
          {pending.map((item: any) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow border border-stone-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-polyclothes">{item.title}</h3>
                <p className="text-sm text-stone-500">Продавец: {item.seller_name} • Цена: {item.price} ₽</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => actionMutation.mutate({ id: item.id, action: 'approve' })} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"><CheckCircle size={24} /></button>
                <button onClick={() => {
                  const reason = prompt('Причина отклонения:');
                  if (reason) actionMutation.mutate({ id: item.id, action: 'reject', comment: reason });
                }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><XCircle size={24} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}