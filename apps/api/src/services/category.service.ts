import { HttpError } from '../errors';
import type { CategoryEntity, CategoryRepository, ItemRepository } from '../repositories/types';

export class CategoryService {
  private readonly categoryRepo: CategoryRepository;
  private readonly itemRepo: ItemRepository;

  constructor(categoryRepo: CategoryRepository, itemRepo: ItemRepository) {
    this.categoryRepo = categoryRepo;
    this.itemRepo = itemRepo;
  }

  async createCategory(nameRaw: string | undefined): Promise<CategoryEntity> {
    const name = nameRaw?.trim();
    if (!name) throw new HttpError(400, 'name is required');

    try {
      return await this.categoryRepo.create({ name });
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? (err as { code?: unknown }).code
          : undefined;

      if (code === 'P2002') throw new HttpError(409, 'category already exists');
      throw err;
    }
  }

  async listCategories(): Promise<CategoryEntity[]> {
    return this.categoryRepo.list();
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepo.findById(id);
    if (!category) throw new HttpError(404, 'category not found');

    const itemsCount = await this.itemRepo.countByCategoryId(id);
    if (itemsCount > 0) throw new HttpError(409, 'category is used by items');

    await this.categoryRepo.deleteById(id);
  }
}
