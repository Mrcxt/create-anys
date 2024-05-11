import { create } from "zustand";

type State = {
  count: number;
  increment: () => void;
};

export const useStore = create<State>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 }))
}));
