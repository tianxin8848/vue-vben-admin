interface NotificationItem {
  /** 业务字段 */
  [key: string]: any;
  avatar: string;
  date: string;
  id: number | string;
  isRead?: boolean;
  /**
   * 跳转链接，可以是路由路径或完整 URL
   * @example '/dashboard' 或 'https://example.com'
   */
  link?: string;
  message: string;
  query?: Record<string, any>;
  state?: Record<string, any>;
  title: string;
}

export type { NotificationItem };
