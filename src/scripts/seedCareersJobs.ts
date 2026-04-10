import { connectCareersDB } from '../lib/mongodb';
import { getCareersJobModel } from '../models/careers/Job';

async function main() {
  try {
    console.log('🔄 Connecting to MongoDB careers database...');
    await connectCareersDB();
    console.log('✅ Connected to careers database');

    const Job = await getCareersJobModel();

    const postedDate = new Date('2026-03-02');

    const jobs = [
      {
        title: 'Marketing Intern',
        department: 'Marketing',
        location: 'Remote',
        type: 'internship' as const,
        experience: 'entry' as const,
        description:
          'Kickstart your marketing career as an intern and learn digital marketing, content creation, and brand management. Ideal for college final years or recent graduates passionate about marketing and communications.',
        requirements: [
          'Currently pursuing final year or recently completed degree in Marketing, Communications, Business, or related field',
          'Strong written and verbal communication skills',
          'Creative mindset and attention to detail',
          'Basic knowledge of social media platforms and digital marketing',
          'Proficiency in Microsoft Office and basic design tools',
          'Understanding of marketing principles and consumer behavior',
          'Ability to work independently and meet deadlines',
          'Any previous marketing project experience is welcome but not required'
        ],
        responsibilities: [
          'Assist in social media content creation and scheduling',
          'Support email marketing campaigns and newsletter creation',
          'Help with content marketing initiatives and blog writing',
          'Assist in market research and competitor analysis',
          'Support in creating marketing materials and presentations',
          'Learn and use marketing tools and analytics platforms',
          'Participate in marketing strategy discussions',
          'Help with event planning and coordination',
          'Assist in tracking and analyzing marketing metrics'
        ],
        benefits: [
          'Competitive stipend in INR',
          'Remote work flexibility',
          'Mentorship from experienced marketing professionals',
          'Hands-on experience with modern marketing tools',
          'Portfolio-building opportunities',
          'Networking within the marketing industry',
          'Potential for full-time employment',
          'Flexible schedule for students',
          'Access to latest marketing technologies and platforms'
        ],
        salary: { min: 12000, max: 20000, currency: 'INR' },
        isActive: true,
        tags: [
          'Marketing',
          'Internship',
          'Digital Marketing',
          'Social Media',
          'Content Creation',
          'Entry-level'
        ],
        company: 'HR Dashboard',
        contactEmail: 'careers@portal.inovatrix.io',
        postedDate
      },
      {
        title: 'Frontend Development Intern',
        department: 'Engineering',
        location: 'Remote',
        type: 'internship' as const,
        experience: 'entry' as const,
        description:
          'Start your journey as a Frontend Development Intern and learn to create beautiful, responsive user interfaces. Ideal for college final years or recent graduates passionate about web development and user experience.',
        requirements: [
          'Currently pursuing final year or recently completed degree in Computer Science, IT, Design, or related field',
          'Basic understanding of HTML, CSS, and JavaScript',
          'Familiarity with modern frontend frameworks (React, Vue, or Angular) is a plus',
          'Understanding of responsive design principles',
          'Creative mindset and attention to detail',
          'Strong problem-solving skills and willingness to learn',
          'Basic knowledge of version control (Git) is beneficial',
          'Any previous web development projects are welcome but not required'
        ],
        responsibilities: [
          'Assist in developing responsive and user-friendly web interfaces',
          'Write clean, semantic HTML and maintainable CSS',
          'Implement interactive features using JavaScript',
          'Collaborate with designers and backend developers',
          'Learn and apply modern frontend development practices',
          'Participate in code reviews and team discussions',
          'Contribute to improving user experience and accessibility',
          'Test and debug frontend applications across different browsers'
        ],
        benefits: [
          'Competitive stipend in INR',
          'Remote work flexibility',
          'Mentorship from experienced frontend developers',
          'Hands-on experience with modern web technologies',
          'Portfolio-building opportunities',
          'Networking within the tech community',
          'Potential for full-time employment',
          'Flexible schedule for students'
        ],
        salary: { min: 15000, max: 25000, currency: 'INR' },
        isActive: true,
        tags: [
          'Frontend',
          'Internship',
          'HTML',
          'CSS',
          'JavaScript',
          'React',
          'UI/UX',
          'Entry-level'
        ],
        company: 'HR Dashboard',
        contactEmail: 'careers@portal.inovatrix.io',
        postedDate
      },
      {
        title: 'Sales Intern',
        department: 'Sales',
        location: 'Remote',
        type: 'internship' as const,
        experience: 'entry' as const,
        description:
          'Join our sales team as an intern and learn the fundamentals of B2B sales, customer relationship management, and business development. Perfect for college final years or recent graduates interested in sales and business.',
        requirements: [
          'Currently pursuing final year or recently completed degree in Business, Marketing, Commerce, or related field',
          'Excellent communication and interpersonal skills',
          'Strong presentation and negotiation abilities',
          'Basic understanding of business concepts and sales processes',
          'Proficiency in Microsoft Office (Excel, PowerPoint, Word)',
          'Self-motivated and target-driven mindset',
          'Ability to work independently and in teams',
          'Any previous sales or customer service experience is a plus but not required'
        ],
        responsibilities: [
          'Assist in lead generation and prospecting activities',
          'Support sales team in customer research and market analysis',
          'Help prepare sales presentations and proposals',
          'Participate in sales calls and meetings (shadowing experienced salespeople)',
          'Learn CRM software and sales tools',
          'Assist in maintaining customer databases and sales records',
          'Support in creating sales reports and analytics',
          'Learn about different sales methodologies and techniques'
        ],
        benefits: [
          'Competitive stipend in INR',
          'Remote work flexibility',
          'Mentorship from experienced sales professionals',
          'Real-world sales experience and training',
          'Commission opportunities based on performance',
          'Networking with industry professionals',
          'Potential for full-time employment',
          'Flexible schedule for students'
        ],
        salary: { min: 12000, max: 20000, currency: 'INR' },
        isActive: true,
        tags: [
          'Sales',
          'Internship',
          'Business Development',
          'Customer Relations',
          'B2B',
          'Entry-level'
        ],
        company: 'HR Dashboard',
        contactEmail: 'careers@portal.inovatrix.io',
        postedDate
      },
      {
        title: 'Backend Development Intern',
        department: 'Engineering',
        location: 'Remote',
        type: 'internship' as const,
        experience: 'entry' as const,
        description:
          'Join our engineering team as a Backend Development Intern and gain hands-on experience building scalable server-side applications. Perfect for college final years or recent graduates looking to kickstart their career in software development.',
        requirements: [
          'Currently pursuing final year or recently completed degree in Computer Science, IT, or related field',
          'Basic understanding of programming concepts and algorithms',
          'Knowledge of at least one programming language (Python, Node.js, Java, or similar)',
          'Familiarity with databases (SQL or NoSQL)',
          'Basic understanding of REST APIs and web services',
          'Strong problem-solving skills and eagerness to learn',
          'Experience with version control (Git) is a plus',
          'Any previous project experience is welcome but not required'
        ],
        responsibilities: [
          'Assist in developing and maintaining backend services',
          'Write clean, efficient, and well-documented code',
          'Participate in code reviews and team discussions',
          'Learn and implement best practices in software development',
          'Collaborate with frontend developers and other team members',
          'Contribute to API development and database design',
          'Participate in testing and debugging processes'
        ],
        benefits: [
          'Competitive stipend in INR',
          'Remote work flexibility',
          'Mentorship from experienced developers',
          'Real-world project experience',
          'Networking opportunities within the tech industry',
          'Potential for full-time employment',
          'Flexible schedule to accommodate studies',
          'Latest development tools and technologies'
        ],
        salary: { min: 15000, max: 25000, currency: 'INR' },
        isActive: true,
        tags: [
          'Backend',
          'Internship',
          'Python',
          'Node.js',
          'Java',
          'Database',
          'API',
          'Entry-level'
        ],
        company: 'HR Dashboard',
        contactEmail: 'careers@portal.inovatrix.io',
        postedDate
      },
      {
        title: 'Product Designer',
        department: 'Design',
        location: 'Bengaluru, India',
        type: 'full-time' as const,
        experience: 'mid' as const,
        description:
          'We are looking for a Product Designer to craft intuitive, delightful user experiences across our AI-enabled products. You will collaborate with engineering and product to deliver impactful solutions.',
        requirements: [
          '3+ years in product design with a strong portfolio',
          'Proficiency in Figma and modern design systems',
          'Ability to create wireframes, flows, and high-fidelity designs',
          'Strong understanding of UX research and usability',
          'Experience working with design tokens and component libraries'
        ],
        responsibilities: [
          'Own end-to-end product experiences',
          'Collaborate closely with PM and Engineering',
          'Run quick user tests and iterate rapidly',
          'Contribute to and evolve our design system',
          'Advocate for user-centered design'
        ],
        benefits: [
          'Competitive salary in INR',
          'Health insurance',
          'Flexible work hours',
          'Learning budget',
          'Hybrid work setup'
        ],
        salary: { min: 1200000, max: 1800000, currency: 'INR' },
        isActive: true,
        tags: ['Design', 'Figma', 'UX', 'UI', 'Design System'],
        company: 'HR Dashboard',
        contactEmail: 'careers@portal.inovatrix.io',
        postedDate,
        deadline: new Date('2026-04-15')
      },
      {
        title: 'Senior Backend Engineer',
        department: 'Engineering',
        location: 'Remote',
        type: 'full-time' as const,
        experience: 'senior' as const,
        description:
          'Design and build scalable backend services that power our AI-first products. You will lead key initiatives, mentor peers, and drive engineering excellence.',
        requirements: [
          '6+ years backend development (Node.js/TypeScript preferred)',
          'Experience with MongoDB and distributed systems',
          'Strong API design and performance optimization skills',
          'Proficiency with cloud platforms (AWS/GCP/Azure)',
          'CI/CD and testing best practices'
        ],
        responsibilities: [
          'Design scalable services and APIs',
          'Own key systems from design to production',
          'Mentor engineers and review code',
          'Drive reliability, security, and performance',
          'Collaborate cross-functionally to deliver features'
        ],
        benefits: [
          'Top-of-market compensation',
          'Remote-first culture',
          'Stock options',
          'Learning stipend',
          'Wellness benefits'
        ],
        salary: { min: 3000000, max: 4500000, currency: 'INR' },
        isActive: true,
        tags: ['Node.js', 'TypeScript', 'MongoDB', 'Microservices', 'AWS'],
        company: 'HR Dashboard',
        contactEmail: 'careers@portal.inovatrix.io',
        postedDate,
        deadline: new Date('2026-04-30')
      },
      {
        title: 'Data Analyst',
        department: 'Data',
        location: 'Pune, India',
        type: 'full-time' as const,
        experience: 'mid' as const,
        description:
          'Analyze product and business data to uncover insights, build dashboards, and inform strategy. Work closely with leadership to measure and improve outcomes.',
        requirements: [
          '3+ years as a data analyst or similar role',
          'Strong SQL and data visualization (Looker/PowerBI/Tableau)',
          'Experience with Python/R for analysis is a plus',
          'Comfort with experimentation and A/B testing',
          'Excellent communication of insights'
        ],
        responsibilities: [
          'Build and maintain executive dashboards',
          'Partner with teams to define metrics and KPIs',
          'Perform exploratory and ad-hoc analyses',
          'Design and evaluate experiments',
          'Data quality monitoring and documentation'
        ],
        benefits: [
          'Competitive salary',
          'Health insurance',
          'Flexible PTO',
          'Learning budget',
          'Hybrid work'
        ],
        salary: { min: 1200000, max: 1800000, currency: 'INR' },
        isActive: true,
        tags: ['SQL', 'Analytics', 'Dashboards', 'A/B Testing', 'Python'],
        company: 'HR Dashboard',
        contactEmail: 'careers@portal.inovatrix.io',
        postedDate,
        deadline: new Date('2026-05-15')
      },
      {
        title: 'DevOps Engineer',
        department: 'Engineering',
        location: 'Remote',
        type: 'full-time' as const,
        experience: 'mid' as const,
        description:
          'Own CI/CD pipelines, infrastructure-as-code, monitoring, and reliability for our cloud services. Help us ship faster with confidence.',
        requirements: [
          '3+ years in DevOps/SRE',
          'Experience with AWS/GCP, Terraform, and Kubernetes',
          'Observability tools (Prometheus, Grafana, ELK) experience',
          'Security and cost optimization awareness',
          'Strong scripting skills (Bash/Python)'
        ],
        responsibilities: [
          'Maintain and evolve CI/CD pipelines',
          'Automate infrastructure with IaC',
          'Implement observability and on-call best practices',
          'Improve deployment speed and reliability',
          'Collaborate with engineering on production readiness'
        ],
        benefits: [
          'Competitive salary',
          'Remote work',
          'Home office stipend',
          'Learning budget',
          'Wellness benefits'
        ],
        salary: { min: 2000000, max: 3000000, currency: 'INR' },
        isActive: true,
        tags: ['DevOps', 'Kubernetes', 'Terraform', 'AWS', 'CI/CD'],
        company: 'HR Dashboard',
        contactEmail: 'careers@portal.inovatrix.io',
        postedDate,
        deadline: new Date('2026-04-30')
      },
      {
        title: 'HR Operations Associate',
        department: 'People & Ops',
        location: 'Mumbai, India',
        type: 'full-time' as const,
        experience: 'entry' as const,
        description:
          'Support HR operations including onboarding, attendance, leave management, and employee engagement initiatives across our AI-enabled HR platform.',
        requirements: [
          '0-2 years in HR operations or related roles',
          'Strong communication and organizational skills',
          'Comfort with HRIS tools and spreadsheets',
          'Attention to detail and confidentiality',
          'Customer-first mindset'
        ],
        responsibilities: [
          'Own onboarding and documentation',
          'Support attendance and leave processes',
          'Coordinate employee engagement initiatives',
          'Maintain HR data quality and reports',
          'Collaborate with managers and finance'
        ],
        benefits: [
          'Competitive salary',
          'Health insurance',
          'Hybrid work',
          'Learning budget',
          'Paid time off'
        ],
        salary: { min: 600000, max: 900000, currency: 'INR' },
        isActive: true,
        tags: ['HR', 'Operations', 'Onboarding', 'HRIS', 'People'],
        company: 'HR Dashboard',
        contactEmail: 'careers@portal.inovatrix.io',
        postedDate,
        deadline: new Date('2026-05-01')
      },
      {
        title: 'Customer Success Manager',
        department: 'Customer Success',
        location: 'Delhi NCR, India',
        type: 'full-time' as const,
        experience: 'mid' as const,
        description:
          'Drive adoption, retention, and growth by building trusted relationships with our customers. You will be the voice of the customer across HR Dashboard.',
        requirements: [
          '3+ years in customer success or account management',
          'Excellent communication and stakeholder management',
          'Data-driven with experience in success metrics',
          'Familiarity with CRM/CS tools',
          'Ability to translate feedback into product insights'
        ],
        responsibilities: [
          'Onboard and train customers',
          'Develop success plans and track outcomes',
          'Drive renewals and expansion opportunities',
          'Escalation management and coordination',
          'Advocate customer needs internally'
        ],
        benefits: [
          'Competitive salary',
          'Incentive plan',
          'Health insurance',
          'Learning budget',
          'Hybrid work'
        ],
        salary: { min: 1200000, max: 1800000, currency: 'INR' },
        isActive: true,
        tags: ['Customer Success', 'Retention', 'CRM', 'SaaS', 'Onboarding'],
        company: 'HR Dashboard',
        contactEmail: 'careers@portal.inovatrix.io',
        postedDate,
        deadline: new Date('2026-04-01')
      }
    ];

    console.log('📝 Upserting careers jobs...');
    let upsertedCount = 0;
    for (const job of jobs) {
      const result = await Job.findOneAndUpdate(
        { title: job.title, department: job.department },
        {
          $set: {
            location: job.location,
            type: job.type,
            experience: job.experience,
            description: job.description,
            requirements: job.requirements,
            responsibilities: job.responsibilities,
            benefits: job.benefits,
            salary: job.salary,
            isActive: job.isActive,
            tags: job.tags,
            company: job.company,
            contactEmail: job.contactEmail
          },
          $setOnInsert: { postedDate: job.postedDate }
        },
        { upsert: true, new: true }
      );
      if (result) upsertedCount += 1;
      console.log(`   • ${job.title} (${job.department})`);
    }

    console.log(`✅ Upserted ${upsertedCount} jobs`);
    console.log('🎉 Careers jobs seeding finished');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding careers jobs:', err);
    process.exit(1);
  }
}

main();


