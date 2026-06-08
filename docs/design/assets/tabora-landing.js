(() => {
  const root = document.documentElement;
  const mockRoot = document.querySelector("[data-mock-root]");
  const layoutButtons = document.querySelectorAll("[data-layout]");
  const commandDialog = document.querySelector("[data-command-dialog]");
  const toast = document.querySelector("[data-toast]");
  const waitlist = document.querySelector("[data-waitlist]");
  const tabButtons = document.querySelectorAll("[data-doc-tab]");
  const copyButtons = document.querySelectorAll("[data-copy-target]");
  let toastTimer = 0;
  let commandTrigger = null;

  const showToast = (message) => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("visible");
    toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
  };

  const setLayout = (mode) => {
    if (!mockRoot) return;
    const dashboardView = document.querySelector(".site-widget-grid");
    const streamView = document.querySelector(".site-stream-view");
    const isStream = mode === "stream";

    layoutButtons.forEach((item) => item.classList.toggle("active", item.dataset.layout === mode));
    mockRoot.classList.toggle("mock-stream", isStream);
    dashboardView?.setAttribute("aria-hidden", String(isStream));
    streamView?.setAttribute("aria-hidden", String(!isStream));
    showToast(isStream ? "已切换到 Stream，实例数据保持不变。" : "已回到 Dashboard 默认布局。");
  };

  const openCommand = (trigger) => {
    if (!commandDialog) return;
    commandTrigger = trigger || document.activeElement;
    commandDialog.classList.add("visible");
    commandDialog.setAttribute("aria-hidden", "false");
    commandDialog.querySelector("input")?.focus();
  };

  const closeCommand = () => {
    if (!commandDialog?.classList.contains("visible")) return;
    commandDialog.classList.remove("visible");
    commandDialog.setAttribute("aria-hidden", "true");
    commandTrigger?.focus?.();
  };

  layoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLayout(button.dataset.layout);
    });
  });

  document.querySelectorAll("[data-open-command]").forEach((button) => {
    button.addEventListener("click", () => {
      openCommand(button);
    });
  });

  commandDialog?.addEventListener("click", (event) => {
    if (event.target === commandDialog) {
      closeCommand();
    }
  });

  waitlist?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = new FormData(waitlist).get("email");
    if (!String(email).includes("@")) {
      showToast("请输入有效邮箱。");
      return;
    }
    waitlist.reset();
    showToast("已记录评审请求，下一步会进入 MVP 走查。");
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const group = button.closest("[data-doc-tabs]");
      const targetId = button.dataset.docTab;
      if (!group || !targetId) return;

      group.querySelectorAll("[data-doc-tab]").forEach((item) => {
        item.classList.toggle("active", item === button);
        item.setAttribute("aria-selected", String(item === button));
      });

      group.querySelectorAll("[data-doc-panel]").forEach((panel) => {
        panel.hidden = panel.dataset.docPanel !== targetId;
      });
    });
  });

  copyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const target = document.querySelector(button.dataset.copyTarget);
      const text = target?.textContent?.trim();
      if (!text) return;

      try {
        await navigator.clipboard?.writeText(text);
        showToast("代码已复制。");
      } catch {
        showToast("复制失败，请手动选择代码。");
      }
    });
  });

  window.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openCommand();
    }
    if (event.key === "Escape") {
      closeCommand();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") {
      event.preventDefault();
      toggleDark();
    }
  });

  // ── Dark mode button ─────────────────────────────────────────────────────
  const toggleDark = () => {
    root.classList.toggle("dark");
    const isDark = root.classList.contains("dark");
    localStorage.setItem("tabora-theme", isDark ? "dark" : "light");
    showToast(isDark ? "已切换为暗色主题。" : "已切换为明亮主题。");
  };

  // Restore persisted theme on load
  const savedTheme = localStorage.getItem("tabora-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    root.classList.add("dark");
  } else if (savedTheme === "light") {
    root.classList.remove("dark");
  }

  document.querySelectorAll("[data-dark-toggle]").forEach((btn) => {
    btn.addEventListener("click", toggleDark);
  });

  // ── FAQ accordion ────────────────────────────────────────────────────────
  document.querySelectorAll("[data-faq-item]").forEach((item) => {
    const trigger = item.querySelector("[data-faq-trigger]");
    const body = item.querySelector("[data-faq-body]");
    if (!trigger || !body) return;
    body.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    trigger.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      trigger.setAttribute("aria-expanded", String(open));
      body.hidden = !open;
    });
  });

  // ── Active nav link ──────────────────────────────────────────────────────
  const currentPage = location.pathname.split("/").pop() || "landing.html";
  document.querySelectorAll(".site-navlinks a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const page = href.split("#")[0];
    if (page && page === currentPage) {
      a.classList.add("active");
    }
  });
})();
