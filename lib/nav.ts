import type { NavItem } from "@kyokkou/contracts";

/** 与 demo 一致的高亮规则：exact 只匹配自身，否则匹配子路径。 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  if (!item.exact && pathname.startsWith(`${item.href}/`)) return true;
  return false;
}
