import { requestClient } from '#/api/request';

export namespace DataMigrationApi {
  export interface BackupItem {
    name: string;
    bytes?: number;
    modified_at?: string;
  }

  export interface BackupResponse {
    items: BackupItem[];
  }

  export interface OperationResult {
    message?: string;
    [key: string]: any;
  }
}

export async function exportDataApi(source: string, exclude?: string) {
  const params = new URLSearchParams({ source });
  if (exclude) {
    params.set('exclude', exclude);
  }
  const url = `/data-migration/export?${params.toString()}`;
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error('导出失败');
  }
  return response.blob();
}

export async function backupDataApi(source: string, exclude?: string) {
  const params = new URLSearchParams({ source });
  if (exclude) {
    params.set('exclude', exclude);
  }
  return requestClient.post<DataMigrationApi.OperationResult>(
    `/data-migration/backup?${params.toString()}`,
  );
}

export async function getBackupsApi() {
  return requestClient.get<DataMigrationApi.BackupResponse>(
    '/data-migration/backups',
  );
}

export async function importDataApi(
  file: File,
  target: string,
  mode: string,
  userNullStrategy: string,
) {
  const formData = new FormData();
  formData.append('file', file);
  const params = new URLSearchParams({
    target,
    mode,
    user_null_strategy: userNullStrategy,
  });
  return requestClient.request<DataMigrationApi.OperationResult>(
    `/data-migration/import?${params.toString()}`,
    {
      method: 'POST',
      data: formData,
      headers: {},
    },
  );
}
