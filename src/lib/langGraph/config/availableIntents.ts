// Central configuration for available intents in the voice command system
// This file now derives from parameterRequirements.ts as the single source of truth

import { PARAMETER_REQUIREMENTS, getAllParameters, getIntentDescription as getParamIntentDescription, getParameterEnumValues } from './parameterRequirements';

export interface IntentDefinition {
  name: string;
  description: string;
  parameters: string[];
}

// Generate AVAILABLE_INTENTS from PARAMETER_REQUIREMENTS (single source of truth)
export const AVAILABLE_INTENTS: Record<string, IntentDefinition> = Object.entries(PARAMETER_REQUIREMENTS).reduce(
  (acc, [key, config]) => {
    acc[key] = {
      name: config.intent,
      description: config.description,
      parameters: getAllParameters(config.intent)
    };
    return acc;
  },
  {} as Record<string, IntentDefinition>
);

export function getAvailableIntentsList(): string[] {
  return Object.keys(AVAILABLE_INTENTS);
}

export function getIntentDescription(intent: string): string {
  return getParamIntentDescription(intent);
}

export function getIntentParameters(intent: string): string[] {
  return getAllParameters(intent);
}

export function formatIntentsForPrompt(): string {
  return Object.values(AVAILABLE_INTENTS)
    .map(intent => `- ${intent.name}: ${intent.description} (parameters: ${intent.parameters.join(', ')})`)
    .join('\n');
}

export function formatDetailedIntentsForPrompt(): string {
  const intentDetails: string[] = [];

  for (const intent of Object.values(AVAILABLE_INTENTS)) {
    let detail = `- ${intent.name}: ${intent.description}`;

    // Add parameter details with enum values
    const paramDetails: string[] = [];
    for (const paramName of intent.parameters) {
      const enumValues = getParameterEnumValues(intent.name, paramName);
      if (enumValues && enumValues.length > 0) {
        paramDetails.push(`${paramName} (${enumValues.join(', ')})`);
      } else {
        paramDetails.push(paramName);
      }
    }

    if (paramDetails.length > 0) {
      detail += ` (parameters: ${paramDetails.join(', ')})`;
    }

    intentDetails.push(detail);
  }

  return intentDetails.join('\n');
}
