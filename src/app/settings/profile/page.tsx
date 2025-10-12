"use client";

import { useState, useEffect } from "react";
import { PageSkeleton } from "@/components/reusable/Skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Settings,
  Key,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Save,
  Edit,
  Camera,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  LogOut,
  RefreshCw
} from "lucide-react";
import PageHeader from '@/components/PageHeader/PageHeader';
import SummaryCard from '@/components/SummaryCard';
import { QuickActionsPanel } from '@/components/reusable/QuickActionsPanel';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

interface UserProfile {
  userId: number;
  userName: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  preferences: {
    notifications: boolean;
    emailAlerts: boolean;
    language: string;
    timezone: string;
    emailFrequency: string;
    dashboardLayout: string;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
    failedLoginAttempts: number;
    isEmailVerified: boolean;
  };
  activity: {
    totalLogins: number;
    lastActivity: string;
    sessionsCount: number;
  };
}

export default function ProfilePage() {
  const { user, loading, loadUser } = useUser();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      toast.error("Please log in to view your profile");
      router.push('/login');
      return;
    }
    
    // Handle URL parameters for edit mode and tab switching
    const urlParams = new URLSearchParams(window.location.search);
    const editParam = urlParams.get('edit');
    const tabParam = urlParams.get('tab');
    
    if (editParam === 'true') {
      setIsEditing(true);
    }
    
    if (tabParam && ['personal', 'security', 'preferences', 'activity'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    fetchUserProfile();
  }, [loading, user, router]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/profile', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setProfile(data.data);
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      toast.error('Failed to load profile data. Please try again.');
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setProfile(result.data);
      setIsEditing(false);
      
      // Refresh user data to update the global user context
      await loadUser();
      
      toast.success('Profile updated successfully');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      toast.success('Password changed successfully');
      
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(`Failed to change password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Try to parse JSON error; fall back to text for better diagnostics
        let errorDetail: any = {};
        try {
          errorDetail = await response.json();
        } catch {
          try {
            const text = await response.text();
            errorDetail = { error: text };
          } catch {
            errorDetail = {};
          }
        }
        console.error('Avatar upload error:', errorDetail);
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        if (response.status === 400) {
          const msg = errorDetail?.error || 'Invalid image. Ensure it is an image and <= 5MB.';
          throw new Error(msg);
        }
        throw new Error(errorDetail?.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update the profile with new avatar URL
      if (result.data?.avatarUrl && profile) {
        // Add cache-buster so the new image shows immediately
        const withBuster = `${result.data.avatarUrl}?v=${Date.now()}`;
        setProfile(prev => prev ? { ...prev, avatar: withBuster } : null);
      }
      
      toast.success('Avatar updated successfully');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(`Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportData = async () => {
    try {
      toast.info('Preparing your data export...');
      
      const response = await fetch('/api/profile/export', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `profile-data-${new Date().toISOString().split('T')[0]}.json`;
      
      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export data');
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      if (enabled) {
        // Enable 2FA - show setup dialog
        toast.info('Setting up 2FA...');
        
        const response = await fetch('/api/profile/2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: true }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Show QR code in a proper modal
        const qrCodeUrl = result.data.qrCodeUrl;
        const manualKey = result.data.manualEntryKey;
        
        // Create a modal dialog with QR code
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.3s ease-out;
        `;
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .modal-content {
            animation: slideIn 0.3s ease-out;
          }
          .qr-code-container {
            position: relative;
            display: inline-block;
            padding: 1rem;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border: 2px solid #e5e7eb;
          }
          .copy-btn {
            position: absolute;
            top: 0.5rem;
            right: 0.5rem;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
          }
          .copy-btn:hover {
            background: #e5e7eb;
            border-color: #9ca3af;
          }
          .copy-btn.copied {
            background: #10b981;
            color: white;
            border-color: #059669;
          }
          .manual-key-container {
            position: relative;
            margin-top: 1rem;
          }
          .key-input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            background: #f9fafb;
            text-align: center;
            letter-spacing: 0.05em;
            user-select: all;
          }
          .step-indicator {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
          }
          .step {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #d1d5db;
            margin: 0 4px;
          }
          .step.active {
            background: #3b82f6;
          }
          .step.completed {
            background: #10b981;
          }
        `;
        document.head.appendChild(style);
        
        modal.innerHTML = `
          <div class="modal-content" style="
            background: white;
            padding: 2rem;
            border-radius: 16px;
            max-width: 480px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid #e5e7eb;
          ">
            <div class="step-indicator">
              <div class="step active"></div>
              <div class="step"></div>
              <div class="step"></div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
              <h3 style="margin-bottom: 0.5rem; color: #111827; font-size: 1.5rem; font-weight: 600;">🔐 Two-Factor Authentication</h3>
              <p style="color: #6b7280; font-size: 0.95rem; line-height: 1.5;">
                Add an extra layer of security to your account
              </p>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
              <h4 style="margin-bottom: 1rem; color: #374151; font-size: 1.1rem; font-weight: 500;">
                📱 Scan QR Code
              </h4>
              <p style="margin-bottom: 1rem; color: #6b7280; font-size: 0.9rem;">
                Open your authenticator app and scan this QR code:
              </p>
              <div class="qr-code-container">
                <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px; display: block;" />
              </div>
            </div>
            
            <div class="manual-key-container">
              <h4 style="margin-bottom: 0.75rem; color: #374151; font-size: 1.1rem; font-weight: 500;">
                ⌨️ Manual Entry
              </h4>
              <p style="margin-bottom: 0.75rem; color: #6b7280; font-size: 0.9rem;">
                Can't scan? Enter this key manually:
              </p>
              <div style="position: relative;">
                <input 
                  type="text" 
                  value="${manualKey}" 
                  readonly 
                  class="key-input"
                  id="manual-key-input"
                />
                <button 
                  class="copy-btn" 
                  id="copy-key-btn"
                  onclick="navigator.clipboard.writeText('${manualKey}').then(() => {
                    const btn = document.getElementById('copy-key-btn');
                    btn.textContent = 'Copied!';
                    btn.classList.add('copied');
                    setTimeout(() => {
                      btn.textContent = 'Copy';
                      btn.classList.remove('copied');
                    }, 2000);
                  })"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div style="margin-top: 2rem; display: flex; gap: 0.75rem; justify-content: center;">
              <button id="verify-2fa" style="
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 0.95rem;
                transition: all 0.2s;
                box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
                min-width: 120px;
              " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px -1px rgba(59, 130, 246, 0.4)'" 
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(59, 130, 246, 0.3)'">
                ✅ I've set it up
              </button>
              <button id="cancel-2fa" style="
                background: #f3f4f6;
                color: #374151;
                border: 1px solid #d1d5db;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                font-size: 0.95rem;
                transition: all 0.2s;
                min-width: 120px;
              " onmouseover="this.style.background='#e5e7eb'" 
                 onmouseout="this.style.background='#f3f4f6'">
                ❌ Cancel
              </button>
            </div>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af; font-size: 0.875rem; line-height: 1.4;">
                💡 <strong>Tip:</strong> Popular authenticator apps include Google Authenticator, Authy, Microsoft Authenticator, and 1Password.
              </p>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle button clicks
        const verifyBtn = modal.querySelector('#verify-2fa');
        const cancelBtn = modal.querySelector('#cancel-2fa');
        
        const cleanup = () => {
          if (document.body.contains(modal)) {
            document.body.removeChild(modal);
          }
        };
        
        if (verifyBtn) {
          verifyBtn.addEventListener('click', async () => {
            // Update step indicator
            const steps = modal.querySelectorAll('.step');
            if (steps[0]) steps[0].classList.remove('active');
            if (steps[0]) steps[0].classList.add('completed');
            if (steps[1]) steps[1].classList.add('active');
            
            // Show verification step
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
              modalContent.innerHTML = `
                <div class="modal-content" style="
                  background: white;
                  padding: 2rem;
                  border-radius: 16px;
                  max-width: 480px;
                  width: 90%;
                  text-align: center;
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                  border: 1px solid #e5e7eb;
                ">
                  <div class="step-indicator">
                    <div class="step completed"></div>
                    <div class="step active"></div>
                    <div class="step"></div>
                  </div>
                  
                  <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 0.5rem; color: #111827; font-size: 1.5rem; font-weight: 600;">🔢 Verify Setup</h3>
                    <p style="color: #6b7280; font-size: 0.95rem; line-height: 1.5;">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                  
                  <div style="margin-bottom: 2rem;">
                    <input 
                      type="text" 
                      id="verification-code"
                      placeholder="000000"
                      maxlength="6"
                      style="
                        width: 200px;
                        padding: 1rem;
                        border: 2px solid #d1d5db;
                        border-radius: 12px;
                        font-size: 1.5rem;
                        text-align: center;
                        letter-spacing: 0.5rem;
                        font-family: 'Courier New', monospace;
                        font-weight: 600;
                        background: #f9fafb;
                        transition: all 0.2s;
                      "
                      onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'"
                      onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'"
                      oninput="this.value = this.value.replace(/[^0-9]/g, ''); const errorDiv = document.getElementById('verification-error'); if(errorDiv) errorDiv.style.display = 'none';"
                    />
                    <div id="verification-error" style="
                      margin-top: 0.75rem;
                      padding: 0.5rem;
                      background: #fef2f2;
                      border: 1px solid #fecaca;
                      border-radius: 6px;
                      color: #dc2626;
                      font-size: 0.875rem;
                      display: none;
                      animation: slideDown 0.3s ease-out;
                    ">
                      <span style="font-weight: 500;">⚠️</span> <span id="error-text"></span>
                    </div>
                    <p style="margin-top: 0.75rem; color: #6b7280; font-size: 0.875rem;">
                      The code changes every 30 seconds
                    </p>
                  </div>
                  
                  <div style="display: flex; gap: 0.75rem; justify-content: center;">
                    <button id="verify-code-btn" style="
                      background: linear-gradient(135deg, #10b981, #059669);
                      color: white;
                      border: none;
                      padding: 0.75rem 1.5rem;
                      border-radius: 8px;
                      cursor: pointer;
                      font-weight: 500;
                      font-size: 0.95rem;
                      transition: all 0.2s;
                      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
                      min-width: 120px;
                    " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px -1px rgba(16, 185, 129, 0.4)'" 
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(16, 185, 129, 0.3)'">
                      ✅ Verify Code
                    </button>
                    <button id="back-to-setup" style="
                      background: #f3f4f6;
                      color: #374151;
                      border: 1px solid #d1d5db;
                      padding: 0.75rem 1.5rem;
                      border-radius: 8px;
                      cursor: pointer;
                      font-weight: 500;
                      font-size: 0.95rem;
                      transition: all 0.2s;
                      min-width: 120px;
                    " onmouseover="this.style.background='#e5e7eb'" 
                       onmouseout="this.style.background='#f3f4f6'">
                      ← Back
                    </button>
                  </div>
                  
                  <div style="margin-top: 1.5rem; padding: 1rem; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 0.875rem; line-height: 1.4;">
                      ⚠️ <strong>Important:</strong> Make sure your device's time is synchronized for the code to work correctly.
                    </p>
                  </div>
                </div>
              `;
              
              // Handle verification
              const verifyCodeBtn = modal.querySelector('#verify-code-btn');
              const backBtn = modal.querySelector('#back-to-setup');
              const codeInput = modal.querySelector('#verification-code');
              
              if (verifyCodeBtn) {
                verifyCodeBtn.addEventListener('click', async () => {
                  const code = (codeInput as HTMLInputElement)?.value;
                  const errorDiv = modal.querySelector('#verification-error') as HTMLElement;
                  const errorText = modal.querySelector('#error-text') as HTMLElement;
                  
                  // Hide any previous errors
                  if (errorDiv) {
                    errorDiv.style.display = 'none';
                  }
                  
                  if (code && code.length === 6) {
                    // Show loading state
                    const originalText = verifyCodeBtn.textContent;
                    verifyCodeBtn.textContent = '⏳ Verifying...';
                    (verifyCodeBtn as HTMLButtonElement).disabled = true;
                    (verifyCodeBtn as HTMLButtonElement).style.opacity = '0.7';
                    
                    try {
                      await verify2FA(code);
                      cleanup();
                    } catch (error) {
                      // Show error in modal instead of alert
                      if (errorDiv && errorText) {
                        errorText.textContent = error instanceof Error ? error.message : 'Verification failed. Please try again.';
                        errorDiv.style.display = 'block';
                      }
                      
                      // Reset button state
                      verifyCodeBtn.textContent = originalText;
                      (verifyCodeBtn as HTMLButtonElement).disabled = false;
                      (verifyCodeBtn as HTMLButtonElement).style.opacity = '1';
                    }
                  } else {
                    // Show validation error in modal
                    if (errorDiv && errorText) {
                      errorText.textContent = 'Please enter a valid 6-digit code';
                      errorDiv.style.display = 'block';
                    }
                  }
                });
              }
              
              if (backBtn) {
                backBtn.addEventListener('click', () => {
                  // Reload the original modal content
                  location.reload();
                });
              }
              
              // Auto-focus the input
              if (codeInput) {
                (codeInput as HTMLInputElement).focus();
              }
            }
          });
        }
        
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => {
            cleanup();
          });
        }
        
        // Close on background click
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            cleanup();
          }
        });
      } else {
        // Disable 2FA
        const confirmed = confirm('Are you sure you want to disable 2FA? This will make your account less secure.');
        if (!confirmed) return;
        
        const response = await fetch('/api/profile/2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: false }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        setProfile(prev => prev ? {
          ...prev,
          security: { ...prev.security, twoFactorEnabled: false }
        } : null);
        toast.success(result.message);
      }
    } catch (error) {
      console.error('Failed to toggle 2FA:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to toggle 2FA');
    }
  };

  const verify2FA = async (token: string) => {
    try {
      const response = await fetch('/api/profile/2fa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setProfile(prev => prev ? {
        ...prev,
        security: { ...prev.security, twoFactorEnabled: true }
      } : null);
      
      // Show success modal
      const successModal = document.createElement('div');
      successModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1001;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease-out;
      `;
      
      successModal.innerHTML = `
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 16px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
          animation: slideIn 0.3s ease-out;
        ">
          <div style="margin-bottom: 1.5rem;">
            <div style="
              width: 64px;
              height: 64px;
              background: linear-gradient(135deg, #10b981, #059669);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 1rem;
              animation: bounce 0.6s ease-out;
            ">
              <span style="font-size: 2rem;">✅</span>
            </div>
            <h3 style="margin-bottom: 0.5rem; color: #111827; font-size: 1.5rem; font-weight: 600;">
              🎉 2FA Enabled Successfully!
            </h3>
            <p style="color: #6b7280; font-size: 0.95rem; line-height: 1.5;">
              Your account is now protected with two-factor authentication
            </p>
          </div>
          
          <div style="margin-bottom: 2rem; padding: 1rem; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #166534; font-size: 0.875rem; line-height: 1.4;">
              🔒 <strong>Security Enhanced:</strong> You'll now need your authenticator app to sign in from new devices.
            </p>
          </div>
          
          <button onclick="this.closest('.success-modal').remove()" style="
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.95rem;
            transition: all 0.2s;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
          " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 8px -1px rgba(16, 185, 129, 0.4)'" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(16, 185, 129, 0.3)'">
            🚀 Continue
          </button>
        </div>
      `;
      
      successModal.className = 'success-modal';
      document.body.appendChild(successModal);
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        if (document.body.contains(successModal)) {
          document.body.removeChild(successModal);
        }
      }, 5000);
      
      toast.success('🎉 2FA has been enabled successfully!');
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify 2FA');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800">Active</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800">Inactive</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800">Suspended</Badge>;
      default:
        return <Badge variant="secondary" className="hover:bg-gray-100 hover:text-gray-800">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100 hover:text-purple-800">Super Admin</Badge>;
      case 'ADMIN':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800">Admin</Badge>;
      case 'DEPARTMENT_HEAD':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100 hover:text-orange-800">Dept Head</Badge>;
      case 'INSTRUCTOR':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800">Instructor</Badge>;
      case 'STUDENT':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800">Student</Badge>;
      default:
        return <Badge variant="secondary" className="hover:bg-gray-100 hover:text-gray-800">{role}</Badge>;
    }
  };

  if (loading || isLoading) {
    return <PageSkeleton />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Unable to load your profile information.</p>
          <Button onClick={fetchUserProfile}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="px-6 py-4">
        <PageHeader
          title="My Profile"
          subtitle="Manage your account settings and personal information"
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Profile" }
          ]}
        />
      </div>

      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <SummaryCard
            icon={<User className="text-blue-500 w-5 h-5" />}
            label="Account Status"
            value={profile.status}
            valueClassName="text-blue-900"
            sublabel="Current status"
          />
          <SummaryCard
            icon={<Shield className="text-blue-500 w-5 h-5" />}
            label="Security Level"
            value={profile.security?.twoFactorEnabled ? "High" : "Standard"}
            valueClassName="text-blue-900"
            sublabel="Account security"
          />
          <SummaryCard
            icon={<Activity className="text-blue-500 w-5 h-5" />}
            label="Total Logins"
            value={profile.activity?.totalLogins?.toString() || "0"}
            valueClassName="text-blue-900"
            sublabel="Login count"
          />
          <SummaryCard
            icon={<Clock className="text-blue-500 w-5 h-5" />}
            label="Last Activity"
            value={profile.activity?.lastActivity ? new Date(profile.activity.lastActivity).toLocaleDateString() : "Never"}
            valueClassName="text-blue-900"
            sublabel="Recent activity"
          />
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card className="shadow-lg rounded-xl overflow-hidden p-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center p-6">
                <div className="relative inline-block">
                  <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white">
                    <AvatarImage src={profile.avatar} alt={profile.userName} />
                    <AvatarFallback className="text-2xl font-bold">
                      {profile.userName?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-blue-600 hover:bg-gray-100"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadAvatar(file);
                    }}
                  />
                </div>
                <CardTitle className="text-xl text-white">{profile.userName}</CardTitle>
                <p className="text-blue-100">{profile.email}</p>
                <div className="flex justify-center gap-2 mt-2">
                  {getRoleBadge(profile.role)}
                  {getStatusBadge(profile.status)}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Member since {new Date(profile.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Last login {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg rounded-xl overflow-hidden p-0">
              <CardHeader className="bg-gradient-to-r from-blue-800 to-blue-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-white" />
                    <div>
                      <CardTitle className="text-white text-lg font-bold">Profile Information</CardTitle>
                      <p className="text-blue-100 text-sm">Manage your personal information, security settings, and preferences</p>
                    </div>
                  </div>
                  {!isEditing && (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 rounded"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="userName">Username</Label>
                        <Input
                          id="userName"
                          value={profile.userName || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, userName: e.target.value } : null)}
                          disabled={!isEditing}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Input
                          id="role"
                          value={profile.role}
                          disabled
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Input
                          id="status"
                          value={profile.status}
                          disabled
                          className="mt-2"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Personal Information Note</h4>
                      <p className="text-sm text-blue-700">
                        Personal details like name, phone, and address are managed through your student or instructor profile. 
                        Contact your administrator to update these details.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="security" className="space-y-6 mt-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border rounded">
                        <div>
                          <h4 className="font-semibold">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <Switch
                          checked={profile.security?.twoFactorEnabled || false}
                          onCheckedChange={handleToggle2FA}
                        />
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Change Password</h4>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="mt-2 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="mt-2"
                            />
                          </div>
                          <Button onClick={handleChangePassword} disabled={isSaving} className="rounded">
                            {isSaving ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Changing...
                              </>
                            ) : (
                              <>
                                <Key className="w-4 h-4 mr-2" />
                                Change Password
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                    </div>
                  </TabsContent>

                  <TabsContent value="preferences" className="space-y-6 mt-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 border rounded">
                        <div>
                          <h4 className="font-semibold">Email Notifications</h4>
                          <p className="text-sm text-gray-600">Receive email alerts and updates</p>
                        </div>
                        <Switch
                          checked={profile.preferences?.notifications || false}
                          onCheckedChange={(checked) => setProfile(prev => prev ? {
                            ...prev,
                            preferences: { ...prev.preferences, notifications: checked }
                          } : null)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded">
                        <div>
                          <h4 className="font-semibold">Email Alerts</h4>
                          <p className="text-sm text-gray-600">Get notified about important events</p>
                        </div>
                        <Switch
                          checked={profile.preferences?.emailAlerts || false}
                          onCheckedChange={(checked) => setProfile(prev => prev ? {
                            ...prev,
                            preferences: { ...prev.preferences, emailAlerts: checked }
                          } : null)}
                        />
                      </div>

                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-6 mt-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded text-center">
                          <div className="text-2xl font-bold text-blue-600">{profile.activity?.totalLogins || 0}</div>
                          <div className="text-sm text-gray-600">Total Logins</div>
                        </div>
                        <div className="p-4 border rounded text-center">
                          <div className="text-2xl font-bold text-green-600">{profile.activity?.sessionsCount || 0}</div>
                          <div className="text-sm text-gray-600">Active Sessions</div>
                        </div>
                        <div className="p-4 border rounded text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {profile.security?.failedLoginAttempts || 0}
                          </div>
                          <div className="text-sm text-gray-600">Failed Attempts</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Recent Activity</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 border rounded">
                            <Activity className="w-4 h-4 text-green-500" />
                            <div>
                              <div className="font-medium">Profile Updated</div>
                              <div className="text-sm text-gray-600">
                                {new Date(profile.updatedAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded">
                            <LogOut className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="font-medium">Last Login</div>
                              <div className="text-sm text-gray-600">
                                {new Date(profile.lastLogin || '').toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded">
                            <Lock className="w-4 h-4 text-orange-500" />
                            <div>
                              <div className="font-medium">Password Changed</div>
                              <div className="text-sm text-gray-600">
                                {profile.security?.lastPasswordChange ? new Date(profile.security.lastPasswordChange).toLocaleString() : "Never"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {isEditing && (
                  <div className="flex justify-end gap-4 mt-6 pt-6 border-t rounded">
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="rounded">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="rounded">
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
