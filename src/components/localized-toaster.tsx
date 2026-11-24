import { Toaster } from "sonner";

import { useLocale } from "~/providers/locale/context";

export const LocalizedToaster = () => {
  const { t } = useLocale();
  return (
    <Toaster
      richColors
      closeButton
      toastOptions={{ closeButtonAriaLabel: t("Close notification") }}
      containerAriaLabel={t("Notifications")}
      position="bottom-right"
    />
  );
};
