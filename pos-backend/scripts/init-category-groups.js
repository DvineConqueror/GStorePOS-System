const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Define CategoryGroup schema directly (since we can't import TS files in JS)
const categoryGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  description: String,
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const CategoryGroup = mongoose.model('CategoryGroup', categoryGroupSchema);

const defaultGroups = [
  { name: 'Food', description: 'Food products and groceries', order: 1 },
  { name: 'Beverages', description: 'Drinks and liquid refreshments', order: 2 },
  { name: 'Personal Care', description: 'Personal hygiene and care products', order: 3 },
  { name: 'Other', description: 'Miscellaneous products', order: 4 },
];

async function initializeCategoryGroups() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the first admin user to use as creator
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const adminUser = await User.findOne({ 
      role: { $in: ['manager', 'superadmin'] } 
    }).sort({ createdAt: 1 });

    if (!adminUser) {
      console.error('❌ No admin user found. Please create a superadmin first using npm run create-superadmin');
      process.exit(1);
    }

    console.log(`📝 Using admin user: ${adminUser.username} (${adminUser.role})`);

    // Initialize default category groups
    let created = 0;
    let existing = 0;

    for (const groupData of defaultGroups) {
      const existingGroup = await CategoryGroup.findOne({ name: groupData.name });
      
      if (!existingGroup) {
        await CategoryGroup.create({
          ...groupData,
          createdBy: adminUser._id,
        });
        console.log(`✅ Created category group: ${groupData.name}`);
        created++;
      } else {
        console.log(`ℹ️  Category group already exists: ${groupData.name}`);
        existing++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Already existed: ${existing}`);
    console.log(`   Total: ${created + existing}`);

    console.log('\n✅ Category groups initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing category groups:', error);
    process.exit(1);
  }
}

initializeCategoryGroups();

