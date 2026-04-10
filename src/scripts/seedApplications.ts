import { connectCareersDB } from '../lib/mongodb';
import { getCareersJobModel } from '../models/careers/Job';
import { getCareersApplicationModel } from '../models/careers/Application';

async function main() {
  try {
    console.log('🔄 Connecting to MongoDB careers database...');
    await connectCareersDB();
    console.log('✅ Connected to careers database');

    const Job = await getCareersJobModel();
    const Application = await getCareersApplicationModel();

    // Get existing jobs to reference
    const existingJobs = await Job.find({ isActive: true })
      .select('_id title department')
      .limit(10)
      .lean();

    if (existingJobs.length === 0) {
      console.error('❌ No active jobs found. Please seed jobs first.');
      process.exit(1);
    }

    console.log(`📋 Found ${existingJobs.length} jobs to assign applications to`);

    // Generate dummy applications
    const applications = [];
    const statuses: Array<'pending' | 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected'> = 
      ['pending', 'reviewing', 'shortlisted', 'interviewed', 'offered', 'rejected'];
    
    const firstNames = [
      'Priya', 'Rajesh', 'Anjali', 'Kumar', 'Sneha', 'Amit', 'Divya', 'Rohit',
      'Sakshi', 'Vikram', 'Meera', 'Arjun', 'Kavya', 'Siddharth', 'Aditi',
      'John', 'Emily', 'Michael', 'Sarah', 'David', 'Jessica', 'James', 'Emma'
    ];
    
    const lastNames = [
      'Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Gupta', 'Joshi', 'Mehta',
      'Iyer', 'Nair', 'Shah', 'Desai', 'Patil', 'Agarwal', 'Malhotra',
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'
    ];

    const institutes = [
      'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'NIT Trichy', 'BITS Pilani',
      'IISc Bangalore', 'University of Mumbai', 'Delhi University', 'Anna University',
      'MIT', 'Stanford University', 'Harvard University', 'University of California',
      'Carnegie Mellon University', 'Indian Institute of Science'
    ];

    const degrees = [
      'Bachelor of Technology', 'Bachelor of Engineering', 'Master of Technology',
      'Bachelor of Science', 'Master of Science', 'Bachelor of Computer Science',
      'Master of Computer Science', 'MBA', 'Bachelor of Arts', 'Master of Business Administration'
    ];

    const companies = [
      'Infosys', 'TCS', 'Wipro', 'Accenture', 'Cognizant', 'Microsoft', 'Google',
      'Amazon', 'IBM', 'Oracle', 'HCL Technologies', 'Tech Mahindra', 'Capgemini',
      'Apple', 'Meta', 'Adobe', 'Salesforce', 'Goldman Sachs', 'JP Morgan'
    ];

    const positions = [
      'Software Engineer', 'Senior Software Engineer', 'Software Developer',
      'Full Stack Developer', 'Backend Developer', 'Frontend Developer',
      'Product Manager', 'Project Manager', 'Data Analyst', 'Business Analyst',
      'DevOps Engineer', 'QA Engineer', 'UI/UX Designer', 'Marketing Manager'
    ];

    // Create applications for last 3 months
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    for (let i = 0; i < 25; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const job = existingJobs[Math.floor(Math.random() * existingJobs.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Random date within last 3 months
      const randomTime = threeMonthsAgo.getTime() + 
        Math.random() * (now.getTime() - threeMonthsAgo.getTime());
      const appliedDate = new Date(randomTime);

      // Generate education (1-3 entries)
      const educationCount = Math.floor(Math.random() * 3) + 1;
      const education = [];
      for (let j = 0; j < educationCount; j++) {
        const startYear = 2015 + Math.floor(Math.random() * 8);
        const endYear = startYear + 3 + Math.floor(Math.random() * 2);
        education.push({
          institute: institutes[Math.floor(Math.random() * institutes.length)],
          degree: degrees[Math.floor(Math.random() * degrees.length)],
          startDate: `${startYear}-09`,
          endDate: `${endYear}-05`,
        });
      }

      // Generate experience (0-3 entries)
      const experienceCount = Math.floor(Math.random() * 4);
      const experience = [];
      for (let j = 0; j < experienceCount; j++) {
        const startYear = 2018 + Math.floor(Math.random() * 5);
        const endYear = startYear + 1 + Math.floor(Math.random() * 3);
        experience.push({
          company: companies[Math.floor(Math.random() * companies.length)],
          position: positions[Math.floor(Math.random() * positions.length)],
          startDate: `${startYear}-01`,
          endDate: j === experienceCount - 1 ? 'Present' : `${endYear}-12`,
          duties: `Responsible for developing and maintaining software solutions, collaborating with cross-functional teams, and ensuring code quality.`,
        });
      }

      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const phone = `+91${Math.floor(9000000000 + Math.random() * 1000000000)}`;

      applications.push({
        jobId: job._id,
        firstName,
        lastName,
        preferredName: Math.random() > 0.7 ? firstName : undefined,
        email,
        phone,
        location: ['Mumbai', 'Bangalore', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Remote'][
          Math.floor(Math.random() * 7)
        ],
        education,
        experience,
        resumeUrl: `https://example.com/resumes/${firstName}-${lastName}-${i}.pdf`,
        status,
        appliedDate,
        isActive: true,
      });
    }

    console.log('📝 Inserting applications...');
    let insertedCount = 0;
    for (const app of applications) {
      try {
        // Check if application already exists (by email and jobId)
        const existing = await Application.findOne({
          email: app.email,
          jobId: app.jobId,
        });

        if (!existing) {
          await Application.create(app);
          insertedCount += 1;
          console.log(`   • ${app.firstName} ${app.lastName} - ${status} - ${(app.jobId as any).title}`);
        } else {
          console.log(`   ⏭️  Skipped ${app.firstName} ${app.lastName} - already exists`);
        }
      } catch (error: any) {
        console.error(`   ❌ Error inserting ${app.firstName} ${app.lastName}:`, error.message);
      }
    }

    console.log(`✅ Inserted ${insertedCount} new applications`);
    console.log('🎉 Applications seeding finished');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding applications:', err);
    process.exit(1);
  }
}

main();

