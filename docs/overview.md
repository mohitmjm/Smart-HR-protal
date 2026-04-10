# HR Portal Functions Overview

This document provides a comprehensive overview of all functions available in the HR Portal, organized by page and user role (Manager vs Employee).

## Portal Pages Overview

The HR Portal consists of the following main pages:
- **Dashboard** - Main landing page with quick actions and overview
- **Attendance** - Clock in/out and attendance tracking
- **Leaves** - Leave requests and management
- **Team** - Team management and member oversight
- **Profile** - Personal profile management
- **Settings** - User preferences and configuration
- **Documents** - Document management and access
- **Notifications** - Notification center and alerts

---

## Page-wise Functions

### 1. Dashboard (`/portal/dashboard`)

**Available to: Both Managers and Employees**

#### Core Functions:
- **Personalized Greeting** - Time-based greeting with user's name
- **Real-time Clock** - Current time and date display in user's timezone
- **Quick Actions Panel**:
  - Clock In/Out (redirects to attendance page)
  - Request Leave (redirects to leaves page)
  - Update Profile (redirects to profile page)
  - View Documents (redirects to documents page)
- **Dashboard Summary Cards** - Key metrics and statistics
- **Recent Activity Widget** - Latest activities and updates
- **Team Stats View** - Team performance metrics (for managers)
- **Upcoming Events** - Calendar events and reminders
- **Help Navigation** - Quick links to settings, team, and documents

---

### 2. Attendance (`/portal/attendance`)

**Available to: Both Managers and Employees**

#### Employee Functions:
- **Clock In/Out**:
  - Real-time clock in/out with location tracking (optional)
  - Add notes for clock in/out sessions
  - Location permission handling
  - Session management (multiple clock in/out per day)
- **Attendance History**:
  - View monthly attendance records
  - Expandable session details
  - Export attendance data
  - Regularization request submission
- **Current Session Status**:
  - View active clock-in session
  - Real-time duration tracking
  - Session notes management

#### Manager Functions (Team View):
- **Team Attendance Overview**:
  - View all team members' attendance
  - Today's attendance status
  - Monthly team attendance calendar
- **Team Member Management**:
  - Individual member attendance details
  - Attendance pattern analysis
  - Regularization request review and approval
- **Attendance Analytics**:
  - Team attendance statistics
  - Absenteeism tracking
  - Performance metrics

---

### 3. Leaves (`/portal/leaves`)

**Available to: Both Managers and Employees**

#### Employee Functions:
- **Leave Request Form**:
  - Submit new leave requests
  - Select leave type (sick, casual, annual, maternity, paternity)
  - Date range selection with calendar
  - Reason submission
  - Leave balance checking
  - Working days calculation
- **Leave Calendar**:
  - Visual calendar view of approved leaves
  - Month navigation
  - Leave status indicators
- **Leave History**:
  - View all leave requests
  - Filter by status (pending, approved, rejected, cancelled)
  - Leave details and status tracking
- **Upcoming Leaves**:
  - View approved upcoming leaves
  - Days until leave calculation
  - Leave cancellation (if allowed)

#### Manager Functions (Team View):
- **Team Leave Calendar**:
  - Overview of all team members' leaves
  - Team leave planning
  - Conflict detection
- **Pending Approvals**:
  - Review and approve/reject leave requests
  - Add approval notes
  - Bulk approval actions
- **Approved Leaves**:
  - View approved team leaves
  - Leave history for team members
  - Leave analytics

---

### 4. Team (`/portal/team`)

**Available to: Managers Only**

#### Team Management Functions:
- **Team Overview**:
  - View all team members
  - Team statistics and metrics
  - Member search and filtering
- **Member Management**:
  - Add/remove team members
  - Edit member details
  - View member profiles
  - Member status management
- **Team Structure**:
  - View team hierarchy
  - Team leader assignment
  - Department organization
- **Team Analytics**:
  - Attendance summaries
  - Leave patterns
  - Performance metrics
- **Member Details**:
  - Individual member profiles
  - Attendance history
  - Leave records
  - Contact information

---

### 5. Profile (`/portal/profile`)

**Available to: Both Managers and Employees**

#### Profile Management Functions:
- **Personal Information**:
  - Edit personal details (name, email, contact)
  - Update employee ID and position
  - Department and manager information
- **Contact Details**:
  - Phone number management
  - Emergency contact information
  - Address management
- **Leave Balance**:
  - View current leave balances
  - Leave type breakdown
  - Balance history
- **Profile Sync**:
  - Sync with Clerk authentication
  - Update profile from external sources
- **Account Settings**:
  - Profile photo management
  - Account status
  - Security settings

---

### 6. Settings (`/portal/settings`)

**Available to: Both Managers and Employees**

#### Settings Categories:

##### Notification Settings:
- **Email Notifications**:
  - Attendance reminders
  - Leave updates
  - System alerts
  - Weekly reports
- **Push Notifications**:
  - Real-time updates
  - Mobile notifications
- **SMS Notifications**:
  - Critical alerts
  - Emergency notifications

##### Security Settings:
- **Two-Factor Authentication**:
  - Enable/disable 2FA
  - Backup codes
- **Session Management**:
  - Session timeout settings
  - Device management
- **Password Settings**:
  - Password change
  - Password expiry
- **Login Notifications**:
  - Login alerts
  - Suspicious activity

##### Appearance Settings:
- **Theme Selection**:
  - Light/Dark mode
  - System preference
- **Language Settings**:
  - Interface language
  - Date/time formats
- **Timezone Configuration**:
  - Timezone selection
  - Date format preferences
  - Time format (12h/24h)

---

### 7. Documents (`/portal/documents`)

**Available to: Both Managers and Employees**

#### Document Management Functions:
- **Document Browser**:
  - View all available documents
  - Search and filter documents
  - Category-based organization
- **Document Categories**:
  - Contracts
  - Policies
  - Forms
  - Reports
  - Certificates
  - Other
- **Document Actions**:
  - Download documents
  - View document details
  - Document preview
- **Document Upload** (if permitted):
  - Upload new documents
  - Document metadata management
  - File type validation
- **Document Search**:
  - Full-text search
  - Filter by type and category
  - Sort by date/size/name

---

### 8. Notifications (`/portal/notifications`)

**Available to: Both Managers and Employees**

#### Notification Management Functions:
- **Notification Center**:
  - View all notifications
  - Mark as read/unread
  - Notification filtering
- **Notification Types**:
  - Leave requests
  - Leave approvals/rejections
  - Attendance alerts
  - System notifications
  - General announcements
- **Notification Filters**:
  - Filter by status (all, unread, read)
  - Filter by type
  - Filter by priority
  - Search notifications
- **Notification Actions**:
  - Mark individual notifications as read
  - Mark all as read
  - Delete notifications
- **Priority Levels**:
  - Urgent (red)
  - High (orange)
  - Medium (blue)
  - Low (gray)

---

## Role-based Access Summary

### Employee Functions
- **Dashboard**: Personal overview and quick actions
- **Attendance**: Clock in/out, view personal attendance history
- **Leaves**: Submit leave requests, view personal leave calendar and history
- **Profile**: Manage personal profile information
- **Settings**: Configure personal preferences and notifications
- **Documents**: Access and download company documents
- **Notifications**: View and manage personal notifications

### Manager Functions
- **All Employee Functions** plus:
- **Dashboard**: Team overview and management quick actions
- **Attendance**: Team attendance oversight and management
- **Leaves**: Team leave management, approvals, and planning
- **Team**: Complete team management and member oversight
- **Enhanced Notifications**: Team-related notifications and alerts

### Key Differences
- **Managers** have access to team management functions
- **Managers** can approve/reject leave requests from team members
- **Managers** can view team attendance and performance metrics
- **Managers** have enhanced notification capabilities for team activities
- **Employees** focus on personal data management and requests
- **Employees** can only view and manage their own information

---

## Technical Features

### Real-time Updates
- Live attendance tracking
- Real-time notification delivery
- Automatic data refresh
- WebSocket-based updates

### Timezone Support
- User-specific timezone handling
- Automatic timezone detection
- Consistent date/time display
- Timezone-aware calculations

### Mobile Responsiveness
- Responsive design for all screen sizes
- Touch-friendly interfaces
- Mobile-optimized navigation
- Progressive Web App features

### Security Features
- Role-based access control
- Secure authentication via Clerk
- Data encryption
- Session management
- Location-based attendance (optional)

---

*This overview covers all major functions available in the HR Portal. For specific implementation details or additional features, refer to the individual component documentation.*
