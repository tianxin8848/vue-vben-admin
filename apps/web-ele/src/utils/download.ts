/**
 * 文件下载的统一出口。
 *
 * 原先 data-migration 与 claim 各自手写了一遍 `createObjectURL → a.click() → revokeObjectURL`，
 * 收敛到这里，顺带保证：
 * - `<a>` 用 `display: none` 而非插入后被点击，避免页面出现瞬时布局跳动
 * - `revokeObjectURL` 在 `click()` 之后立即调用，不会泄漏 object URL
 */

/**
 * 把接口返回的 Blob 存为本地文件。
 *
 * @param blob 接口返回的二进制内容
 * @param filename 完整文件名（含扩展名），如 `claims_20260916.xlsx`
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * 生成带日期戳的文件名：`buildTimestampedFileName('claims', 'xlsx')` → `claims_20260916.xlsx`
 *
 * @param base 文件名主体（不含扩展名）
 * @param extension 扩展名（不含点）
 * @param date 日期，默认当天；测试时可注入
 */
export function buildTimestampedFileName(
  base: string,
  extension: string,
  date: Date = new Date(),
): string {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  return `${base}_${stamp}.${extension}`;
}
