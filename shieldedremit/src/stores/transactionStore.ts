import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Transaction } from "@/types";

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;

  // Actions
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByStatus: (
    status: Transaction["status"]
  ) => Transaction[];
  getTransactionsByType: (type: Transaction["type"]) => Transaction[];
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTransactions: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set, get) => ({
      // Initial state
      transactions: [],
      loading: false,
      error: null,

      // Actions
      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx
          ),
        })),

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        })),

      getTransactionById: (id) => {
        return get().transactions.find((tx) => tx.id === id);
      },

      getTransactionsByStatus: (status) => {
        return get().transactions.filter((tx) => tx.status === status);
      },

      getTransactionsByType: (type) => {
        return get().transactions.filter((tx) => tx.type === type);
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      clearTransactions: () => set({ transactions: [] }),
    }),
    {
      name: "shielded-remit-transactions",
    }
  )
);
