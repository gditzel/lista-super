export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number | null;
  checked: boolean;
  createdAt: number;
}
