/**
 * 账单类型接口
 */
export interface BillType {
  ID: number;
  name: string;
  icon: string;
}

/**
 * 账单项目接口
 */
export interface BillItem {
  ID: number;
  price: string | number;
  consumptionTime: string;
  remark?: string;
  type: string;
  iconBg: string;
  BillType: BillType;
}

/**
 * 账单分组接口
 */
export interface BillGroup {
  consumptionDate: string;
  total: number;
  Data: BillItem[];
}

/**
 * 分页参数接口
 */
export interface PageParams {
  pageNo: number;
  pageSize: number;
} 