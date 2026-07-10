import api from "./api";

export async function translate(text, language) {
  if (language === "english") {
    return text;
  }

  const res = await api.get(
    `/translate/?text=${encodeURIComponent(text)}&target_language=${language}`
  );

  return res.data.translated_text;
}