// Small web equivalents of the React Native primitives the original screens used.
// They render plain DOM elements (div / span / button / input / select) and apply
// the React-Native default layout rules (flex column, position: relative) so the
// existing style objects look the same in the browser.
import React, { useEffect, useRef } from "react";
import { sx, toCssGradient } from "../utils/rn";

const BASE_VIEW = {
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxSizing: "border-box",
  minWidth: 0,
  minHeight: 0,
  flexShrink: 0,
  alignItems: "stretch",
};

export function View({ style, children, ...rest }) {
  return (
    <div style={sx(BASE_VIEW, style)} {...rest}>
      {children}
    </div>
  );
}

export function Text({ style, numberOfLines, children, as: As = "span", ...rest }) {
  const clamp =
    numberOfLines > 0
      ? {
          display: "-webkit-box",
          WebkitLineClamp: numberOfLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }
      : null;
  return (
    <As
      style={sx(
        { fontSize: 14, color: "#000", margin: 0, minWidth: 0, wordBreak: "break-word" },
        style,
        clamp
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

// Equivalent of TouchableOpacity: a reset <button> with a pressed-opacity effect.
export function Touchable({ style, onPress, disabled, children, activeOpacity = 0.7, ...rest }) {
  return (
    <button
      type="button"
      className="pc-touch"
      disabled={disabled}
      onClick={onPress}
      style={sx(
        BASE_VIEW,
        {
          border: "none",
          background: "none",
          padding: 0,
          margin: 0,
          textAlign: "left",
          font: "inherit",
          color: "inherit",
          cursor: disabled ? "default" : "pointer",
          "--pc-active-opacity": activeOpacity,
        },
        style
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Gradient({ colors, start, end, style, children }) {
  return (
    <div
      style={sx(BASE_VIEW, { background: toCssGradient(colors, start, end) }, style)}
    >
      {children}
    </div>
  );
}

export function Spinner({ size = "small", color = "#2E7D32" }) {
  const px = size === "large" ? 36 : 20;
  return (
    <span
      role="progressbar"
      aria-label="Loading"
      style={{
        display: "inline-block",
        width: px,
        height: px,
        flexShrink: 0,
        borderRadius: "50%",
        border: `${Math.max(2, px / 9)}px solid ${color}33`,
        borderTopColor: color,
        animation: "pc-spin 0.8s linear infinite",
      }}
    />
  );
}

// Scroll container. `onRefresh` enables touch pull-to-refresh (replacement for
// RN's RefreshControl); `contentContainerStyle` styles the inner wrapper.
export function ScrollView({
  style,
  contentContainerStyle,
  horizontal,
  onRefresh,
  refreshing,
  children,
}) {
  const ref = useRef(null);
  const startY = useRef(null);
  const pulled = useRef(false);

  const onTouchStart = (e) => {
    if (!onRefresh || horizontal || refreshing) return;
    if (ref.current && ref.current.scrollTop <= 0) startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (startY.current == null) return;
    if (e.touches[0].clientY - startY.current > 90) pulled.current = true;
  };
  const onTouchEnd = () => {
    if (pulled.current && onRefresh) onRefresh();
    startY.current = null;
    pulled.current = false;
  };

  return (
    <div
      ref={ref}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={sx(
        BASE_VIEW,
        horizontal
          ? { flexDirection: "row", overflowX: "auto", overflowY: "hidden" }
          : { overflowY: "auto", overflowX: "hidden", flexGrow: 1, flexShrink: 1, flexBasis: "auto" },
        style
      )}
    >
      {refreshing && !horizontal && (
        <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
          <Spinner color="#6C63FF" />
        </div>
      )}
      <div
        style={sx(
          BASE_VIEW,
          horizontal ? { flexDirection: "row" } : { flexGrow: 1 },
          contentContainerStyle
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function TextInput({ style, onChangeText, value, ...rest }) {
  return (
    <input
      value={value}
      onChange={(e) => onChangeText && onChangeText(e.target.value)}
      style={sx(
        {
          border: "none",
          outline: "none",
          background: "transparent",
          padding: 0,
          margin: 0,
          fontSize: 14,
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        },
        style
      )}
      {...rest}
    />
  );
}

export function Image({ src, alt = "", style }) {
  return <img src={src} alt={alt} style={sx({ display: "block" }, style)} />;
}

// Full-screen overlay (replacement for RN <Modal>). Closes on Escape.
export function Modal({ visible, onRequestClose, children }) {
  useEffect(() => {
    if (!visible) return undefined;
    const onKey = (e) => e.key === "Escape" && onRequestClose && onRequestClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onRequestClose]);

  if (!visible) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column" }}
      onClick={(e) => {
        // Click on the dimmed backdrop (wrapper or its full-size first child) closes the modal.
        if (e.target === e.currentTarget || e.target === e.currentTarget.firstElementChild) {
          onRequestClose && onRequestClose();
        }
      }}
    >
      {children}
    </div>
  );
}

// Native-looking alert replacement.
export function notify(title, message) {
  window.alert(message ? `${title}\n\n${message}` : title);
}
