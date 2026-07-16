// src/hooks/useTranslate.js

import { useEffect, useState } from "react";
import { translate } from "../services/translate";
import { useLanguage } from "../context/LanguageContext";

export default function useTranslate(text) {
  const { language } = useLanguage();

  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    async function load() {
      const t = await translate(text, language);
      setTranslated(t);
    }

    load();
  }, [text, language]);

  return translated;
}