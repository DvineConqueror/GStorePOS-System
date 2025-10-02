import Category, { ICategory } from '../models/Category';
import mongoose from 'mongoose';

class CategoryService {
  /**
   * Get all categories
   */
  async getAllCategories(includeInactive: boolean = false): Promise<ICategory[]> {
    const filter = includeInactive ? {} : { isActive: true };
    return await Category.find(filter).sort({ group: 1, name: 1 });
  }

  /**
   * Get categories by group
   */
  async getCategoriesByGroup(group: string): Promise<ICategory[]> {
    return await Category.find({ group, isActive: true }).sort({ name: 1 });
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<ICategory | null> {
    return await Category.findById(id);
  }

  /**
   * Create new category
   */
  async createCategory(data: {
    name: string;
    group: string;
    description?: string;
    createdBy: string;
  }): Promise<ICategory> {
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${data.name}$`, 'i') } 
    });
    
    if (existingCategory) {
      throw new Error('Category with this name already exists');
    }

    const category = new Category({
      name: data.name,
      group: data.group,
      description: data.description,
      createdBy: new mongoose.Types.ObjectId(data.createdBy),
      isActive: true,
    });

    return await category.save();
  }

  /**
   * Update category
   */
  async updateCategory(
    id: string,
    data: {
      name?: string;
      group?: string;
      description?: string;
      isActive?: boolean;
    }
  ): Promise<ICategory | null> {
    // If updating name, check for duplicates
    if (data.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        throw new Error('Category with this name already exists');
      }
    }

    return await Category.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete category (soft delete by setting isActive to false)
   */
  async deleteCategory(id: string): Promise<ICategory | null> {
    return await Category.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );
  }

  /**
   * Get grouped categories (organized by group)
   */
  async getGroupedCategories(): Promise<Record<string, ICategory[]>> {
    const categories = await this.getAllCategories();
    
    const grouped: Record<string, ICategory[]> = {
      'Food': [],
      'Beverages': [],
      'Personal Care': [],
      'Other': []
    };

    categories.forEach(category => {
      if (grouped[category.group]) {
        grouped[category.group].push(category);
      } else {
        grouped['Other'].push(category);
      }
    });

    return grouped;
  }

  /**
   * Initialize default categories
   */
  async initializeDefaultCategories(adminUserId: string): Promise<void> {
    const defaultCategories = [
      { name: 'Snacks', group: 'Food', description: 'Chips, crackers, and snack foods' },
      { name: 'Candies', group: 'Food', description: 'Sweets and confectionery' },
      { name: 'Instant Noodles', group: 'Food', description: 'Quick meal noodles' },
      { name: 'Canned Goods', group: 'Food', description: 'Canned and preserved foods' },
      { name: 'Beverages', group: 'Beverages', description: 'General beverages' },
      { name: 'Soft Drinks', group: 'Beverages', description: 'Carbonated drinks' },
      { name: 'Juices', group: 'Beverages', description: 'Fruit and vegetable juices' },
      { name: 'Water', group: 'Beverages', description: 'Bottled water' },
      { name: 'Personal Care', group: 'Personal Care', description: 'General personal care items' },
      { name: 'Soap', group: 'Personal Care', description: 'Bath and hand soaps' },
      { name: 'Shampoo', group: 'Personal Care', description: 'Hair care products' },
      { name: 'Toothpaste', group: 'Personal Care', description: 'Dental care products' },
      { name: 'Others', group: 'Other', description: 'Miscellaneous items' },
    ];

    for (const catData of defaultCategories) {
      const exists = await Category.findOne({ name: catData.name });
      if (!exists) {
        await this.createCategory({
          ...catData,
          createdBy: adminUserId
        });
      }
    }
  }
}

export default new CategoryService();

