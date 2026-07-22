import type { PageProps } from '../page/types';

export interface ColPageProps extends PageProps {
  leftCollapsedWidth?: number;
  leftCollapsible?: boolean;
  leftMaxWidth?: number;
  leftMinWidth?: number;
  /**
   * 左侧宽度
   * @default 30
   */
  leftWidth?: number;
  resizable?: boolean;
  rightCollapsedWidth?: number;
  rightCollapsible?: boolean;
  rightMaxWidth?: number;
  rightMinWidth?: number;

  /**
   * 右侧宽度
   * @default 70
   */
  rightWidth?: number;
  splitHandle?: boolean;
  splitLine?: boolean;
}
