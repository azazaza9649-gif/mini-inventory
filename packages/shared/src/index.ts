export type Category = {
  id: string;
  name: string;
  createdAt: string;
};

export type Item = {
  id: string;
  name: string;
  quantity: number;
  categoryId: string;
  createdAt: string;
};
