export default function HrLayout({ children }: LayoutProps<"/hr">) {
  return <div className="mx-auto max-w-6xl space-y-5 px-8 py-8">{children}</div>;
}
