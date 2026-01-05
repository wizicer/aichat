import { useEffect } from 'react';
import { useUserStore } from '@/stores';
import { PageHeader } from '@/components/layout';
import { formatCurrency, formatTime } from '@/utils/helpers';

export function Wallet() {
  const { profile, transactions, loadProfile, loadTransactions } = useUserStore();

  useEffect(() => {
    loadProfile();
    loadTransactions();
  }, [loadProfile, loadTransactions]);

  return (
    <div className="flex flex-col h-full bg-bg-light dark:bg-bg-dark">
      <PageHeader title="钱包" showBack />

      <div className="flex-1 overflow-y-auto">
        {/* Balance card */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 mx-4 mt-4 rounded-xl p-6 text-white">
          <p className="text-sm opacity-80">余额</p>
          <p className="text-3xl font-bold mt-1">
            {formatCurrency(profile?.balance || 0)}
          </p>
        </div>

        {/* Transactions */}
        <div className="mt-6">
          <h3 className="px-4 text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            收支记录
          </h3>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              暂无记录
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 dark:text-gray-100">
                      {tx.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(tx.timestamp)}
                    </p>
                  </div>
                  <span className={tx.type === 'receive' ? 'text-green-500' : 'text-red-500'}>
                    {tx.type === 'receive' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
