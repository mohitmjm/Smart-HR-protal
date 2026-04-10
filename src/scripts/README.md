# Utility Scripts

This directory contains utility scripts for database management, seeding, and maintenance tasks.

## Available Scripts

### Database Management
- **`checkHRDatabase.ts`**: Check HR database connectivity and status
- **`cleanupFakeUsers.ts`**: Clean up test/fake user data
- **`upsertManagerRelation.ts`**: Manage manager-employee relationships

### Data Seeding
- **`seedDatabase.ts`**: Seed the database with initial data
- **`seedDefaultRoles.ts`**: Create default user roles
- **`seedCareersJobs.ts`**: Seed career/job postings
- **`createCoffeeTeam.ts`**: Create sample team structure

## Usage

Run any script using:
```bash
npx tsx src/scripts/scriptName.ts
```

## Prerequisites

1. Ensure your environment variables are configured in `.env.local`
2. Make sure your database is accessible
3. Install dependencies: `npm install`
