/** Typed hrefs for the dynamic routes (Expo Router typed routes reject template strings). */
export const duelHref = (id: string) => ({ pathname: '/duel/[id]' as const, params: { id } });
export const doneHref = (id: string) => ({ pathname: '/done/[id]' as const, params: { id } });
export const sentHref = (id: string) => ({ pathname: '/sent/[id]' as const, params: { id } });
export const resultHref = (id: string) => ({ pathname: '/result/[id]' as const, params: { id } });
