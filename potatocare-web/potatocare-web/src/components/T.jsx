import React from "react";
import useTranslate from "../hooks/useTranslate";
import { Text } from "./ui";

// <T>some text</T> -> translated string (no wrapper element).
export function T({ children }) {
  return <>{useTranslate(children)}</>;
}

// Translated <Text>. Replaces the per-screen "TranslatedText" wrappers.
export function TText({ children, style, numberOfLines }) {
  const translated = useTranslate(children);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {translated}
    </Text>
  );
}
