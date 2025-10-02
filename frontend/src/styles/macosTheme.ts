import { theme } from 'antd';
import { generate, grey, blue, green, red, orange } from '@ant-design/colors';

// macOS-inspired color palette
export const macOSColors = {
  // System colors matching macOS Big Sur/Monterey/Ventura
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D92',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',
  
  // Grays (macOS system grays)
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  
  // Background colors
  primaryBackground: '#FFFFFF',
  secondaryBackground: '#F5F5F7',
  tertiaryBackground: '#FFFFFF',
  
  // Sidebar colors (matching Finder/System apps)
  sidebarBackground: '#F7F7F7',
  sidebarSelected: '#E3F2FD',
  sidebarSelectedBorder: '#007AFF',
  
  // Text colors
  primaryText: '#000000',
  secondaryText: '#6D6D70',
  tertiaryText: '#8E8E93',
  placeholderText: '#C7C7CC',
  
  // Border colors
  separatorOpaque: '#C6C6C8',
  separator: 'rgba(60, 60, 67, 0.36)',
  
  // Control colors
  controlAccent: '#007AFF',
  controlBackground: '#FFFFFF',
  fill: 'rgba(120, 120, 128, 0.20)',
  fillSecondary: 'rgba(120, 120, 128, 0.16)',
  fillTertiary: 'rgba(118, 118, 128, 0.12)',
  
  // Semantic colors
  link: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
  
  // Glass/vibrancy effects
  glassBackground: 'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
};

// Ant Design theme configuration for macOS look
export const macOSTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // Color palette
    colorPrimary: macOSColors.systemBlue,
    colorSuccess: macOSColors.systemGreen,
    colorWarning: macOSColors.systemOrange,
    colorError: macOSColors.systemRed,
    colorInfo: macOSColors.systemTeal,
    
    // Background colors
    colorBgContainer: macOSColors.primaryBackground,
    colorBgElevated: macOSColors.secondaryBackground,
    colorBgLayout: macOSColors.secondaryBackground,
    colorBgSpotlight: macOSColors.tertiaryBackground,
    
    // Text colors
    colorText: macOSColors.primaryText,
    colorTextSecondary: macOSColors.secondaryText,
    colorTextTertiary: macOSColors.tertiaryText,
    colorTextQuaternary: macOSColors.placeholderText,
    
    // Border
    colorBorder: macOSColors.separator,
    colorBorderSecondary: macOSColors.separatorOpaque,
    
    // Typography (San Francisco font stack)
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
    fontFamilyCode: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    
    // Sizes and spacing (following Apple's HIG)
    borderRadius: 8, // macOS uses 8px radius for most UI elements
    controlHeight: 32, // Standard control height
    
    // Motion - more subtle than default Ant Design
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    
    // Spacing (following 8px grid)
    padding: 16,
    paddingXS: 4,
    paddingSM: 8,
    paddingMD: 16,
    paddingLG: 24,
    paddingXL: 32,
    
    margin: 16,
    marginXS: 4,
    marginSM: 8,
    marginMD: 16,
    marginLG: 24,
    marginXL: 32,
    
    // Shadows (subtle, matching macOS)
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    boxShadowTertiary: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  
  components: {
    // Button styles matching macOS buttons
    Button: {
      borderRadius: 6,
      fontWeight: 500,
      paddingContentHorizontal: 16,
      controlHeight: 28,
      controlHeightSM: 24,
      controlHeightLG: 32,
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    
    // Layout components
    Layout: {
      bodyBg: macOSColors.secondaryBackground,
      headerBg: macOSColors.primaryBackground,
      siderBg: macOSColors.sidebarBackground,
      triggerBg: macOSColors.sidebarBackground,
    },
    
    // Menu (sidebar navigation)
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: macOSColors.sidebarSelected,
      itemActiveBg: macOSColors.fillSecondary,
      itemHoverBg: macOSColors.fill,
      itemSelectedColor: macOSColors.systemBlue,
      itemColor: macOSColors.primaryText,
      iconSize: 16,
      itemHeight: 32,
      borderRadius: 6,
      subMenuItemBorderRadius: 6,
    },
    
    // Card components
    Card: {
      borderRadiusLG: 12,
      boxShadowTertiary: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      paddingLG: 20,
    },
    
    // Input components
    Input: {
      borderRadius: 6,
      controlHeight: 32,
      paddingContentHorizontal: 12,
      colorBorder: macOSColors.separator,
      activeBorderColor: macOSColors.systemBlue,
      hoverBorderColor: macOSColors.systemGray2,
    },
    
    // Select components
    Select: {
      borderRadius: 6,
      controlHeight: 32,
      optionSelectedBg: macOSColors.sidebarSelected,
    },
    
    // Table components
    Table: {
      borderColor: macOSColors.separator,
      headerBg: macOSColors.tertiaryBackground,
      headerSplitColor: macOSColors.separator,
      rowHoverBg: macOSColors.fillTertiary,
    },
    
    // Modal components
    Modal: {
      borderRadiusLG: 12,
      paddingContentHorizontal: 24,
      paddingMD: 20,
    },
    
    // Tooltip
    Tooltip: {
      borderRadius: 6,
      colorBgSpotlight: 'rgba(0, 0, 0, 0.8)',
    },
    
    // Tabs
    Tabs: {
      itemColor: macOSColors.secondaryText,
      itemSelectedColor: macOSColors.systemBlue,
      itemHoverColor: macOSColors.primaryText,
      inkBarColor: macOSColors.systemBlue,
      cardBg: macOSColors.tertiaryBackground,
    },
  },
};

// CSS custom properties for additional styling
export const macOSCSS = `
  /* macOS-specific styles */
  .macos-window {
    background: ${macOSColors.primaryBackground};
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(20px);
  }
  
  .macos-sidebar {
    background: ${macOSColors.sidebarBackground};
    border-right: 1px solid ${macOSColors.separator};
  }
  
  .macos-toolbar {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid ${macOSColors.separator};
  }
  
  .macos-glass {
    background: ${macOSColors.glassBackground};
    backdrop-filter: blur(20px);
    border: 1px solid ${macOSColors.glassBorder};
  }
  
  /* Custom scrollbars matching macOS */
  .macos-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .macos-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .macos-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  .macos-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
  
  /* Focus styles */
  .macos-focus:focus {
    outline: 2px solid ${macOSColors.systemBlue};
    outline-offset: -2px;
  }
  
  /* Smooth transitions */
  .macos-transition {
    transition: all 0.2s ease-out;
  }
`;

export default macOSTheme;