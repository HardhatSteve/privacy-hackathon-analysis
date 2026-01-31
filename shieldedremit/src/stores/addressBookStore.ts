import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AddressBookEntry } from "@/types";
import { generateId } from "@/lib/utils";

interface AddressBookState {
  entries: AddressBookEntry[];

  // Actions
  addEntry: (entry: Omit<AddressBookEntry, "id" | "createdAt">) => void;
  updateEntry: (id: string, updates: Partial<AddressBookEntry>) => void;
  removeEntry: (id: string) => void;
  getEntryById: (id: string) => AddressBookEntry | undefined;
  getEntryByAddress: (address: string) => AddressBookEntry | undefined;
  searchEntries: (query: string) => AddressBookEntry[];
  updateLastUsed: (id: string) => void;
  clearAddressBook: () => void;
}

export const useAddressBookStore = create<AddressBookState>()(
  persist(
    (set, get) => ({
      // Initial state
      entries: [],

      // Actions
      addEntry: (entry) => {
        const newEntry: AddressBookEntry = {
          ...entry,
          id: generateId(),
          createdAt: Date.now(),
        };
        set((state) => ({
          entries: [...state.entries, newEntry],
        }));
      },

      updateEntry: (id, updates) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        })),

      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        })),

      getEntryById: (id) => {
        return get().entries.find((entry) => entry.id === id);
      },

      getEntryByAddress: (address) => {
        return get().entries.find(
          (entry) => entry.address.toLowerCase() === address.toLowerCase()
        );
      },

      searchEntries: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().entries.filter(
          (entry) =>
            entry.name.toLowerCase().includes(lowerQuery) ||
            entry.address.toLowerCase().includes(lowerQuery) ||
            entry.notes?.toLowerCase().includes(lowerQuery)
        );
      },

      updateLastUsed: (id) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, lastUsed: Date.now() } : entry
          ),
        })),

      clearAddressBook: () => set({ entries: [] }),
    }),
    {
      name: "shielded-remit-address-book",
    }
  )
);
