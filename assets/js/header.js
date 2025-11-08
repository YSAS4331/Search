document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".site-header");
  const toggleBtn = header?.querySelector(".toggle-btn");
  const navItems = header?.querySelector(".nav-items");
  const overflowMenu = header?.querySelector(".overflow-menu");

  if (!header || !toggleBtn || !navItems || !overflowMenu) return;

  // 開閉ボタン
  toggleBtn.addEventListener("click", () => {
    header.classList.toggle("collapsed");

    // 閉じたときにoverflowMenuを隠す（見た目が崩れないように）
    if (header.classList.contains("collapsed")) {
      overflowMenu.style.display = "none";
    } else {
      checkOverflow();
    }
  });

  // 溢れ判定
  const checkOverflow = () => {
    // collapsed中は常に非表示
    if (header.classList.contains("collapsed")) return;

    const navWidth = navItems.scrollWidth;
    const containerWidth = navItems.clientWidth;

    overflowMenu.style.display = navWidth > containerWidth ? "inline" : "none";
  };

  window.addEventListener("resize", checkOverflow);
  checkOverflow();
});
