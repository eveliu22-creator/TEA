export type OrderType = 'dine-in' | 'takeout' | 'delivery';

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Drink {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  priceLarge?: number;
  isAvailable: boolean;
  tags?: string[];
  hasSizeM: boolean;
  hasSizeL: boolean;
}

export interface AddOnOption {
  name: string;
  price: number;
}

export interface CartItem {
  id: string; // unique cart item id
  drink: Drink;
  name: string;
  size: 'M' | 'L';
  ice: string;
  sweetness: string;
  addOns: AddOnOption[];
  quantity: number;
  notes?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNum: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  deliveryAddress?: string;
  items: {
    drinkId: string;
    name: string;
    size: 'M' | 'L';
    ice: string;
    sweetness: string;
    addOns: { name: string; price: number }[];
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export const ICE_LEVELS = [
  { label: '正常冰', value: '正常冰' },
  { label: '少冰', value: '少冰' },
  { label: '微冰', value: '微冰' },
  { label: '去冰', value: '去冰' },
  { label: '熱', value: '熱' },
];

export const SWEETNESS_LEVELS = [
  { label: '正常糖 (100%)', value: '正常糖' },
  { label: '少糖 (70%)', value: '少糖' },
  { label: '半糖 (50%)', value: '半糖' },
  { label: '微糖 (30%)', value: '微糖' },
  { label: '無糖 (0%)', value: '無糖' },
];

export const ADD_ONS: AddOnOption[] = [
  { name: '茶凍', price: 10 },
  { name: '珍珠', price: 10 },
  { name: '椰果', price: 10 },
];
