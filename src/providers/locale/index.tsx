import { LocaleContext } from "./context";
import { useLocaleProvider } from "./hook";
import type { LocaleProviderProps } from "./type";

export const LocaleProvider = (props: LocaleProviderProps) => {
  const value = useLocaleProvider();
  return <LocaleContext value={value}>{props.children}</LocaleContext>;
};
