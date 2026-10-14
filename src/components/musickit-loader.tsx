"use client";

import { useEffect } from "react";

function isLegacyIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const ios = ua.match(/OS (\d+)_/);
  return Boolean(ios && /iPhone|iPad|iPod/i.test(ua) && Number(ios[1]) < 16);
}

export function MusicKitLoader() {
  useEffect(() => {
    if (isLegacyIos() || window.MusicKit) return;

    const script = document.createElement("script");
    script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
    script.async = true;
    script.setAttribute("data-web-components", "");
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  return null;
}
