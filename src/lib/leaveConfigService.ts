import SystemSettings from '@/models/SystemSettings';

export class LeaveConfigService {
  static async getDefaultAllocations() {
    const settings = await SystemSettings.findOne();
    if (settings?.leaveDefaults) {
      // Convert Map to object if it's a Map, otherwise return as is
      return settings.leaveDefaults instanceof Map 
        ? Object.fromEntries(settings.leaveDefaults) 
        : settings.leaveDefaults;
    }
    
    // Return default values if no settings found
    return {
      sick: 0,
      casual: 0,
      annual: 0,
      maternity: 0,
      paternity: 0
    };
  }
}
