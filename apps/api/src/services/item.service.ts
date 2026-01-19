import { HttpError } from '../errors';
import type { CategoryRepository, ItemEntity, ItemRepository } from '../repositories/types';

export class ItemService {
  private readonly itemRepo: ItemRepository;
  private readonly categoryRepo: CategoryRepository;

  constructor(itemRepo: ItemRepository, categoryRepo: CategoryRepository) {
    this.itemRepo = itemRepo;
    this.categoryRepo = categoryRepo;
  }

  async createItem(input: {
    name?: string;
    quantity?: number;
    categoryId?: string;
  }): Promise<ItemEntity> {
    const name = input.name?.trim();
    const quantity = input.quantity;
    const categoryId = input.categoryId;

    if (!name) throw new HttpError(400, 'name is required');
    if (typeof quantity !== 'number' || quantity < 0) {
      throw new HttpError(400, 'quantity must be a non-negative number');
    }
    if (!categoryId) throw new HttpError(400, 'categoryId is required');

    const category = await this.categoryRepo.findById(categoryId);
    if (!category) throw new HttpError(404, 'category not found');

    return this.itemRepo.create({ name, quantity, categoryId });
  }

  async listItems(filter?: { categoryId?: string }): Promise<ItemEntity[]> {
    return this.itemRepo.list(filter);
  }

  async deleteItem(id: string): Promise<void> {
    const item = await this.itemRepo.findById(id);
    if (!item) throw new HttpError(404, 'item not found');

    await this.itemRepo.deleteById(id);
  }
}
