import { requestClient } from '#/api/request';

export namespace CustomerApi {
  /** 联系人 */
  export interface CustomerContact {
    role: string;
    name: string;
    phone: string;
    email: string;
  }

  /** 客户响应对象 */
  export interface CustomerResponse {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    phone: string;
    notes: string;
    contacts: CustomerContact[];
    created_at: null | string;
    updated_at: null | string;
  }

  /** 创建/更新客户请求（contacts 可传，PATCH 时所有字段均可选） */
  export interface CustomerUpsert {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    notes?: string;
    contacts?: CustomerContact[];
  }

  /** 删除响应 */
  export interface CustomerDeleteResult {
    deleted: boolean;
  }
}

// ─── CRUD ──────────────────────────────────────────────────────────────────

/** 获取客户列表 */
export async function getCustomersApi() {
  return requestClient.get<CustomerApi.CustomerResponse[]>('/customers');
}

/** 创建客户 */
export async function createCustomerApi(data: CustomerApi.CustomerUpsert) {
  return requestClient.post<CustomerApi.CustomerResponse>('/customers', data);
}

/** 更新客户（PATCH） */
export async function updateCustomerApi(
  customerId: string,
  data: CustomerApi.CustomerUpsert,
) {
  return requestClient.request<CustomerApi.CustomerResponse>(
    `/customers/${customerId}`,
    { method: 'PATCH', data },
  );
}

/** 删除客户 */
export async function deleteCustomerApi(customerId: string) {
  return requestClient.delete<CustomerApi.CustomerDeleteResult>(
    `/customers/${customerId}`,
  );
}
