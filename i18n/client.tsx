'use client';

import {createContext, useContext, ReactNode, useMemo} from "react";
import {Messages, createTranslator} from "./utils";

interface TranslationContextValue {
  locale: string;
  messages: Messages;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export function TranslationProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: ReactNode;
}) {
  const value = useMemo(() => ({locale, messages}), [locale, messages]);
  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useLocale must be used within a TranslationProvider");
  }
  return context.locale;
}

export function useTranslations(namespace?: string) {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslations must be used within a TranslationProvider");
  }
  const translator = useMemo(
    () => createTranslator(context.messages, namespace),
    [context.messages, namespace]
  );

  return translator;
}
