/**
 * 分类管理模块类型定义
 */

// 子分类
export interface Subcategory {
    id: number;
    name: string;
    icon: string;
    bgColor?: string;
    parentId?: number;
    sort?: number;
}

// 顶级分类
export interface Category {
    id: number;
    name: string;
    icon: string;
    bgColor?: string;
    expanded?: boolean;
    quickNotes?: number;
    children: Subcategory[];
    note?: string;
    sort?: number;
}

// 表单数据
export interface SubcategoryFormData {
    name: string;
    icon: string;
}
