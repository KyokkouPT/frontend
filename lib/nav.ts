import type { NavItem } from "@kyokkou/contracts";

/**
 * 高亮规则：
 * - 精确相等 → 高亮；
 * - exact 项只匹配自身；
 * - 普通项匹配子路径，但若另一个导航项是更长前缀（如 /staff/classes/simulate），
 *   本项让位，避免“父项 + 子项”同时高亮。
 */
export function isNavItemActive(item: NavItem, pathname: string, all: NavItem[] = []): boolean {
  if (pathname === item.href) return true;
  if (item.exact || !pathname.startsWith(`${item.href}/`)) return false;

  const hasMoreSpecific = all.some(
    (other) =>
      other.key !== item.key &&
      other.href.length > item.href.length &&
      (pathname === other.href || pathname.startsWith(`${other.href}/`)),
  );
  return !hasMoreSpecific;
}
