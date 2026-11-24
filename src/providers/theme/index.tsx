import { ThemeContext } from "./context";
import { useThemeProvider } from "./hook";
import type { ThemeProviderProps } from "./type";

export const ThemeProvider = (props: ThemeProviderProps) => {
  const value = useThemeProvider(props);
  return <ThemeContext value={value}>{props.children}</ThemeContext>;
};
