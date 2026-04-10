import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import connectDB from '../src/lib/mongodb';
import UserProfile from '../src/models/UserProfile';
import Attendance from '../src/models/Attendance';
import Leave from '../src/models/Leave';
import Team from '../src/models/Team';
import Notification from '../src/models/Notification';
import SystemSettings from '../src/models/SystemSettings';
import VoiceCommand from '../src/models/VoiceCommand';
import Job from '../src/models/Job';
import Application from '../src/models/Application';
import Lead from '../src/models/Lead';

interface SchemaAnalysis {
  collectionName: string;
  totalDocuments: number;
  fieldAnalysis: Record<string, any>;
  dataPatterns: Record<string, any>;
  recommendations: string[];
}

async function analyzeCollection<T>(
  model: any,
  collectionName: string
): Promise<SchemaAnalysis> {
  console.log(`\n🔍 Analyzing ${collectionName}...`);
  
  const totalDocuments = await model.countDocuments();
  const sampleDocuments = await model.find().limit(100).lean();
  
  if (totalDocuments === 0) {
    return {
      collectionName,
      totalDocuments: 0,
      fieldAnalysis: {},
      dataPatterns: {},
      recommendations: ['Collection is empty - no data to analyze']
    };
  }

  const fieldAnalysis: Record<string, any> = {};
  const dataPatterns: Record<string, any> = {};
  const recommendations: string[] = [];

  // Analyze each document's structure
  sampleDocuments.forEach((doc: any) => {
    Object.keys(doc).forEach(key => {
      if (!fieldAnalysis[key]) {
        fieldAnalysis[key] = {
          types: new Set<string>(),
          values: new Set<any>(),
          nullCount: 0,
          emptyCount: 0,
          sampleValues: []
        };
      }
      
      const field = fieldAnalysis[key];
      const value = doc[key];
      
      // Track types
      field.types.add(typeof value);
      
      // Track null/empty values
      if (value === null || value === undefined) {
        field.nullCount++;
      } else if (typeof value === 'string' && value.trim() === '') {
        field.emptyCount++;
      }
      
      // Track sample values (limit to 10)
      if (field.sampleValues.length < 10 && value !== null && value !== undefined) {
        if (typeof value === 'string' && value.length > 50) {
          field.sampleValues.push(value.substring(0, 50) + '...');
        } else {
          field.sampleValues.push(value);
        }
      }
      
      // Track unique values for enums
      if (typeof value === 'string' && value.length < 100) {
        field.values.add(value);
      }
    });
  });

  // Convert Sets to arrays for JSON serialization
  Object.keys(fieldAnalysis).forEach(key => {
    fieldAnalysis[key].types = Array.from(fieldAnalysis[key].types);
    fieldAnalysis[key].values = Array.from(fieldAnalysis[key].values);
  });

  // Generate recommendations based on analysis
  Object.keys(fieldAnalysis).forEach(key => {
    const field = fieldAnalysis[key];
    
    if (field.nullCount > totalDocuments * 0.5) {
      recommendations.push(`Field '${key}' has high null rate (${field.nullCount}/${totalDocuments}) - consider making optional or providing defaults`);
    }
    
    if (field.types.length > 1) {
      recommendations.push(`Field '${key}' has mixed types: ${field.types.join(', ')} - consider standardizing`);
    }
    
    if (field.values.length > 0 && field.values.length < 20) {
      recommendations.push(`Field '${key}' has limited values (${field.values.length}) - consider using enum or validation`);
    }
  });

  // Analyze data patterns
  if (totalDocuments > 0) {
    const firstDoc = sampleDocuments[0];
    const lastDoc = sampleDocuments[sampleDocuments.length - 1];
    
    if (firstDoc.createdAt && lastDoc.createdAt) {
      const firstDate = new Date(firstDoc.createdAt);
      const lastDate = new Date(lastDoc.createdAt);
      const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
      
      dataPatterns.dateRange = {
        firstDocument: firstDate.toISOString(),
        lastDocument: lastDate.toISOString(),
        totalDays: daysDiff,
        documentsPerDay: totalDocuments / Math.max(daysDiff, 1)
      };
    }
  }

  return {
    collectionName,
    totalDocuments,
    fieldAnalysis,
    dataPatterns,
    recommendations
  };
}

async function generateAnalyticsInsights(): Promise<void> {
  console.log('📊 Generating Analytics Insights...\n');
  
  const insights = {
    hrAnalytics: [
      'Employee turnover rate analysis',
      'Department performance metrics',
      'Leave pattern analysis',
      'Attendance trends and patterns',
      'Team productivity metrics',
      'Manager effectiveness analysis',
      'Workload distribution analysis',
      'Overtime patterns and costs',
      'Employee satisfaction trends',
      'Training and development needs'
    ],
    businessIntelligence: [
      'Resource allocation optimization',
      'Cost per employee analysis',
      'Productivity correlation with leave/attendance',
      'Geographic performance analysis',
      'Timezone impact on productivity',
      'Seasonal trends in HR metrics',
      'Predictive analytics for attrition',
      'ROI analysis for HR initiatives',
      'Compliance and audit reporting',
      'Benchmarking against industry standards'
    ],
    operationalMetrics: [
      'Real-time dashboard metrics',
      'Automated reporting systems',
      'Alert systems for anomalies',
      'Performance trend forecasting',
      'Capacity planning insights',
      'Risk assessment metrics',
      'Efficiency optimization opportunities',
      'Process improvement metrics',
      'Quality assurance metrics',
      'Customer satisfaction correlation'
    ]
  };

  console.log('🎯 HR Analytics Capabilities:');
  insights.hrAnalytics.forEach((insight, index) => {
    console.log(`  ${index + 1}. ${insight}`);
  });

  console.log('\n📈 Business Intelligence Opportunities:');
  insights.businessIntelligence.forEach((insight, index) => {
    console.log(`  ${index + 1}. ${insight}`);
  });

  console.log('\n⚡ Operational Metrics:');
  insights.operationalMetrics.forEach((insight, index) => {
    console.log(`  ${index + 1}. ${insight}`);
  });
}

async function generateSchemaImprovementPlan(): Promise<void> {
  console.log('\n🚀 Schema Improvement Plan:\n');
  
  const improvements = {
    dataIntegrity: [
      'Implement referential integrity constraints',
      'Add data validation middleware',
      'Create audit trails for all critical operations',
      'Implement soft delete patterns',
      'Add data versioning for critical fields'
    ],
    performance: [
      'Optimize indexes for common query patterns',
      'Implement data archiving strategies',
      'Add caching layers for frequently accessed data',
      'Implement data partitioning for large collections',
      'Add read replicas for analytics queries'
    ],
    scalability: [
      'Design for horizontal scaling',
      'Implement data sharding strategies',
      'Add support for multi-tenancy',
      'Create data migration pipelines',
      'Implement backup and recovery strategies'
    ],
    analytics: [
      'Create aggregated collections for reporting',
      'Implement real-time data streaming',
      'Add data warehouse integration',
      'Create materialized views for complex queries',
      'Implement data lake architecture for raw data'
    ],
    security: [
      'Implement field-level encryption',
      'Add data masking for sensitive information',
      'Create role-based access control at document level',
      'Implement audit logging for all data access',
      'Add data retention policies'
    ]
  };

  Object.entries(improvements).forEach(([category, items]) => {
    console.log(`🔧 ${category.charAt(0).toUpperCase() + category.slice(1)}:`);
    items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item}`);
    });
    console.log('');
  });
}

async function main() {
  try {
    console.log('🚀 Starting MongoDB Schema Analysis...\n');
    
    // Connect to database using existing function
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Analyze all collections
    const collections = [
      { model: UserProfile, name: 'UserProfile' },
      { model: Attendance, name: 'Attendance' },
      { model: Leave, name: 'Leave' },
      { model: Team, name: 'Team' },
      { model: Notification, name: 'Notification' },
      { model: SystemSettings, name: 'SystemSettings' },
      { model: VoiceCommand, name: 'VoiceCommand' },
      { model: Job, name: 'Job' },
      { model: Application, name: 'Application' },
      { model: Lead, name: 'Lead' }
    ];

    const analysisResults: SchemaAnalysis[] = [];
    
    for (const collection of collections) {
      const result = await analyzeCollection(collection.model, collection.name);
      analysisResults.push(result);
    }

    // Generate comprehensive report
    console.log('\n📋 COMPREHENSIVE SCHEMA ANALYSIS REPORT');
    console.log('=' .repeat(60));
    
    analysisResults.forEach(result => {
      console.log(`\n📁 Collection: ${result.collectionName}`);
      console.log(`   Total Documents: ${result.totalDocuments}`);
      
      if (result.totalDocuments > 0) {
        console.log(`   Fields: ${Object.keys(result.fieldAnalysis).length}`);
        console.log(`   Recommendations: ${result.recommendations.length}`);
        
        if (result.recommendations.length > 0) {
          console.log('   Key Issues:');
          result.recommendations.slice(0, 3).forEach(rec => {
            console.log(`     • ${rec}`);
          });
        }
      }
    });

    // Generate insights and improvement plan
    await generateAnalyticsInsights();
    await generateSchemaImprovementPlan();

    console.log('\n✅ Schema analysis completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during schema analysis:', error);
  } finally {
    process.exit(0);
  }
}

// Run the analysis
main().catch(console.error);
