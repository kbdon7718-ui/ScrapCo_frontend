import React, {createContext, useCallback, useMemo, useRef, useState} from 'react';

export const UiStatusContext = createContext(null);

export function UiStatusProvider({children}) {
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const hideTimer = useRef(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearHideTimer();
    setToast(null);
  }, [clearHideTimer]);

  const showToast = useCallback(
    (message, {type = 'error', durationMs = 4500} = {}) => {
      clearHideTimer();
      setToast({message, type});
      if (durationMs > 0) {
        hideTimer.current = setTimeout(() => {
          hideTimer.current = null;
          setToast(null);
        }, durationMs);
      }
    },
    [clearHideTimer]
  );

  const showError = useCallback(
    (message, opts = {}) => showToast(message || 'Something went wrong.', {type: 'error', ...opts}),
    [showToast]
  );

  const showInfo = useCallback(
    (message, opts = {}) => showToast(message, {type: 'info', ...opts}),
    [showToast]
  );

  const value = useMemo(
    () => ({
      toast,
      loading,
      setLoading,
      showToast,
      showError,
      showInfo,
      hideToast,
    }),
    [toast, loading, setLoading, showToast, showError, showInfo, hideToast]
  );

  return <UiStatusContext.Provider value={value}>{children}</UiStatusContext.Provider>;
}
