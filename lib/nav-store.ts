/**
 * 抽屉开关的极简外部 store。
 * 汉堡按钮（顶栏）和「更多」标签（底部栏）分处不同组件，
 * 用 store 共享状态比为此引入 Context Provider 更轻。
 */
let open = false;
const listeners = new Set<() => void>();

export function setNavOpen(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((listener) => listener());
}

export function getNavOpen() {
  return open;
}

export function subscribeNav(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
