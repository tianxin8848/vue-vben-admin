import { requestClient } from '#/api/request';

export namespace EmployeeApi {
  export interface Employee {
    id: string;
    username: string;
    realName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
    status: 'active' | 'inactive';
    isAdmin: boolean;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
  }

  export interface EmployeeProfile {
    id: string;
    employeeId: string;
    education: string;
    workExperience: string;
    skills: string;
    emergencyContact: string;
    emergencyPhone: string;
    bankAccount: string;
    bankName: string;
    address: string;
    idCardNumber: string;
  }

  export interface EmployeeBasicInfo {
    realName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
  }

  export interface CreateEmployeeParams {
    username: string;
    password: string;
    realName: string;
    email: string;
    phone: string;
    department: string;
    position: string;
  }

  export interface UpdateStatusParams {
    status: 'active' | 'inactive';
  }

  export interface UpdateAdminParams {
    isAdmin: boolean;
  }

  export interface UpdatePermissionsParams {
    permissions: string[];
  }

  export interface ResetPasswordParams {
    newPassword: string;
  }

  export interface ListParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    department?: string;
    status?: string;
  }

  export interface ListResult {
    data: Employee[];
    total: number;
    page: number;
    pageSize: number;
  }
}

export async function getEmployeesApi(params?: EmployeeApi.ListParams) {
  return requestClient.get<EmployeeApi.ListResult>('/employees', { params });
}

export async function createEmployeeApi(
  data: EmployeeApi.CreateEmployeeParams,
) {
  return requestClient.post<EmployeeApi.Employee>('/employees', data);
}

export async function getCurrentProfileApi() {
  return requestClient.get<EmployeeApi.EmployeeProfile>(
    '/employees/me/profile',
  );
}

export async function updateCurrentProfileApi(
  data: Partial<EmployeeApi.EmployeeProfile>,
) {
  return requestClient.put('/employees/me/profile', data);
}

export async function updateCurrentBasicInfoApi(
  data: EmployeeApi.EmployeeBasicInfo,
) {
  return requestClient.put('/employees/me/basic-info', data);
}

export async function getEmployeeProfileApi(id: string) {
  return requestClient.get<EmployeeApi.EmployeeProfile>(
    `/employees/${id}/profile`,
  );
}

export async function updateEmployeeProfileApi(
  id: string,
  data: Partial<EmployeeApi.EmployeeProfile>,
) {
  return requestClient.put(`/employees/${id}/profile`, data);
}

export async function updateEmployeeBasicInfoApi(
  id: string,
  data: EmployeeApi.EmployeeBasicInfo,
) {
  return requestClient.put(`/employees/${id}/basic-info`, data);
}

export async function updateEmployeeStatusApi(
  id: string,
  data: EmployeeApi.UpdateStatusParams,
) {
  return requestClient.put(`/employees/${id}/status`, data);
}

export async function updateEmployeeAdminApi(
  id: string,
  data: EmployeeApi.UpdateAdminParams,
) {
  return requestClient.put(`/employees/${id}/admin`, data);
}

export async function updateEmployeePermissionsApi(
  id: string,
  data: EmployeeApi.UpdatePermissionsParams,
) {
  return requestClient.put(`/employees/${id}/permissions`, data);
}

export async function resetEmployeePasswordApi(
  id: string,
  data: EmployeeApi.ResetPasswordParams,
) {
  return requestClient.post(`/employees/${id}/reset-password`, data);
}
