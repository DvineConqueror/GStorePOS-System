# Role Hierarchy Testing Guide

## Overview
This document outlines the complete testing procedure for the hierarchical user system in the Grocery Store POS application.

## System Architecture

### Role Hierarchy
1. **Superadmin** (Highest Authority)
   - Creates manager accounts
   - Approves/rejects cashier accounts
   - Manages all users in the system
   - Access: Hidden URL `/superadmin`

2. **Manager** (Middle Authority)
   - Creates cashier accounts (auto-approved)
   - Approves/rejects cashier registrations
   - Manages cashiers and products
   - Access: `/dashboard` (Manager Dashboard)

3. **Cashier** (Lowest Authority)
   - Registers for account (requires approval)
   - Uses POS system after approval
   - Access: `/pos` (POS System)

## Testing Procedure

### Phase 1: Initial Setup
1. **Create Superadmin Account**
   ```bash
   cd pos-backend
   npm run create-superadmin
   ```
   - Follow prompts to create superadmin account
   - Verify account is created with `isApproved: true` and `isActive: true`

2. **Verify Database**
   - Check MongoDB for superadmin user
   - Verify role is set to 'superadmin'
   - Confirm approval fields are properly set

### Phase 2: Superadmin Functionality
1. **Access Superadmin Panel**
   - Navigate to `http://localhost:8080/superadmin`
   - Login with superadmin credentials
   - Verify access to superadmin dashboard

2. **Create Manager Account**
   - Go to "Create Manager" section
   - Fill out manager creation form
   - Submit and verify manager is created
   - Check that manager has `isApproved: true` and `isActive: true`

3. **Test Manager Login**
   - Logout from superadmin
   - Login with manager credentials
   - Verify access to manager dashboard
   - Confirm manager cannot access superadmin panel

### Phase 3: Manager Functionality
1. **Manager Dashboard**
   - Verify manager can see cashier management options
   - Check that pending approvals are displayed
   - Test navigation to different sections

2. **Create Cashier Account**
   - Use manager dashboard to create cashier
   - Verify cashier is auto-approved
   - Check cashier can login immediately

### Phase 4: Cashier Registration & Approval
1. **Cashier Self-Registration**
   - Logout from manager
   - Go to login page
   - Switch to "Cashier Mode"
   - Click "Sign Up"
   - Register new cashier account
   - Verify account is created with `isApproved: false`

2. **Manager Approval Process**
   - Login as manager
   - Go to "Pending Approvals"
   - See newly registered cashier
   - Approve the cashier account
   - Verify cashier can now login

3. **Cashier Login After Approval**
   - Logout from manager
   - Login with approved cashier credentials
   - Verify access to POS system
   - Confirm cashier cannot access manager/superadmin areas

### Phase 5: Permission Testing
1. **Route Access Control**
   - Test each role's access to different routes
   - Verify unauthorized access is blocked
   - Check redirects work properly

2. **API Endpoint Security**
   - Test API endpoints with different roles
   - Verify proper authorization headers
   - Check error responses for unauthorized access

### Phase 6: Edge Cases
1. **Multiple Superadmins**
   - Try to create second superadmin
   - Verify only one superadmin is allowed

2. **Approval Workflow**
   - Test bulk approval/rejection
   - Verify approval notifications
   - Check status updates in real-time

3. **Account Deactivation**
   - Test deactivating approved users
   - Verify they cannot login after deactivation
   - Check reactivation process

## Expected Results

### Database Schema
```javascript
// User Document Structure
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  role: 'superadmin' | 'manager' | 'cashier',
  firstName: String,
  lastName: String,
  isActive: Boolean,
  isApproved: Boolean,
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  createdBy: ObjectId (ref: User),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints
- `POST /api/v1/auth/setup` - Initial manager creation (public)
- `POST /api/v1/auth/register-cashier` - Cashier registration (public)
- `POST /api/v1/auth/register` - User creation (authenticated, manager/superadmin)
- `GET /api/v1/superadmin/*` - Superadmin operations (superadmin only)
- `GET /api/v1/users/*` - User management (manager/superadmin)

### Frontend Routes
- `/superadmin` - Superadmin panel (superadmin only)
- `/dashboard` - Manager dashboard (manager/superadmin)
- `/pos` - POS system (all approved users)
- `/login` - Authentication (public)

## Troubleshooting

### Common Issues
1. **CORS Errors**
   - Check backend CORS configuration
   - Verify frontend URL in environment variables

2. **Authentication Failures**
   - Check JWT token expiration
   - Verify user approval status
   - Check role permissions

3. **Database Connection**
   - Verify MongoDB connection string
   - Check database permissions
   - Ensure indexes are created

### Debug Commands
```bash
# Check backend logs
cd pos-backend
npm run dev

# Check frontend logs
cd pos-frontend
npm run dev

# Test API endpoints
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test","password":"test"}'
```

## Success Criteria
- [ ] Superadmin can create manager accounts
- [ ] Manager can create and approve cashier accounts
- [ ] Cashiers can register and wait for approval
- [ ] All role-based access controls work properly
- [ ] Approval workflow functions correctly
- [ ] Notifications display properly
- [ ] Database schema is correct
- [ ] API security is enforced
- [ ] Frontend routing works as expected
- [ ] No linting errors or TypeScript issues

## Completion Checklist
- [ ] All tests pass
- [ ] No console errors
- [ ] Database is properly seeded
- [ ] All user flows work end-to-end
- [ ] Security measures are in place
- [ ] Documentation is complete
