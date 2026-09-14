import type { DocumentApi } from '#/api';

import dayjs from 'dayjs';

import { buildDocumentFileUrl } from '#/api';

/** meta 拉取失败时的兜底上传规则（与后端默认一致） */
export const DEFAULT_DOCUMENT_META: DocumentApi.DocumentMeta = {
  allowed_extensions: [],
  departments: [],
  max_size: 20 * 1024 * 1024,
};

/** 移动对象上下文（file = 文件资料 / folder = 文件夹） */
export interface MoveContext {
  /** 移动文件夹时排除自身及子孙目录 */
  excludeId?: null | string;
  id: string;
  kind: 'file' | 'folder';
  parentId: null | string;
}

/** 关键字为空视为不过滤；否则任一字段命中即保留 */
export function matchesKeyword(
  keyword: string,
  ...fields: Array<null | string | undefined>
) {
  if (!keyword) return true;
  return fields.some((field) => field?.toLowerCase().includes(keyword));
}

export function formatSize(bytes: null | number | undefined) {
  if (bytes === null || bytes === undefined) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatTime(v?: null | string) {
  return v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-';
}

export function formatUploader(row: DocumentApi.DocumentResponse) {
  return row.uploader_full_name || row.uploader_username || '-';
}

/** 文件下载/预览地址（后端响应已带 file_url，此函数仅作兜底） */
export function fileUrl(row: DocumentApi.DocumentResponse) {
  return row.file_url || buildDocumentFileUrl(row.id);
}
