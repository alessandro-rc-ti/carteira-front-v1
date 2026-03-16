import { toast as sonnerToast } from "sonner";

type ToastOptions = Record<string, any>;

const DEFAULT_OPTIONS: ToastOptions = {
  position: "top-right",
  duration: 6000,
};

export function showSuccess(message: string, opts?: ToastOptions) {
  sonnerToast.success(message, { ...DEFAULT_OPTIONS, ...opts });
}

export function showError(message: string, opts?: ToastOptions) {
  // default error duration a bit longer
  sonnerToast.error(message, { ...DEFAULT_OPTIONS, duration: 8000, ...opts });
}

export default { showSuccess, showError };
