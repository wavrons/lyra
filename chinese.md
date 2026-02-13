/* --- GLOBAL THEME ENGINE --- */

:root {
  /* Defaulting to Arjeplog (The Hidden Theme) */
  --primary-cta: #F0EEE9;
  --bg-surface: #1B3022;
  --accent: #A5F2F3;
  --text-main: #FFFFFF;
  --radius: 2px;
  /* Source Han Sans (Light) + Sora */
  --font-main: "Source Han Sans TC", "Source Han Sans SC", "Sora", sans-serif;
  --font-weight: 300;
  --letter-spacing: 0.05em;
}

/* 1. Taipei - Brutalist Tech */
[data-theme="taipei"] {
  --primary-cta: #999999;
  --bg-surface: #121212;
  --accent: #00FFCC;
  --text-main: #FFFFFF;
  --radius: 0px;
  /* PingFang TC + JetBrains Mono */
  --font-main: "PingFang TC", "Microsoft JhengHei", "JetBrains Mono", monospace;
  --font-weight: 400;
  --letter-spacing: 0px;
}

/* 2. Rio de Janeiro - Organic Growth */
[data-theme="rio"] {
  --primary-cta: #61BB46;
  --bg-surface: #F0FFF0;
  --accent: #FFD700;
  --text-main: #1B3022;
  --radius: 24px;
  /* Gen Jyuu Gothic + Quicksand */
  --font-main: "Gen Jyuu Gothic", "Quicksand", sans-serif;
  --font-weight: 500;
  --letter-spacing: 0px;
}

/* 3. Los Angeles - Cinematic Retro */
[data-theme="la"] {
  --primary-cta: #FDBD2C;
  --bg-surface: #3D2B1F;
  --accent: #87CEEB;
  --text-main: #F8F8F8;
  --radius: 12px;
  /* Noto Sans TC (Bold) + Bebas Neue */
  --font-main: "Noto Sans TC", "Bebas Neue", sans-serif;
  --font-weight: 700;
  --letter-spacing: 0.02em;
}

/* 4. Amsterdam - Modern Heritage */
[data-theme="amsterdam"] {
  --primary-cta: #F58220;
  --bg-surface: #FAF9F6;
  --accent: #003366;
  --text-main: #222222;
  --radius: 8px;
  /* Source Han Serif + Playfair Display */
  --font-main: "Source Han Serif TC", "Source Han Serif SC", "Playfair Display", serif;
  --font-weight: 400;
  --letter-spacing: 0px;
}

/* 5. Tokyo - Precise Editorial */
[data-theme="tokyo"] {
  --primary-cta: #333333;
  --bg-surface: #FFFFFF;
  --accent: #E03A3E;
  --text-main: #1A1A1A;
  --radius: 4px;
  /* Hiragino Sans + Space Grotesk */
  --font-main: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Space Grotesk", sans-serif;
  --font-weight: 400;
  --letter-spacing: 0.01em;
}

/* 6. Seoul - Cyber-Pop */
[data-theme="seoul"] {
  --primary-cta: #963D97;
  --bg-surface: #0B0114;
  --accent: #F06292;
  --text-main: #FFFFFF;
  --radius: 16px 4px 16px 4px;
  /* ZCOOL QingKe HuangYou + Syne */
  --font-main: "ZCOOL QingKe HuangYou", "Syne", sans-serif;
  --font-weight: 400;
  --letter-spacing: 0.03em;
}

/* 7. Santorini - Fluid/Coastal */
[data-theme="santorini"] {
  --primary-cta: #009DDC;
  --bg-surface: #FFFFFF;
  --accent: #E2E8F0;
  --text-main: #2C3E50;
  --radius: 100px;
  /* Source Han Serif (Extra Light) + Cormorant Garamond */
  --font-main: "Source Han Serif TC", "Source Han Serif SC", "Cormorant Garamond", serif;
  --font-weight: 200;
  --letter-spacing: 0.05em;
}

/* 8. Arjeplog - The Hidden Forest */
[data-theme="arjeplog"] {
  --primary-cta: #F0EEE9;
  --bg-surface: #1B3022;
  --accent: #A5F2F3;
  --text-main: #FFFFFF;
  --radius: 2px;
  /* Source Han Sans (Light) + Sora */
  --font-main: "Source Han Sans TC", "Source Han Sans SC", "Sora", sans-serif;
  --font-weight: 300;
  --letter-spacing: 0.05em;
}

/* --- APPLICATION --- */

body {
  background-color: var(--bg-surface);
  color: var(--text-main);
  font-family: var(--font-main);
  font-weight: var(--font-weight);
  letter-spacing: var(--letter-spacing);
  line-height: 1.8; /* Crucial for Chinese character readability */
  transition: all 0.5s ease-in-out;
}