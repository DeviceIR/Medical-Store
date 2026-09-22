import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Medical Store | مدیکال استور",
    template: "%s | Medical Store",
  },
  description: "Bilingual medical instruments store",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
