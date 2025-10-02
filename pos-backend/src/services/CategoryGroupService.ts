import CategoryGroup, { ICategoryGroup } from '../models/CategoryGroup';
import mongoose from 'mongoose';

class CategoryGroupService {
  /**
   * Get all category groups
   */
  async getAllCategoryGroups(includeInactive: boolean = false): Promise<ICategoryGroup[]> {
    const filter = includeInactive ? {} : { isActive: true };
    return await CategoryGroup.find(filter).sort({ order: 1, name: 1 });
  }

  /**
   * Get category group by ID
   */
  async getCategoryGroupById(id: string): Promise<ICategoryGroup | null> {
    return await CategoryGroup.findById(id);
  }

  /**
   * Get category group by name
   */
  async getCategoryGroupByName(name: string): Promise<ICategoryGroup | null> {
    return await CategoryGroup.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  }

  /**
   * Create new category group
   */
  async createCategoryGroup(data: {
    name: string;
    description?: string;
    order?: number;
    createdBy: string;
  }): Promise<ICategoryGroup> {
    // Check if category group already exists
    const existingGroup = await CategoryGroup.findOne({ 
      name: { $regex: new RegExp(`^${data.name}$`, 'i') } 
    });
    
    if (existingGroup) {
      throw new Error('Category group with this name already exists');
    }

    // If no order specified, set it to the highest order + 1
    if (data.order === undefined) {
      const highestOrderGroup = await CategoryGroup.findOne().sort({ order: -1 });
      data.order = highestOrderGroup ? highestOrderGroup.order + 1 : 1;
    }

    const categoryGroup = new CategoryGroup({
      name: data.name,
      description: data.description,
      order: data.order,
      createdBy: new mongoose.Types.ObjectId(data.createdBy),
      isActive: true,
    });

    return await categoryGroup.save();
  }

  /**
   * Update category group
   */
  async updateCategoryGroup(
    id: string,
    data: {
      name?: string;
      description?: string;
      order?: number;
      isActive?: boolean;
    }
  ): Promise<ICategoryGroup | null> {
    // If updating name, check for duplicates
    if (data.name) {
      const existingGroup = await CategoryGroup.findOne({ 
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingGroup) {
        throw new Error('Category group with this name already exists');
      }
    }

    return await CategoryGroup.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  /**
   * Delete category group (soft delete by setting isActive to false)
   */
  async deleteCategoryGroup(id: string): Promise<ICategoryGroup | null> {
    return await CategoryGroup.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );
  }

  /**
   * Initialize default category groups
   */
  async initializeDefaultCategoryGroups(adminUserId: string): Promise<void> {
    const defaultGroups = [
      { name: 'Food', description: 'Food products and groceries', order: 1 },
      { name: 'Beverages', description: 'Drinks and liquid refreshments', order: 2 },
      { name: 'Personal Care', description: 'Personal hygiene and care products', order: 3 },
      { name: 'Other', description: 'Miscellaneous products', order: 4 },
    ];

    for (const groupData of defaultGroups) {
      const exists = await CategoryGroup.findOne({ name: groupData.name });
      if (!exists) {
        await this.createCategoryGroup({
          ...groupData,
          createdBy: adminUserId
        });
      }
    }
  }
}

export default new CategoryGroupService();

