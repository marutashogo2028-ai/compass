import { HrCompanySelect } from "./HrCompanySelect";

export default function HrLayout({ children }: LayoutProps<"/hr">) {
  return (
    <div className="space-y-4">
      <HrCompanySelect />
      {children}
    </div>
  );
}
