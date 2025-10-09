import Category, { ICategory } from '../models/Category';

class CategoryService {
  /**
   * Get all categories
   */
  static async getAllCategories(includeInactive: boolean = false): Promise<ICategory[]> {
    const query = includeInactive ? {} : { isActive: true };
    return await Category.find(query).sort({ name: 1 });
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(id: string): Promise<ICategory | null> {
    return await Category.findById(id);
  }

  /**
   * Get category by name
   */
  static async getCategoryByName(name: string): Promise<ICategory | null> {
    return await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      isActive: true 
    });
  }

  /**
   * Create new category
   */
  static async createCategory(categoryData: {
    name: string;
    description?: string;
    createdBy: string;
  }): Promise<ICategory> {
    // Check if category already exists
    const existingCategory = await this.getCategoryByName(categoryData.name);
    if (existingCategory) {
      throw new Error('Category already exists');
    }

    const category = new Category(categoryData);
    return await category.save();
  }

  /**
   * Update category
   */
  static async updateCategory(id: string, updateData: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<ICategory | null> {
    // If updating name, check for duplicates
    if (updateData.name) {
      const existingCategory = await this.getCategoryByName(updateData.name);
      if (existingCategory && existingCategory._id.toString() !== id) {
        throw new Error('Category name already exists');
      }
    }

    return await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete category (soft delete)
   */
  static async deleteCategory(id: string): Promise<ICategory | null> {
    return await Category.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  /**
   * Get distinct category names for products
   */
  static async getCategoryNames(): Promise<string[]> {
    const categories = await Category.find({ isActive: true }).select('name');
    return categories.map(cat => cat.name).sort();
  }
}

export default CategoryService;
