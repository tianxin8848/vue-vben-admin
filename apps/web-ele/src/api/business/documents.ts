import { requestClient } from '#/api/request';

export namespace DocumentApi {
  /** 文件资料响应对象 */
  export interface DocumentResponse {
    id: string;
    title: string;
    original_name: string;
    file_id: string;
    file_url?: null | string;
    content_type?: null | string;
    size_bytes: number;
    uploader_id?: null | string;
    uploader_username?: null | string;
    uploader_full_name?: null | string;
    viewer_departments: string[];
    folder_id?: null | string;
    created_at?: null | string;
    updated_at?: null | string;
  }

  /** 上传规则与可选可见部门（仅 document_library_manage 可访问） */
  export interface DocumentMeta {
    departments: string[];
    allowed_extensions: string[];
    max_size: number;
  }

  /** 编辑文件资料请求（PATCH，字段均可选） */
  export interface DocumentUpdate {
    title?: string;
    viewer_departments?: string[];
  }

  /** 删除响应 */
  export interface DocumentDeleteResult {
    deleted: boolean;
  }
}

// ─── 文件资料 ──────────────────────────────────────────────────────────────

/** 获取当前用户可见的文件列表 */
export async function getDocumentsApi() {
  return requestClient.get<DocumentApi.DocumentResponse[]>('/documents');
}

/** 获取上传规则与部门列表（需要 document_library_manage 权限） */
export async function getDocumentMetaApi() {
  return requestClient.get<DocumentApi.DocumentMeta>('/documents/meta');
}

/**
 * 上传文件（multipart/form-data）
 * 字段：file（必填）、title、viewer_departments（可重复）
 */
export async function createDocumentApi(formData: FormData) {
  return requestClient.post<DocumentApi.DocumentResponse>(
    '/documents',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
}

/** 编辑文件标题 / 可见部门（PATCH） */
export async function updateDocumentApi(
  documentId: string,
  data: DocumentApi.DocumentUpdate,
) {
  return requestClient.request<DocumentApi.DocumentResponse>(
    `/documents/${documentId}`,
    { method: 'PATCH', data },
  );
}

/** 删除文件 */
export async function deleteDocumentApi(documentId: string) {
  return requestClient.delete<DocumentApi.DocumentDeleteResult>(
    `/documents/${documentId}`,
  );
}
