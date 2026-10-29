import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { Wallet as WalletIcon, PlusCircle } from 'lucide-react';

export default function Wallet() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => (await api.get('/wallet')).data,
  });

  const depositMutation = useMutation({
    mutationFn: (sum: number) => api.post('/wallet/deposit', { amount: sum }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      setAmount('');
      alert('Баланс пополнен!');
    },
  });

  if (isLoading) return <div className="text-center mt-32">Загрузка...</div>;

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <h1 className="text-3xl font-serif font-bold text-polyclothes mb-8">Мой кошелек</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 bg-polyclothes text-white p-8 rounded-2xl shadow-xl flex flex-col justify-center items-center">
          <WalletIcon size={40} className="text-accent mb-4" />
          <p className="text-stone-400 text-sm mb-2">Текущий баланс</p>
          <div className="text-4xl font-bold mb-8">{wallet.balance.toLocaleString('ru-RU')} ₽</div>
          
          <div className="w-full relative">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Сумма" className="w-full p-3 pl-4 pr-12 bg-stone-800 border-none rounded-xl text-white outline-none focus:ring-2 focus:ring-accent" />
            <button onClick={() => depositMutation.mutate(Number(amount))} disabled={!amount || depositMutation.isPending} className="absolute right-2 top-1/2 -translate-y-1/2 text-accent hover:text-white transition disabled:opacity-50">
              <PlusCircle size={24} />
            </button>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-2xl shadow-lg border border-stone-200 p-8">
          <h2 className="text-xl font-bold text-polyclothes mb-6 border-b border-stone-100 pb-2">История операций</h2>
          <div className="space-y-4">
            {wallet.transactions.length === 0 ? <p className="text-stone-500">Транзакций пока нет</p> : null}
            {wallet.transactions.map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center border-b border-stone-100 pb-2">
                <div>
                  <p className="font-bold text-stone-700">{tx.kind}</p>
                  <p className="text-xs text-stone-400">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount} ₽
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}