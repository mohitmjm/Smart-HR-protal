import sgMail from '@sendgrid/mail';

/**
 * Simple SendGrid-backed email service.
 * - Initializes lazily from environment variables
 * - Provides basic send and template send helpers
 * - Fails safe (logs and returns) if not configured
 */
class EmailService {
  private isInitialized: boolean = false;
  private fromEmail: string | undefined;

  private initializeIfNeeded(): void {
    if (this.isInitialized) return;
    const apiKey = process.env.SENDGRID_API_KEY;
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (apiKey) {
      try {
        sgMail.setApiKey(apiKey);
        this.isInitialized = true;
        // eslint-disable-next-line no-console
        console.log('[EmailService] SendGrid initialized. From:', this.fromEmail || '(not set)');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize SendGrid:', error);
        this.isInitialized = false;
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('[EmailService] SENDGRID_API_KEY missing. Email disabled.');
    }
  }

  /** Indicates whether SendGrid is configured */
  public isConfigured(): boolean {
    this.initializeIfNeeded();
    return this.isInitialized && !!this.fromEmail;
  }

  /** Send a basic email */
  public async sendEmail(params: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    replyTo?: string;
  }): Promise<{ success: boolean; error?: unknown }> {
    this.initializeIfNeeded();
    if (!this.isConfigured()) {
      // eslint-disable-next-line no-console
      console.warn('[EmailService] Not configured. Skipping email send. fromEmail:', this.fromEmail || '(not set)');
      return { success: false, error: new Error('SendGrid not configured') };
    }

    const fromAddress = params.from || this.fromEmail!;

    try {
      const baseMsg: any = {
        to: params.to as any,
        from: fromAddress,
        subject: params.subject,
      };
      if (params.text) baseMsg.text = params.text;
      if (params.html) baseMsg.html = params.html;
      if (params.replyTo) baseMsg.replyTo = params.replyTo;

      // eslint-disable-next-line no-console
      console.log('[EmailService] Sending email', { to: params.to, subject: params.subject, replyTo: baseMsg.replyTo ? 'set' : 'unset' });
      await sgMail.send(baseMsg);
      // eslint-disable-next-line no-console
      console.log('[EmailService] Email sent successfully');
      return { success: true };
    } catch (error: any) {
      // Basic retry on rate limiting
      if (error?.code === 429) {
        await new Promise(r => setTimeout(r, 1000));
        try {
          const retryMsg: any = {
            to: params.to as any,
            from: fromAddress,
            subject: params.subject,
          };
          if (params.text) retryMsg.text = params.text;
          if (params.html) retryMsg.html = params.html;
          if (params.replyTo) retryMsg.replyTo = params.replyTo;
          // eslint-disable-next-line no-console
          console.log('[EmailService] Retrying email send after 429...', { to: params.to, subject: params.subject });
          await sgMail.send(retryMsg);
          // eslint-disable-next-line no-console
          console.log('[EmailService] Email sent successfully after retry');
          return { success: true };
        } catch (retryError) {
          // eslint-disable-next-line no-console
          console.error('SendGrid send retry failed:', retryError);
          return { success: false, error: retryError };
        }
      }
      // eslint-disable-next-line no-console
      console.error('SendGrid send failed:', error);
      return { success: false, error };
    }
  }

  /** Send using a dynamic template (Marketing/Transactional) */
  public async sendTemplate(params: {
    to: string | string[];
    templateId: string;
    dynamicTemplateData?: Record<string, unknown>;
    from?: string;
    subject?: string; // optional; template can define subject
  }): Promise<{ success: boolean; error?: unknown }> {
    this.initializeIfNeeded();
    if (!this.isConfigured()) {
      // eslint-disable-next-line no-console
      console.warn('SendGrid not configured. Skipping template email send.');
      return { success: false, error: new Error('SendGrid not configured') };
    }

    const fromAddress = params.from || this.fromEmail!;

    try {
      await sgMail.send({
        to: params.to as any,
        from: fromAddress,
        templateId: params.templateId,
        dynamicTemplateData: params.dynamicTemplateData,
        subject: params.subject,
      } as any);
      return { success: true };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('SendGrid template send failed:', error);
      return { success: false, error };
    }
  }
}

export const emailService = new EmailService();

export default emailService;


