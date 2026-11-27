import type { ReactNode } from "react";

import { AppLayout } from "~/components/layouts/app-layout";

const RootLayout = ({ children }: { children: ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

export default RootLayout;
