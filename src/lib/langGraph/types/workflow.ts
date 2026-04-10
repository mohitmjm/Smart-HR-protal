// Workflow type definitions aligned with docs/agent_workflow.md

import type { Serializable } from "./state";

export type ConditionFn<Input = Record<string, unknown>> = (
  data: Input
) => boolean | Promise<boolean>;

export type ActionFn<Input = Record<string, unknown>, Output = unknown> = (
  data: Input,
  context?: Record<string, Serializable>
) => Promise<Output>;

export interface WorkflowStepDef<Input = Record<string, unknown>, Output = unknown> {
  id: string;
  action: string; // symbolic action name, resolved elsewhere
  condition?: string; // symbolic condition name, resolved elsewhere
  next?: string; // id of next step or 'complete'
}

export interface WorkflowDefinition<Input = Record<string, unknown>> {
  name: string;
  steps: WorkflowStepDef<Input>[];
  conditions?: Record<string, ConditionFn<Input>>;
}

export interface ExecutionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type DomainWorkflowName =
  | "navigation"
  | "attendance"
  | "leave"
  | "team"
  | "profile"
  | "clarification";


