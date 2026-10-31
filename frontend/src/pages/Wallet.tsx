import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Plus, RefreshCw, Wallet as WalletIcon } from 'lucide-react';
import { walletApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/auth';
import { useToast } from '../context/toast';
import { Button, EmptyState, Field, Input, PageHeader, Skeleton } from '../components/ui';
import { formatDate, formatMoney, transactionLabel } from '../lib/format';
import { cn } from '../lib/cn';

const quickAmounts = [5000, 10000, 25000];

export default function WalletPage() {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [amount, setAmount] = useState('');

  const wallet = useQuery({
    queryKey: ['wallet'],
    queryFn: walletApi.get,
  });

  const deposit = useMutation({
    mutationFn: (value: number) => walletApi.deposit(value),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wallet'] }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
      ]);
      await refreshUser();
      setAmount('');
      toast.success('Кошелёк пополнен');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Не удалось пополнить кошелёк')),
  });

  const handleDeposit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Введите сумму больше нуля');
      return;
    }
    deposit.mutate(value);
  };

  const transactions = wallet.data?.transactions ?? [];

  return (
    <div className="container-luxe py-10 md:py-14">
      <PageHeader
        eyebrow="Кошелёк"
        title="Баланс и операции"
        description="Пополняйте баланс для покупок. Средства замораживаются в escrow и переходят продавцу после получения заказа."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {wallet.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : wallet.isError ? (
            <EmptyState
              icon={RefreshCw}
              title="Кошелёк не загрузился"
              description="Проверьте соединение с API и попробуйте снова."
              action={
                <Button variant="ghost" onClick={() => wallet.refetch()} loading={wallet.isFetching}>
                  Повторить
                </Button>
              }
            />
          ) : (
            <div className="relative overflow-hidden border border-night-600 bg-night-900/60 rounded-xl p-6 sm:p-8">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-night-600/40" />
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full border border-night-600/40" />
              <div className="relative space-y-3">
                <div className="flex items-center gap-2">
                  <WalletIcon size={16} className="text-muted" />
                  <p className="label text-muted">Доступно</p>
                </div>
                <p className="font-display text-5xl text-cream sm:text-6xl">
                  {formatMoney(wallet.data?.balance ?? 0, true)}
                </p>
                <p className="text-xs text-muted">Баланс в рублях · демо-платёжная система</p>
              </div>
            </div>
          )}

          <div className="border border-night-600 bg-night-900/40 rounded-xl">
            <div className="flex items-center justify-between border-b border-night-700 px-5 py-4">
              <p className="font-display text-2xl text-cream">Операции</p>
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
                {transactions.length} записей
              </span>
            </div>

            {wallet.isLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">
                Операций пока нет. Пополните кошелёк, чтобы начать.
              </p>
            ) : (
              <div className="divide-y divide-night-800">
                {transactions.map((transaction) => {
                  const positive = transaction.amount >= 0;
                  return (
                    <div key={transaction.id} className="flex items-center gap-4 px-5 py-4">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                          positive
                            ? 'border-success/30 bg-success/10 text-success'
                            : 'border-night-600 bg-night-900 text-cream',
                        )}
                      >
                        {positive ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-cream">{transactionLabel(transaction.kind)}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted">
                          {formatDate(transaction.created_at)}
                          {transaction.order_id ? ` · заказ #${transaction.order_id}` : ''}
                        </p>
                      </div>
                      <span className={cn('text-sm font-semibold', positive ? 'text-success' : 'text-cream')}>
                        {positive ? '+' : ''}
                        {formatMoney(transaction.amount, true)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="border border-night-600 bg-night-900/70 rounded-xl p-6">
            <p className="font-display text-2xl text-cream">Пополнить</p>
            <form onSubmit={handleDeposit} className="mt-4 space-y-4">
              <Field label="Сумма, ₽" htmlFor="deposit-amount">
                <Input
                  id="deposit-amount"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="10 000"
                />
              </Field>

              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(String(value))}
                    className="rounded-lg border border-night-600 py-2 text-[10px] uppercase tracking-[0.1em] text-muted transition hover:border-accent hover:text-accent"
                  >
                    +{value.toLocaleString('ru-RU')}
                  </button>
                ))}
              </div>

              <Button type="submit" className="w-full" icon={Plus} loading={deposit.isPending}>
                Пополнить баланс
              </Button>
            </form>

            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              В демо-версии платёж подтверждается мгновенно. В продакшене здесь будет интеграция с
              платёжным провайдером.
            </p>
          </div>

          <div className="border border-night-600 bg-night-900/60 rounded-xl p-5">
            <p className="label">Как это работает</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
              <li>• При оформлении заказа сумма резервируется.</li>
              <li>• Продавец получает деньги после подтверждения получения.</li>
              <li>• Если что-то пошло не так — оформляется возврат.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
