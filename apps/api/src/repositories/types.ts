export type CategoryEntity = {
  id: string;
  name: string;
  createdAt: Date;
};

export type ItemEntity = {
  id: string;
  name: string;
  quantity: number;
  categoryId: string;
  createdAt: Date;
};

export interface CategoryRepository {
  create(data: { name: string }): Promise<CategoryEntity>;
  findById(id: string): Promise<CategoryEntity | null>;
  list(): Promise<CategoryEntity[]>;
  deleteById(id: string): Promise<void>;
}

export interface ItemRepository {
  create(data: { name: string; quantity: number; categoryId: string }): Promise<ItemEntity>;
  findById(id: string): Promise<ItemEntity | null>;
  list(filter?: { categoryId?: string }): Promise<ItemEntity[]>;
  deleteById(id: string): Promise<void>;
  countByCategoryId(categoryId: string): Promise<number>;
}
