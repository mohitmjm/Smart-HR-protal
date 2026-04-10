import connectDB from '@/lib/mongodb';
import Role from '@/models/Role';

const defaultRoles = [
  {
    name: 'Employee',
    description: 'Basic employee role with standard permissions',
    permissions: [
      'attendance:read',
      'leaves:read',
      'leaves:create',
      'notifications:read'
    ],
    isSystem: true,
    isActive: true,
    createdBy: 'system'
  },
  {
    name: 'Manager',
    description: 'Manager role with team management permissions',
    permissions: [
      'attendance:read',
      'attendance:approve',
      'attendance:reject',
      'leaves:read',
      'leaves:create',
      'leaves:approve',
      'leaves:reject',
      'users:read',
      'teams:read',
      'teams:assign',
      'notifications:read',
      'notifications:send',
      'reports:read'
    ],
    isSystem: true,
    isActive: true,
    createdBy: 'system'
  },
  {
    name: 'HR',
    description: 'HR role with standard HR permissions',
    permissions: [
      'users:read',
      'users:create',
      'users:update',
      'users:delete',
      'users:export',
      'roles:read',
      'roles:create',
      'roles:update',
      'roles:delete',
      'permissions:read',
      'attendance:read',
      'attendance:create',
      'attendance:update',
      'attendance:approve',
      'attendance:reject',
      'attendance:export',
      'attendance:regularize',
      'leaves:read',
      'leaves:create',
      'leaves:update',
      'leaves:approve',
      'leaves:reject',
      'leaves:export',
      'teams:read',
      'teams:create',
      'teams:update',
      'teams:delete',
      'teams:assign',
      'reports:read',
      'reports:create',
      'reports:export',
      'settings:read',
      'settings:update',
      'departments:read',
      'departments:create',
      'departments:update',
      'departments:delete',
      'holidays:read',
      'holidays:create',
      'holidays:update',
      'holidays:delete',
      'notifications:read',
      'notifications:send',
      'notifications:manage',
      'audit:read'
    ],
    isSystem: true,
    isActive: true,
    createdBy: 'system'
  },
  {
    name: 'HR Manager',
    description: 'HR Manager role with comprehensive HR permissions including bulk operations and analytics',
    permissions: [
      'users:read',
      'users:create',
      'users:update',
      'users:delete',
      'users:bulk',
      'users:export',
      'roles:read',
      'roles:create',
      'roles:update',
      'roles:delete',
      'permissions:read',
      'attendance:read',
      'attendance:create',
      'attendance:update',
      'attendance:approve',
      'attendance:reject',
      'attendance:export',
      'attendance:regularize',
      'leaves:read',
      'leaves:create',
      'leaves:update',
      'leaves:approve',
      'leaves:reject',
      'leaves:export',
      'teams:read',
      'teams:create',
      'teams:update',
      'teams:delete',
      'teams:assign',
      'reports:read',
      'reports:create',
      'reports:export',
      'analytics:view',
      'analytics:advanced',
      'settings:read',
      'settings:update',
      'departments:read',
      'departments:create',
      'departments:update',
      'departments:delete',
      'holidays:read',
      'holidays:create',
      'holidays:update',
      'holidays:delete',
      'notifications:read',
      'notifications:send',
      'notifications:manage',
      'audit:read',
      'admin:hr'
    ],
    isSystem: true,
    isActive: true,
    createdBy: 'system'
  },
  {
    name: 'Admin',
    description: 'Full administrative access to all system features',
    permissions: [
      'admin:full'
    ],
    isSystem: true,
    isActive: true,
    createdBy: 'system'
  }
];

export async function seedDefaultRoles() {
  try {
    await connectDB();
    
    console.log('Starting to seed default roles...');
    
    for (const roleData of defaultRoles) {
      // Check if role already exists
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (existingRole) {
        console.log(`Role "${roleData.name}" already exists, skipping...`);
        continue;
      }
      
      // Create new role
      const role = new Role(roleData);
      await role.save();
      console.log(`Created role: ${roleData.name}`);
    }
    
    console.log('Default roles seeded successfully!');
  } catch (error) {
    console.error('Error seeding default roles:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  seedDefaultRoles()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}