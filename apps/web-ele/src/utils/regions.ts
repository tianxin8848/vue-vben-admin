/**
 * 地区名称归一化 / 宽松匹配。
 *
 * 与后端模板 `app/templates/{leave_calendar,system_settings}.html` 中的
 * `normalizeRegionKey` / `regionsMatch` 保持同一口径：员工档案里的地区是自由文本，
 * 同一个地区可能被写成「香港 / HK / Hong Kong」，直接 `===` 比较会漏配。
 *
 * - 「香港」「Hong Kong」「HK」→ `hongkong`
 * - 「大陆」「大陸」「mainland…」→ `mainland`
 * - 其余：去掉所有空白并转小写
 */

/** 把地区名折叠成可比较的 key；空值返回空串 */
export function normalizeRegionKey(region?: null | string): string {
  const value = String(region ?? '').trim();
  if (!value) {
    return '';
  }
  const folded = value.toLowerCase().replaceAll(/\s+/g, '');
  if (value.includes('香港') || folded === 'hongkong' || folded === 'hk') {
    return 'hongkong';
  }
  if (
    value.includes('大陆') ||
    value.includes('大陸') ||
    folded.includes('mainland')
  ) {
    return 'mainland';
  }
  return folded;
}

/**
 * 两个地区名是否指同一地区（宽松匹配）。
 *
 * 任一为空时返回 `false`——「未设置地区」不能与任意地区相等，
 * 需要判断空值时请调用方自行处理。
 */
export function regionsMatch(
  left?: null | string,
  right?: null | string,
): boolean {
  const a = normalizeRegionKey(left);
  const b = normalizeRegionKey(right);
  return Boolean(a) && a === b;
}
