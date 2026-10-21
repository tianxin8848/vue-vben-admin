/**
 * 年视图「按人着色」的配色与工具函数。
 *
 * 与 `shared/leave-types.ts` 的类型配色分开维护，两者语义不同：
 * - 类型配色偏语义（年假=蓝、病假=红…），用于月视图的条目 chip；
 * - 人员配色偏区分度（同一人全年同色、相邻人员色相互相拉开），用于年视图整格铺色。
 *
 * 分配策略：把出现的人员姓名排序后按序取色，保证「同一份数据 → 同一人 → 同一色」，
 * 刷新、切换年份都不漂移；超过调色板长度时循环复用（色相已拉开，循环后仍可辨识）。
 */
export const PERSON_PALETTE = [
  '#dc2626', // 红
  '#f97316', // 橙
  '#facc15', // 黄
  '#16a34a', // 绿
  '#14b8a6', // 青绿
  '#2563eb', // 蓝
  '#a855f7', // 紫
  '#ec4899', // 粉
  '#c4b5fd', // 淡紫
  '#1e3a8a', // 藏青
  '#0ea5e9', // 天蓝
  '#84cc16', // 黄绿
];

/** 姓名缺失 / 未命中时的兜底灰 */
const FALLBACK_COLOR = '#64748b';

/** 深色文字（不用纯黑，避免在彩色底上显得生硬） */
const DARK_TEXT = '#1f2937';
/** 浅色文字（用于藏青/蓝等明度较低的底色） */
const LIGHT_TEXT = '#ffffff';

/**
 * 生成「姓名 → 颜色」映射。
 * 入参可以是重复、无序的姓名列表，内部去重并排序后再分配，结果稳定。
 */
export function buildPersonColorMap(
  names: readonly string[],
): Record<string, string> {
  const unique = [...new Set(names.filter(Boolean))].toSorted((left, right) =>
    left.localeCompare(right, 'zh-CN'),
  );
  const map: Record<string, string> = {};
  unique.forEach((name, index) => {
    map[name] = PERSON_PALETTE[index % PERSON_PALETTE.length] as string;
  });
  return map;
}

/** 取某人颜色，未分配到（如姓名缺失）时返回兜底灰 */
export function getPersonColor(
  map: Record<string, string>,
  name: string,
): string {
  return map[name] ?? FALLBACK_COLOR;
}

/** hex → rgba 字符串，用于半透明底色 */
export function toRgba(color: string, alpha: number): string {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return `rgb(100 116 139 / ${alpha})`;
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/** 相对亮度（WCAG 定义），用于决定格子里日期数字用深色还是浅色 */
function relativeLuminance(color: string): number {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return 1;
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.039_28 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2;
  });
  const [r = 1, g = 1, b = 1] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * 按底色亮度选文字色。
 * 阈值 0.179 是「黑字对比度 > 白字对比度」的分界，可近似保证彩色块上的日期数字可读。
 */
export function getReadableTextColor(background: string): string {
  return relativeLuminance(background) > 0.179 ? DARK_TEXT : LIGHT_TEXT;
}
