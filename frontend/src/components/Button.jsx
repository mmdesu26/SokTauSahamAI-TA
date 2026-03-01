import { StyleButtonBase } from "@/components/ui/tailwindcss-buttons";

export default function Button({ children, className = "", ...props }) {
  return (
    <StyleButtonBase className={className} {...props}>
      {children}
    </StyleButtonBase>
  );
}
