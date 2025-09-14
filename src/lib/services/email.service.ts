import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: options.from || process.env.SMTP_FROM || 'noreply@icct.edu.ph',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test SMTP connection
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }

  // Password reset email template
  async sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
    const template: EmailTemplate = {
      subject: 'Password Reset Request - ICCT Smart Attendance System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>ICCT Smart Attendance System</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f8fafc;">
            <h2>Password Reset Request</h2>
            <p>Hello ${userName},</p>
            
            <p>We received a request to reset your password for your ICCT Smart Attendance System account.</p>
            
            <p>If you didn't make this request, you can safely ignore this email.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If the button doesn't work, copy and paste this URL into your browser: ${resetUrl}</li>
              <li>This link can only be used once</li>
            </ul>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>Best regards,<br>ICCT Administration Team</p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            <p>This email was sent from the ICCT Smart Attendance System.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
        </div>
      `,
      text: `
        Password Reset Request - ICCT Smart Attendance System
        
        Hello ${userName},
        
        We received a request to reset your password for your ICCT Smart Attendance System account.
        
        If you didn't make this request, you can safely ignore this email.
        
        To reset your password, click the following link:
        ${resetUrl}
        
        Important:
        - This link will expire in 1 hour
        - This link can only be used once
        
        If you have any questions, please contact our support team.
        
        Best regards,
        ICCT Administration Team
      `
    };

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    } catch (error) {
      console.error('Password reset email failed:', error);
      return false;
    }
  }

  // Attendance notification email template
  async sendAttendanceNotificationEmail(
    email: string, 
    studentName: string, 
    guardianName: string,
    notificationType: 'absence' | 'tardiness' | 'improvement' | 'concern',
    details: any
  ): Promise<boolean> {
    const getSubject = () => {
      switch (notificationType) {
        case 'absence': return 'Student Absence Notification';
        case 'tardiness': return 'Student Tardiness Notification';
        case 'improvement': return 'Student Attendance Improvement';
        case 'concern': return 'Student Attendance Concern';
        default: return 'Student Attendance Notification';
      }
    };

    const getMessage = () => {
      switch (notificationType) {
        case 'absence':
          return `Your child ${studentName} was absent on ${details.date} during ${details.subject} class.`;
        case 'tardiness':
          return `Your child ${studentName} was late on ${details.date} during ${details.subject} class.`;
        case 'improvement':
          return `Great news! Your child ${studentName}'s attendance has improved.`;
        case 'concern':
          return `We have concerns about ${studentName}'s attendance pattern.`;
        default:
          return `This is a notification regarding ${studentName}'s attendance.`;
      }
    };

    const template: EmailTemplate = {
      subject: getSubject(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>ICCT Smart Attendance System</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f8fafc;">
            <h2>${getSubject()}</h2>
            <p>Dear ${guardianName},</p>
            
            <p>${getMessage()}</p>
            
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Details:</h3>
              <p><strong>Student:</strong> ${studentName}</p>
              <p><strong>Date:</strong> ${details.date}</p>
              <p><strong>Subject:</strong> ${details.subject}</p>
              <p><strong>Time:</strong> ${details.time}</p>
            </div>
            
            <p>If you have any questions or concerns, please contact the school administration.</p>
            
            <p>Best regards,<br>ICCT Administration Team</p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            <p>This is an automated notification from the ICCT Smart Attendance System.</p>
          </div>
        </div>
      `,
      text: `
        ${getSubject()}
        
        Dear ${guardianName},
        
        ${getMessage()}
        
        Details:
        - Student: ${studentName}
        - Date: ${details.date}
        - Subject: ${details.subject}
        - Time: ${details.time}
        
        If you have any questions or concerns, please contact the school administration.
        
        Best regards,
        ICCT Administration Team
      `
    };

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // General notification email template
  async sendGeneralNotificationEmail(
    email: string,
    subject: string,
    message: string,
    userName: string
  ): Promise<boolean> {
    const template: EmailTemplate = {
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>ICCT Smart Attendance System</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f8fafc;">
            <h2>${subject}</h2>
            <p>Hello ${userName},</p>
            
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <p>Best regards,<br>ICCT Administration Team</p>
          </div>
          
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            <p>This is an automated notification from the ICCT Smart Attendance System.</p>
          </div>
        </div>
      `,
      text: `
        ${subject}
        
        Hello ${userName},
        
        ${message}
        
        Best regards,
        ICCT Administration Team
      `
    };

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService(); 