// Centralized parameter requirements for all intents
// This is the single source of truth for what parameters each intent needs

export interface ParameterRequirement {
  name: string;
  type: 'string' | 'date' | 'number' | 'boolean' | 'enum';
  required: boolean;
  description: string;
  examples?: string[];
  enumValues?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => { valid: boolean; error?: string };
  };
}

/**
 * Intent categories based on their operational nature
 * - query: Read-only operations, viewing/retrieving data (no state changes)
 * - mutation: Create new records/requests (POST operations)
 * - action: Modify/update existing records (PUT/PATCH operations)
 * - tracking: Time-based state changes (clock in/out operations)
 */
export type IntentCategory = 'query' | 'mutation' | 'action' | 'tracking';

export interface IntentParameterConfig {
  intent: string;
  description: string;
  category: IntentCategory;
  parameters: ParameterRequirement[];
  workflow: string;
  metadata?: {
    requiresLocationPermission?: boolean;
    requiresUserContext?: boolean;
    requiresTeamContext?: boolean;
    confirmationTemplate?: string;
    successMessage?: string;
  };
}

// Centralized parameter requirements configuration
export const PARAMETER_REQUIREMENTS: Record<string, IntentParameterConfig> = {
  'apply_leave': {
    intent: 'apply_leave',
    description: 'Apply for leave request',
    category: 'mutation',
    workflow: 'leave',
    parameters: [
      {
        name: 'leaveType',
        type: 'enum',
        required: true,
        description: 'Type of leave (annual, sick, personal, etc.)',
        examples: ['annual', 'sick', 'personal', 'maternity', 'paternity'],
        enumValues: ['annual', 'sick', 'personal', 'maternity', 'paternity', 'emergency']
      },
      {
        name: 'startDate',
        type: 'date',
        required: true,
        description: 'Start date of leave',
        examples: ['2024-01-22', 'next Monday', 'tomorrow']
      },
      {
        name: 'endDate',
        type: 'date',
        required: true,
        description: 'End date of leave',
        examples: ['2024-01-24', 'Wednesday', 'next Friday']
      },
      {
        name: 'reason',
        type: 'string',
        required: true,
        description: 'Reason for leave (minimum 10 characters)',
        examples: ['I have a doctor appointment', 'Family emergency - need to travel', 'Feeling unwell with flu symptoms'],
        validation: {
          minLength: 10
        }
      }
    ],
    metadata: {
      successMessage: 'Your leave request has been submitted for {{leaveType}} from {{startDate}} to {{endDate}}.'
    }
  },

  'clock_in': {
    intent: 'clock_in',
    description: 'Clock in for work',
    category: 'tracking',
    workflow: 'attendance',
    parameters: [
      // No parameters needed - timestamp defaults to now, location handled separately
    ],
    metadata: {
      requiresLocationPermission: true,
      successMessage: "You've been clocked in successfully. Have a great day!"
    }
  },

  'clock_out': {
    intent: 'clock_out',
    description: 'Clock out from work',
    category: 'tracking',
    workflow: 'attendance',
    parameters: [
      // No parameters needed - timestamp defaults to now, location handled separately
    ],
    metadata: {
      requiresLocationPermission: true,
      successMessage: "You've been clocked out successfully. Have a great evening!"
    }
  },

  'view_attendance_history': {
    intent: 'view_attendance_history',
    description: 'View attendance records',
    category: 'query',
    workflow: 'attendance',
    parameters: [
      {
        name: 'dateRange',
        type: 'string',
        required: true,
        description: 'Date range for attendance records',
        examples: ['month']
      }
    ],
    metadata: {
      requiresUserContext: true,
      successMessage: "Here's your attendance history for the requested period."
    }
  },

  'get_leave_balance': {
    intent: 'get_leave_balance',
    description: 'Check leave balance',
    category: 'query',
    workflow: 'leave',
    parameters: [
      {
        name: 'leaveType',
        type: 'enum',
        required: false,
        description: 'Specific leave type to check balance for',
        examples: ['annual', 'sick'],
        enumValues: ['annual', 'sick', 'personal', 'maternity', 'paternity']
      },
      {
        name: 'dateRange',
        type: 'enum',
        required: false,
        description: 'Date range view (today, month, or specific month name)',
        examples: ['today', 'month', 'September'],
        enumValues: ['today', 'month', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      }
    ],
    metadata: {
      requiresUserContext: true,
      successMessage: "Here's your current leave balance."
    }
  },

  'view_team_attendance': {
    intent: 'view_team_attendance',
    description: 'View team attendance records',
    category: 'query',
    workflow: 'team',
    parameters: [
      {
        name: 'dateRange',
        type: 'enum',
        required: true,
        description: 'Date range for team attendance (today or month)',
        examples: ['today', 'month'],
        enumValues: ['today', 'month']
      }
    ],
    metadata: {
      requiresTeamContext: true,
      successMessage: "Here's your team's attendance for the requested period."
    }
  },

  'view_team_leaves': {
    intent: 'view_team_leaves',
    description: 'View team leave requests',
    category: 'query',
    workflow: 'team',
    parameters: [
    ],
    metadata: {
      requiresTeamContext: true,
      successMessage: "Here are your team's leave requests for the requested period."
    }
  },

  'approve_leave': {
    intent: 'approve_leave',
    description: 'Approve or reject leave request',
    category: 'action',
    workflow: 'leave',
    parameters: [
      {
        name: 'forWhom',
        type: 'string',
        required: true,
        description: 'Employee name or ID for the leave request',
        examples: ['John Doe', 'EMP001', 'john.doe@company.com']
      },
      {
        name: 'approvalStatus',
        type: 'enum',
        required: true,
        description: 'Approval decision',
        examples: ['approved', 'rejected'],
        enumValues: ['approved', 'rejected']
      }
    ],
    metadata: {
      successMessage: 'Leave request {{approvalStatus}} for {{forWhom}}.'
    }
  }
};

// Helper functions for parameter requirements
export function getRequiredParameters(intent: string): string[] {
  const config = PARAMETER_REQUIREMENTS[intent];
  if (!config) return [];
  
  return config.parameters
    .filter(param => param.required)
    .map(param => param.name);
}

export function getAllParameters(intent: string): string[] {
  const config = PARAMETER_REQUIREMENTS[intent];
  if (!config) return [];
  
  return config.parameters.map(param => param.name);
}

export function getParameterConfig(intent: string, parameterName: string): ParameterRequirement | undefined {
  const config = PARAMETER_REQUIREMENTS[intent];
  if (!config) return undefined;

  return config.parameters.find(param => param.name === parameterName);
}

export function getParameterEnumValues(intent: string, parameterName: string): string[] | undefined {
  const paramConfig = getParameterConfig(intent, parameterName);
  return paramConfig?.enumValues;
}

export function getWorkflowForIntent(intent: string): string {
  const config = PARAMETER_REQUIREMENTS[intent];
  return config?.workflow || 'unknown';
}

export function getIntentDescription(intent: string): string {
  const config = PARAMETER_REQUIREMENTS[intent];
  return config?.description || 'Unknown intent';
}

export function getIntentMetadata(intent: string): IntentParameterConfig['metadata'] | undefined {
  const config = PARAMETER_REQUIREMENTS[intent];
  return config?.metadata;
}

export function getSuccessMessage(intent: string, data: Record<string, any>): string | undefined {
  const metadata = getIntentMetadata(intent);
  if (!metadata?.successMessage) return undefined;
  
  // Replace template variables {{paramName}} with actual values
  let message = metadata.successMessage;
  Object.keys(data).forEach(key => {
    message = message.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), data[key]);
  });
  
  return message;
}

export function requiresLocationPermission(intent: string): boolean {
  return getIntentMetadata(intent)?.requiresLocationPermission ?? false;
}

export function requiresUserContext(intent: string): boolean {
  return getIntentMetadata(intent)?.requiresUserContext ?? false;
}

export function requiresTeamContext(intent: string): boolean {
  return getIntentMetadata(intent)?.requiresTeamContext ?? false;
}

/**
 * Validate parameter value against its configuration
 */
export function validateParameter(
  intent: string,
  paramName: string,
  value: any
): { valid: boolean; error?: string } {
  const paramConfig = getParameterConfig(intent, paramName);
  
  if (!paramConfig) {
    return { valid: true }; // No config = no validation
  }
  
  // Check if value exists (for required parameters)
  if (paramConfig.required && (value === undefined || value === null || value === '')) {
    return { valid: false, error: `${paramName} is required` };
  }
  
  // Skip validation if value is empty and not required
  if (!value && !paramConfig.required) {
    return { valid: true };
  }
  
  // Validate based on type and validation rules
  if (paramConfig.validation) {
    const validation = paramConfig.validation;
    
    // Min length validation
    if (validation.minLength !== undefined && typeof value === 'string') {
      if (value.length < validation.minLength) {
        return {
          valid: false,
          error: `${paramName} must be at least ${validation.minLength} characters long`
        };
      }
    }
    
    // Max length validation
    if (validation.maxLength !== undefined && typeof value === 'string') {
      if (value.length > validation.maxLength) {
        return {
          valid: false,
          error: `${paramName} must be at most ${validation.maxLength} characters long`
        };
      }
    }
    
    // Pattern validation
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return {
          valid: false,
          error: `${paramName} format is invalid`
        };
      }
    }
    
    // Custom validation
    if (validation.custom) {
      return validation.custom(value);
    }
  }
  
  return { valid: true };
}

/**
 * Validate all parameters for an intent
 */
export function validateAllParameters(
  intent: string,
  data: Record<string, any>
): { valid: boolean; errors: Record<string, string> } {
  const config = PARAMETER_REQUIREMENTS[intent];
  if (!config) {
    return { valid: true, errors: {} };
  }
  
  const errors: Record<string, string> = {};
  
  for (const param of config.parameters) {
    const validation = validateParameter(intent, param.name, data[param.name]);
    if (!validation.valid && validation.error) {
      errors[param.name] = validation.error;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// Category-related helper functions

/**
 * Get the category of an intent
 */
export function getIntentCategory(intent: string): IntentCategory | undefined {
  const config = PARAMETER_REQUIREMENTS[intent];
  return config?.category;
}

/**
 * Get all intents in a specific category
 */
export function getIntentsByCategory(category: IntentCategory): string[] {
  return Object.values(PARAMETER_REQUIREMENTS)
    .filter(config => config.category === category)
    .map(config => config.intent);
}

/**
 * Check if an intent belongs to a specific category
 */
export function isIntentInCategory(intent: string, category: IntentCategory): boolean {
  return getIntentCategory(intent) === category;
}

/**
 * Check if an intent is a query (read-only) operation
 */
export function isQueryIntent(intent: string): boolean {
  return getIntentCategory(intent) === 'query';
}

/**
 * Check if an intent is a mutation (create) operation
 */
export function isMutationIntent(intent: string): boolean {
  return getIntentCategory(intent) === 'mutation';
}

/**
 * Check if an intent is a tracking (time-based) operation
 */
export function isTrackingIntent(intent: string): boolean {
  return getIntentCategory(intent) === 'tracking';
}

/**
 * Check if an intent is an action (modify) operation
 */
export function isActionIntent(intent: string): boolean {
  return getIntentCategory(intent) === 'action';
}

/**
 * Check if an intent modifies state (mutation, action, or tracking)
 */
export function modifiesState(intent: string): boolean {
  const category = getIntentCategory(intent);
  return category !== 'query';
}

/**
 * Check if an intent is read-only (does not modify state)
 */
export function isReadOnly(intent: string): boolean {
  return getIntentCategory(intent) === 'query';
}
