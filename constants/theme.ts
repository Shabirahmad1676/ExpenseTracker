import { scale, verticalScale } from "@/utils/styling";

// colors.ts
export const Colors = {
  primary: '#5B4BDB',
  primaryLight: '#6C3BFF',
  accent: '#FF6B35',
  danger: '#FF4D6D',

  // Cards
  cardDark: '#2D2B55',
  cardSalary: '#6C3BFF',
  cardExpense: '#FF6B35',

  // Chart
  chartOrange: '#FF6B35',
  chartNavy: '#2D2B55',
  chartPurple: '#6C3BFF',
  chartBarActive: '#5B4BDB',
  chartBarInactive: '#E5E3F5',

  // UI
  background: '#FFFFFF',
  surface: '#F5F5FA',
  textPrimary: '#1A1A2E',
  textSecondary: '#8E8EA9',

  // Progress
  progressFill: '#5B4BDB',
  progressTrack: '#F0EEFF',
  fab: '#FF6B35',
};

export const colors = Colors; // Alias for backward compatibility

export const typography = {
  header: {
    fontSize: verticalScale(24),
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subHeader: {
    fontSize: verticalScale(18),
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  body: {
    fontSize: verticalScale(14),
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  bodySecondary: {
    fontSize: verticalScale(14),
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: verticalScale(12),
    fontWeight: '400',
    color: Colors.textSecondary,
  },
};

export const spacingX = {
  _3: scale(3),
  _5: scale(5),
  _7: scale(7),
  _10: scale(10),
  _12: scale(12),
  _15: scale(15),
  _20: scale(20),
  _25: scale(25),
  _30: scale(30),
  _35: scale(35),
  _40: scale(40),
};

export const spacingY = {
  _5: verticalScale(5),
  _7: verticalScale(7),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _25: verticalScale(25),
  _30: verticalScale(30),
  _35: verticalScale(35),
  _40: verticalScale(40),
  _50: verticalScale(50),
  _60: verticalScale(60),
};

export const radius = {
  _3: verticalScale(3),
  _6: verticalScale(6),
  _10: verticalScale(10),
  _12: verticalScale(12),
  _15: verticalScale(15),
  _17: verticalScale(17),
  _20: verticalScale(20),
  _30: verticalScale(30),
};

export const styles = {
  shadow: {
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 10,
  }
};
