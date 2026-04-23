// Tiny event bus so child components (contract cards, dialogs)
// can notify the Passport stats to refetch.
type Listener = () => void;
const listeners = new Set<Listener>();

export const ledgerEvents = {
  emit: () => listeners.forEach((l) => l()),
  on: (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};