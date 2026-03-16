import { createContext, useCallback, useContext, useMemo, useState } from "react";
import AppAlert from "@/components/AppAlert";

const AppAlertContext = createContext(null);

export function AppAlertProvider({ children }) {
  const [alert, setAlert] = useState(null);

  const hideAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const showAlert = useCallback((payload) => {
    setAlert({
      type: payload.type || "info",
      title: payload.title || "",
      message: payload.message || "",
      messages: payload.messages || [],
      autoHideMs: payload.autoHideMs ?? 5000,
    });
  }, []);

  const showSuccess = useCallback((message, title = "Berhasil") => {
    setAlert({
      type: "success",
      title,
      message,
      messages: [],
      autoHideMs: 5000,
    });
  }, []);

  const showError = useCallback(
    (message, title = "Gagal", messages = []) => {
      setAlert({
        type: "error",
        title,
        message,
        messages,
        autoHideMs: 6000,
      });
    },
    []
  );

  const showWarning = useCallback((message, title = "Peringatan") => {
    setAlert({
      type: "warning",
      title,
      message,
      messages: [],
      autoHideMs: 5000,
    });
  }, []);

  const showInfo = useCallback((message, title = "Informasi") => {
    setAlert({
      type: "info",
      title,
      message,
      messages: [],
      autoHideMs: 5000,
    });
  }, []);

  const showValidationError = useCallback(
    (messages, title = "Validasi Gagal") => {
      setAlert({
        type: "error",
        title,
        message: "",
        messages: messages || [],
        autoHideMs: 6000,
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      alert,
      showAlert,
      hideAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showValidationError,
    }),
    [
      alert,
      showAlert,
      hideAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showValidationError,
    ]
  );

  return (
    <AppAlertContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed top-24 right-4 z-[999] w-full max-w-md sm:right-6">
        {alert && (
          <div className="pointer-events-auto">
            <AppAlert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              messages={alert.messages}
              autoHideMs={alert.autoHideMs}
              onDismiss={hideAlert}
            />
          </div>
        )}
      </div>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AppAlertContext);

  if (!context) {
    throw new Error("useAppAlert must be used within AppAlertProvider");
  }

  return context;
}