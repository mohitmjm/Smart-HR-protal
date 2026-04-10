export interface VoiceRecordingOptions {
  audioBitsPerSecond?: number;
  mimeType?: string;
  sampleRate?: number;
}

export interface VoiceRecordingResult {
  audioBlob: Blob;
  duration: number;
  format: string;
  size: number;
}

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  
  async startRecording(options: VoiceRecordingOptions = {}): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: options.sampleRate || 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: options.mimeType || 'audio/webm;codecs=opus',
        audioBitsPerSecond: options.audioBitsPerSecond || 128000
      });
      
      this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      
      this.startTime = Date.now();
      this.mediaRecorder.start();
    } catch (error) {
      throw new Error(`Failed to start recording: ${error}`);
    }
  }
  
  stopRecording(): Promise<VoiceRecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType });
        const duration = Date.now() - this.startTime;
        
        const result: VoiceRecordingResult = {
          audioBlob,
          duration,
          format: this.mediaRecorder?.mimeType || 'audio/webm',
          size: audioBlob.size
        };
        
        this.cleanup();
        resolve(result);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
  
  getRecordingState(): string {
    return this.mediaRecorder?.state || 'inactive';
  }
  
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }
  
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }
  
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.startTime = 0;
  }
  
  // Utility method to check browser compatibility
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && 
              typeof MediaRecorder !== 'undefined');
  }
  
  // Get supported MIME types for the current browser
  static getSupportedMimeTypes(): string[] {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav'
    ];
    
    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }
  
  // Get default MIME type for the current browser
  static getDefaultMimeType(): string {
    const supportedTypes = this.getSupportedMimeTypes();
    return supportedTypes[0] || 'audio/webm';
  }
}
