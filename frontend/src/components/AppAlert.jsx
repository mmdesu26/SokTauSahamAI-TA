import { Alert } from "@/components/ui/alert";

export default function AppAlert({
  type = "info",
  title,
  message,
  messages,
  className = "",
  autoHideMs = 5000,
  onDismiss,
}) {
  return (
    <Alert
      type={type}
      title={title}
      message={message}
      messages={messages}
      className={className}
      autoHideMs={autoHideMs}
      dismissible
      onDismiss={onDismiss}
    />
  );
}