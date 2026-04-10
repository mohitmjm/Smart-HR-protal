// View Team Leaves Action: Handles navigation to team leaves page

import { logger } from "../../utils/logger";

export interface ViewTeamLeavesParams {
  userId: string;
}

export interface ViewTeamLeavesResult {
  success: boolean;
  message: string;
  data?: {
    destination: string;
  };
  error?: string;
}

/**
 * Execute view team leaves action by navigating to leaves page with team tab selected
 */
export async function executeViewTeamLeaves(params: ViewTeamLeavesParams): Promise<ViewTeamLeavesResult> {
  try {
    logger.info('Executing view team leaves navigation', { userId: params.userId });

    // Construct navigation URL to leaves page with team tab
    const destination = '/portal/leaves?tab=team';

    logger.info('Navigate to team leaves page', { userId: params.userId }, {
      destination
    });

    return {
      success: true,
      message: "Showing your team's leave requests",
      data: {
        destination
      }
    };

  } catch (error) {
    logger.error('View team leaves error', { userId: params.userId }, error as Error);
    
    return {
      success: false,
      message: 'Failed to navigate to team leaves. Please try again.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    };
  }
}

export default executeViewTeamLeaves;

