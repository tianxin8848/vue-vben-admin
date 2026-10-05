import type { ClaimApi } from '#/api';

import { computed, ref } from 'vue';

import { useI18n } from '@vben/locales';

import { toastWarning } from '#/utils/message';

/**
 * 报销附件条目。
 *
 * 后端 `POST /me/claims` 已改为「一单一笔费用、同一笔可带多个附件」：
 * **一个文件算一个附件**（不再把多页 PDF 按页拆成多笔），单笔上限 20 个，
 * 每个附件用 `attachment_kind` 标注是发票（invoice）还是支持文件（supporting）。
 *
 * 因此前端不再需要「算出这份附件要拆成几笔」，也就不再调用 PDF 预览接口 ——
 * 这里只做本地校验、缩略图与类型标注。
 */
export interface ClaimAttachmentItem {
  file: File;
  kind: ClaimApi.ClaimAttachmentKind;
  /** 列表渲染用 key（`文件名|大小|修改时间`），同内容重复选择会被忽略 */
  key: string;
  /** 图片的本地缩略图（object URL）；PDF/OFD 等无缩略图，为空串 */
  previewUrl: string;
}

/** 与后端 `claim_config_service.ALLOWED_ATTACHMENT_EXTENSIONS` 保持一致 */
const ALLOWED_EXTENSIONS = [
  '.avif',
  '.bmp',
  '.gif',
  '.heic',
  '.heif',
  '.jpeg',
  '.jpg',
  '.ofd',
  '.pdf',
  '.png',
  '.tif',
  '.tiff',
  '.webp',
  '.xml',
];

/** 只有图片能在浏览器里本地预览（PDF 不做前端解析） */
const IMAGE_EXTENSIONS = new Set([
  '.avif',
  '.bmp',
  '.gif',
  '.heic',
  '.heif',
  '.jpeg',
  '.jpg',
  '.png',
  '.tif',
  '.tiff',
  '.webp',
]);

/** 与后端 `claim_config_service.MAX_CLAIM_ATTACHMENTS` 保持一致 */
export const MAX_CLAIM_ATTACHMENTS = 20;

/** 与后端 `claim_config_service.MAX_CLAIM_ATTACHMENT_SIZE` 保持一致（10MB） */
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

/** 上传框 accept：与后端允许的扩展名同源，避免把 .ofd / .xml 挡在外面 */
export const CLAIM_ATTACHMENT_ACCEPT = ALLOWED_EXTENSIONS.join(',');

function extensionOf(fileName: string): string {
  const index = fileName.lastIndexOf('.');
  return index === -1 ? '' : fileName.slice(index).toLowerCase();
}

function isImageFile(file: File): boolean {
  return IMAGE_EXTENSIONS.has(extensionOf(file.name));
}

export function useClaimAttachments() {
  const { t } = useI18n();

  /** 按用户选择顺序的附件列表 */
  const items = ref<ClaimAttachmentItem[]>([]);

  /** 图片缩略图的 object URL，重置/删除时回收 */
  let objectUrls: string[] = [];

  const count = computed(() => items.value.length);

  function releaseObjectUrls() {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls = [];
  }

  /** 清空选择（drawer 关闭 / 提交成功后调用） */
  function reset() {
    releaseObjectUrls();
    items.value = [];
  }

  function describeInvalidFile(file: File): string {
    if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
      return t('page.claim.form.attachmentInvalidFormat');
    }
    if (file.size === 0) {
      return t('page.claim.form.attachmentEmpty');
    }
    return t('page.claim.form.attachmentTooLarge');
  }

  /** 本地预校验：后端仍会再校验一次，这里只是省一次失败往返 */
  function isFileValid(file: File): boolean {
    return (
      ALLOWED_EXTENSIONS.includes(extensionOf(file.name)) &&
      file.size > 0 &&
      file.size <= MAX_ATTACHMENT_SIZE
    );
  }

  function keyOf(file: File): string {
    return `${file.name}|${file.size}|${file.lastModified}`;
  }

  /**
   * 追加一个附件。返回是否成功加入。
   *
   * 同名同内容的文件重复选择会被静默忽略（后端也会按 sha256 判重并 400）。
   */
  function addFile(file: File): boolean {
    if (!isFileValid(file)) {
      toastWarning(describeInvalidFile(file));
      return false;
    }
    if (items.value.length >= MAX_CLAIM_ATTACHMENTS) {
      toastWarning(
        t('page.claim.form.attachmentTooMany', {
          count: MAX_CLAIM_ATTACHMENTS,
        }),
      );
      return false;
    }
    const key = keyOf(file);
    if (items.value.some((item) => item.key === key)) {
      return false;
    }
    const previewUrl = isImageFile(file) ? URL.createObjectURL(file) : '';
    if (previewUrl) objectUrls.push(previewUrl);
    items.value.push({ file, key, kind: 'invoice', previewUrl });
    return true;
  }

  /** 移除一个附件（并回收它的缩略图 object URL） */
  function removeItem(key: string) {
    const target = items.value.find((item) => item.key === key);
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
      objectUrls = objectUrls.filter((url) => url !== target.previewUrl);
    }
    items.value = items.value.filter((item) => item.key !== key);
  }

  /** 修改某个附件的类型（invoice / supporting） */
  function setKind(key: string, kind: ClaimApi.ClaimAttachmentKind) {
    const target = items.value.find((item) => item.key === key);
    if (target) target.kind = kind;
  }

  /** 提交用：按选择顺序返回 (file, kind) 列表 */
  function toPayload() {
    return items.value.map((item) => ({
      file: item.file,
      kind: item.kind,
    }));
  }

  return {
    addFile,
    count,
    items,
    removeItem,
    reset,
    setKind,
    toPayload,
  };
}
