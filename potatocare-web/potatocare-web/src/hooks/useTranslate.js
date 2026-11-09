import { useEffect, useState } from "react";
import { translate, getCachedTranslation } from "../services/translate";
import { useLanguage } from "../context/LanguageContext";

// Returns `text` translated into the selected language (original text until ready).
export default function useTranslate(text) {
  const { language } = useLanguage();
  const source = text == null ? "" : String(text);

  const [translated, setTranslated] = useState(
    () => getCachedTranslation(source, language) ?? source
  );

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedTranslation(source, language);
    if (cached !== undefined) {
      setTranslated(cached);
      return undefined;
    }
    setTranslated(source);
    translate(source, language).then((t) => {
      if (!cancelled) setTranslated(t);
    });
    return () => {
      cancelled = true;
    };
  }, [source, language]);

  return translated;
}
