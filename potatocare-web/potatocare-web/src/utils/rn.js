// Helpers that let the original React Native style objects be reused as-is on
// the web. `createStyles` converts RN-only style props (paddingHorizontal,
// shadow*, elevation, resizeMode, transform arrays...) into valid CSS.
// `sx` merges style arrays / conditionals the same way RN's style={[a, b && c]} did.

const PX_LINE_HEIGHT = new Set(["lineHeight"]);

function hexToRgba(color, opacity) {
  if (!color || color[0] !== "#") return color || `rgba(0,0,0,${opacity})`;
  let hex = color.slice(1);
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const n = parseInt(hex, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}

function convertStyle(input) {
  const out = {};
  const {
    paddingHorizontal,
    paddingVertical,
    marginHorizontal,
    marginVertical,
    shadowColor,
    shadowOpacity,
    shadowRadius,
    shadowOffset,
    elevation,
    resizeMode,
    transform,
    ...rest
  } = input;

  Object.assign(out, rest);

  if (paddingHorizontal !== undefined) {
    out.paddingLeft = paddingHorizontal;
    out.paddingRight = paddingHorizontal;
  }
  if (paddingVertical !== undefined) {
    out.paddingTop = paddingVertical;
    out.paddingBottom = paddingVertical;
  }
  if (marginHorizontal !== undefined) {
    out.marginLeft = marginHorizontal;
    out.marginRight = marginHorizontal;
  }
  if (marginVertical !== undefined) {
    out.marginTop = marginVertical;
    out.marginBottom = marginVertical;
  }

  // RN borders are always solid unless told otherwise; CSS needs it spelled out.
  [["borderWidth", "borderStyle"],
   ["borderTopWidth", "borderTopStyle"],
   ["borderBottomWidth", "borderBottomStyle"],
   ["borderLeftWidth", "borderLeftStyle"],
   ["borderRightWidth", "borderRightStyle"]].forEach(([w, s]) => {
    if (out[w] !== undefined && out[s] === undefined && !(w !== "borderWidth" && out.borderStyle)) {
      out[s] = "solid";
    }
  });

  // iOS-style shadow props / Android elevation -> box-shadow
  if (shadowColor !== undefined || shadowOpacity !== undefined || shadowRadius !== undefined) {
    const { width: ox = 0, height: oy = 0 } = shadowOffset || {};
    out.boxShadow = `${ox}px ${oy}px ${(shadowRadius ?? 0) * 1.5}px ${hexToRgba(
      shadowColor || "#000",
      shadowOpacity ?? 0.2
    )}`;
  } else if (elevation) {
    out.boxShadow = `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.15)`;
  }

  if (resizeMode) out.objectFit = resizeMode;

  if (Array.isArray(transform)) {
    out.transform = transform
      .map((t) => Object.entries(t).map(([k, v]) => `${k}(${v})`).join(" "))
      .join(" ");
  }

  PX_LINE_HEIGHT.forEach((k) => {
    if (typeof out[k] === "number") out[k] = `${out[k]}px`;
  });

  return out;
}

export function createStyles(styles) {
  const result = {};
  Object.keys(styles).forEach((key) => {
    result[key] = convertStyle(styles[key]);
  });
  return result;
}

// Flatten style arrays (RN style={[a, cond && b, { c }]}) into one object.
export function sx(...styles) {
  const out = {};
  const walk = (s) => {
    if (!s) return;
    if (Array.isArray(s)) s.forEach(walk);
    else Object.assign(out, s);
  };
  styles.forEach(walk);
  return out;
}

// Convert RN <LinearGradient start/end> vectors to a CSS gradient string.
export function toCssGradient(colors, start, end) {
  const s = start || { x: 0.5, y: 0 };
  const e = end || { x: 0.5, y: 1 };
  const angle = (Math.atan2(e.x - s.x, -(e.y - s.y)) * 180) / Math.PI;
  return `linear-gradient(${angle.toFixed(1)}deg, ${colors.join(", ")})`;
}
