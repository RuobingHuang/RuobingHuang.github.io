(function () {
  // Highlight active nav link based on current path
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("nav a").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.setAttribute("aria-current", "page");
  });

  // Copy BibTeX blocks
  document.querySelectorAll("[data-copy-bibtex]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-copy-bibtex");
      const el = document.getElementById(targetId);
      if (!el) return;
      const text = el.innerText;
      try{
        await navigator.clipboard.writeText(text);
        const old = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = old), 900);
      } catch (e) {
        alert("Copy failed. Please copy manually.");
      }
    });
  });
})();
