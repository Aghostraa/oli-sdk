declare module 'react' {
  export function useState<S>(initialState: S | (() => S)): [S, (state: S) => void];
  export function useCallback<T>(callback: T, deps: readonly unknown[]): T;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
}
