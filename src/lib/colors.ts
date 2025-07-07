/**
 * ICCT Smart Attendance System Color Palette
 * Centralized color definitions and utility functions
 */

export const ICCT_COLORS = {
  // Primary Colors
  PRIMARY_BLUE: '#1e40af',
  SECONDARY_BLUE: '#3b82f6',
  DARK_SLATE: '#1e293b',
  
  // Status & Action Colors
  SUCCESS_GREEN: '#10b981',
  WARNING_AMBER: '#f59e0b',
  ERROR_RED: '#ef4444',
  RFID_PURPLE: '#8b5cf6',
  
  // Neutral & Background Colors
  LIGHT_BG: '#f8fafc',
  BORDER_GRAY: '#e2e8f0',
  SECONDARY_TEXT: '#64748b',
  PURE_WHITE: '#ffffff',
  
  // Gradient Stop Colors
  SUCCESS_DARK: '#059669',
  RFID_DARK: '#7c3aed',
} as const;

// Tailwind class mappings for easier use
export const ICCT_CLASSES = {
  // Background Colors
  bg: {
    primary: 'bg-[#1e40af]',
    secondary: 'bg-[#3b82f6]',
    darkSlate: 'bg-[#1e293b]',
    success: 'bg-[#10b981]',
    warning: 'bg-[#f59e0b]',
    error: 'bg-[#ef4444]',
    rfid: 'bg-[#8b5cf6]',
    light: 'bg-[#f8fafc]',
    white: 'bg-[#ffffff]',
  },
  
  // Text Colors
  text: {
    primary: 'text-[#1e40af]',
    secondary: 'text-[#3b82f6]',
    darkSlate: 'text-[#1e293b]',
    success: 'text-[#10b981]',
    warning: 'text-[#f59e0b]',
    error: 'text-[#ef4444]',
    rfid: 'text-[#8b5cf6]',
    secondaryText: 'text-[#64748b]',
    white: 'text-[#ffffff]',
  },
  
  // Border Colors
  border: {
    primary: 'border-[#1e40af]',
    secondary: 'border-[#3b82f6]',
    success: 'border-[#10b981]',
    warning: 'border-[#f59e0b]',
    error: 'border-[#ef4444]',
    rfid: 'border-[#8b5cf6]',
    gray: 'border-[#e2e8f0]',
  },
  
  // Gradient Backgrounds
  gradient: {
    primary: 'bg-gradient-to-r from-[#1e40af] to-[#3b82f6]',
    success: 'bg-gradient-to-r from-[#10b981] to-[#059669]',
    rfid: 'bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed]',
    primarySubtle: 'bg-gradient-to-br from-[#1e40af]/10 to-[#3b82f6]/20',
    successSubtle: 'bg-gradient-to-br from-[#10b981]/10 to-[#059669]/20',
    rfidSubtle: 'bg-gradient-to-br from-[#8b5cf6]/10 to-[#7c3aed]/20',
  },
} as const;

// Utility functions for dynamic color application
export const getStatusColor = (status: 'present' | 'late' | 'absent' | 'unknown') => {
  switch (status) {
    case 'present':
      return {
        bg: ICCT_CLASSES.bg.success,
        text: ICCT_CLASSES.text.success,
        border: ICCT_CLASSES.border.success,
        hex: ICCT_COLORS.SUCCESS_GREEN,
      };
    case 'late':
      return {
        bg: ICCT_CLASSES.bg.warning,
        text: ICCT_CLASSES.text.warning,
        border: ICCT_CLASSES.border.warning,
        hex: ICCT_COLORS.WARNING_AMBER,
      };
    case 'absent':
      return {
        bg: ICCT_CLASSES.bg.error,
        text: ICCT_CLASSES.text.error,
        border: ICCT_CLASSES.border.error,
        hex: ICCT_COLORS.ERROR_RED,
      };
    default:
      return {
        bg: ICCT_CLASSES.bg.light,
        text: ICCT_CLASSES.text.secondaryText,
        border: ICCT_CLASSES.border.gray,
        hex: ICCT_COLORS.BORDER_GRAY,
      };
  }
};

export const getAttendanceRateColor = (rate: number) => {
  if (rate >= 90) {
    return getStatusColor('present');
  } else if (rate >= 75) {
    return getStatusColor('late');
  } else {
    return getStatusColor('absent');
  }
};

export const getRiskLevelColor = (risk: 'high' | 'medium' | 'low' | 'none') => {
  switch (risk) {
    case 'high':
      return getStatusColor('absent');
    case 'medium':
      return getStatusColor('late');
    case 'low':
    case 'none':
      return getStatusColor('present');
    default:
      return getStatusColor('unknown');
  }
};

// CSS-in-JS style objects for components that need them
export const ICCT_STYLES = {
  primary: {
    backgroundColor: ICCT_COLORS.PRIMARY_BLUE,
    color: ICCT_COLORS.PURE_WHITE,
  },
  secondary: {
    backgroundColor: ICCT_COLORS.SECONDARY_BLUE,
    color: ICCT_COLORS.PURE_WHITE,
  },
  success: {
    backgroundColor: ICCT_COLORS.SUCCESS_GREEN,
    color: ICCT_COLORS.PURE_WHITE,
  },
  warning: {
    backgroundColor: ICCT_COLORS.WARNING_AMBER,
    color: ICCT_COLORS.PURE_WHITE,
  },
  error: {
    backgroundColor: ICCT_COLORS.ERROR_RED,
    color: ICCT_COLORS.PURE_WHITE,
  },
  rfid: {
    backgroundColor: ICCT_COLORS.RFID_PURPLE,
    color: ICCT_COLORS.PURE_WHITE,
  },
} as const;

// Type definitions for better TypeScript support
export type ICCTColorKey = keyof typeof ICCT_COLORS;
export type StatusType = 'present' | 'late' | 'absent' | 'unknown';
export type RiskLevel = 'high' | 'medium' | 'low' | 'none'; 