import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录请求参数 */
  export interface LoginParams {
    password: string;
    username: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    expires_at: string;
    message?: string;
  }

  /** 注册请求参数 */
  export interface RegisterParams {
    email: string;
    full_name?: null | string;
    password: string;
    username: string;
  }

  /** 修改密码请求参数 */
  export interface ChangePasswordParams {
    current_password: string;
    new_password: string;
  }

  /** 退出登录返回值 */
  export interface LogoutResult {
    message?: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 注册用户
 */
export async function registerApi(data: AuthApi.RegisterParams) {
  return requestClient.post('/auth/register', data);
}

/**
 * 修改密码
 */
export async function changePasswordApi(data: AuthApi.ChangePasswordParams) {
  return requestClient.post('/auth/change-password', data);
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post<AuthApi.LogoutResult>('/auth/logout');
}

/**
 * 获取用户权限码（后端未提供，返回空数组）
 */
export async function getAccessCodesApi() {
  try {
    return await requestClient.get<string[]>('/auth/codes');
  } catch {
    return [];
  }
}

