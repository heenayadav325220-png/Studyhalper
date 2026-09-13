import React, { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const defaultThemeContext: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: false,
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeProviderState {
  theme: Theme;
}

export class ThemeProvider extends React.Component<ThemeProviderProps, ThemeProviderState> {
  constructor(props: ThemeProviderProps) {
    super(props);
    let initialTheme: Theme = 'light';
    try {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('ascend_theme') as Theme | null;
        if (savedTheme === 'light' || savedTheme === 'dark') {
          initialTheme = savedTheme;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          initialTheme = 'dark';
        }
      }
    } catch (e) {
      console.error('Error reading theme from localStorage', e);
    }
    this.state = { theme: initialTheme };
  }

  componentDidMount() {
    this.applyTheme(this.state.theme);
  }

  componentDidUpdate(_prevProps: ThemeProviderProps, prevState: ThemeProviderState) {
    if (prevState.theme !== this.state.theme) {
      this.applyTheme(this.state.theme);
    }
  }

  applyTheme = (theme: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('ascend_theme', theme);
    } catch (e) {
      console.error('Error saving theme to localStorage', e);
    }
  };

  toggleTheme = () => {
    this.setState((prev) => ({
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  setTheme = (newTheme: Theme) => {
    this.setState({ theme: newTheme });
  };

  render() {
    const value: ThemeContextType = {
      theme: this.state.theme,
      toggleTheme: this.toggleTheme,
      setTheme: this.setTheme,
      isDark: this.state.theme === 'dark',
    };
    return <ThemeContext.Provider value={value}>{this.props.children}</ThemeContext.Provider>;
  }
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  return context || defaultThemeContext;
};

export default ThemeProvider;
