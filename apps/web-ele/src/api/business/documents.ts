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

  /** 文件夹响应对象 */
  export interface FolderResponse {
    id: string;
    name: string;
    parent_id?: null | string;
    created_at?: null | string;
    updated_at?: null | string;
  }

  /** 移动目标（id 为 null 表示根目录） */
  export interface FolderMoveTarget {
    id: null | string;
    label: string;
  }

  /** GET /documents/browse 响应 */
  export interface BrowseResult {
    folder_id: null | string;
    ancestors: FolderResponse[];
    folders: FolderResponse[];
    documents: DocumentResponse[];
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
    folder_id?: null | string;
  }

  /** 新建文件夹请求 */
  export interface FolderCreate {
    name: string;
    parent_id?: null | string;
  }

  /** 编辑文件夹请求（PATCH，字段均可选） */
  export interface FolderUpdate {
    name?: string;
    parent_id?: null | string;
  }

  /** 删除响应 */
  export interface DeleteResult {
    deleted: boolean;
  }
}

// ─── 文件资料（查看：document_library / document_library_manage） ──────────

/**
 * 按文件夹浏览。
 * 不传 folder_id 时浏览根目录；非管理员只能看到包含可见文件的文件夹。
 */
export async function browseDocumentsApi(folderId?: null | string) {
  return requestClient.get<DocumentApi.BrowseResult>('/documents/browse', {
    params: folderId ? { folder_id: folderId } : {},
  });
}

/** 获取当前用户可见的全部文件（扁平列表，不含文件夹层级） */
export async function getDocumentsApi() {
  return requestClient.get<DocumentApi.DocumentResponse[]>('/documents');
}

/** 文件下载/预览地址（后端响应已带 file_url，此函数仅作兜底） */
export function buildDocumentFileUrl(documentId: string) {
  return `/api/v1/documents/${documentId}/file`;
}

// ─── 文件管理（需要 document_library_manage） ──────────────────────────────

/** 获取上传规则与部门列表 */
export async function getDocumentMetaApi() {
  return requestClient.get<DocumentApi.DocumentMeta>('/documents/meta');
}

/**
 * 上传文件到指定文件夹（multipart/form-data）
 * 字段：file（必填）、title、folder_id（空串=根目录）、viewer_departments（可重复）
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

/** 编辑文件标题 / 可见部门 / 移动文件夹（PATCH） */
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
  return requestClient.delete<DocumentApi.DeleteResult>(
    `/documents/${documentId}`,
  );
}

// ─── 文件夹 ────────────────────────────────────────────────────────────────

/** 移动目标列表（id=null 为根目录；excludeId 排除自身及子孙目录） */
export async function listFolderMoveTargetsApi(excludeId?: null | string) {
  return requestClient.get<DocumentApi.FolderMoveTarget[]>(
    '/documents/folders/move-targets',
    {
      params: excludeId ? { exclude_id: excludeId } : {},
    },
  );
}

/** 新建文件夹 */
export async function createFolderApi(data: DocumentApi.FolderCreate) {
  return requestClient.post<DocumentApi.FolderResponse>(
    '/documents/folders',
    data,
  );
}

/** 重命名 / 移动文件夹（PATCH） */
export async function updateFolderApi(
  folderId: string,
  data: DocumentApi.FolderUpdate,
) {
  return requestClient.request<DocumentApi.FolderResponse>(
    `/documents/folders/${folderId}`,
    { method: 'PATCH', data },
  );
}

/** 删除空文件夹 */
export async function deleteFolderApi(folderId: string) {
  return requestClient.delete<DocumentApi.DeleteResult>(
    `/documents/folders/${folderId}`,
  );
}
