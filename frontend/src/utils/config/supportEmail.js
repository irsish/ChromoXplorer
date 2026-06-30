const DEFAULT_SUPPORT_EMAIL = "support@chromoxplorer.com";

export const SUPPORT_EMAIL =
  import.meta.env.VITE_SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;
