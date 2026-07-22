import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  const result = await requestClient.get<{
    department: null | string;
    email: string;
    full_name: string;
    id: string;
    is_active: boolean;
    is_admin: boolean;
    module_permissions: Array<{
      can_approve: boolean;
      can_create: boolean;
      can_delete: boolean;
      can_edit: boolean;
      can_view: boolean;
      module_code: string;
      module_name: string;
    }>;
    phone: null | string;
    position: null | string;
    region: null | string;
    user_id: number;
    username: string;
  }>('/auth/me');
  return {
    userId: result.id,
    username: result.username,
    realName: result.full_name,
    email: result.email,
    phone: result.phone || '',
    roles: result.is_admin ? ['admin'] : ['user'],
    desc: '',
    homePath: '/employee/list',
    token: '',
    avatar: '',
  };
}

