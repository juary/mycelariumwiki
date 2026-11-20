const base = document.body.dataset.base;
const dialog = document.querySelector("#search-dialog");
const input = document.querySelector("#search-input");
const results = document.querySelector("#search-results");
const status = document.querySelector("#search-status");
let index;
let pendingIndex;
let lastTrigger;

document.querySelector(".theme-toggle")?.addEventListener("click", () => {
  const theme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("mycelarium-theme", theme);
  } catch {
    /* Themes still work without storage. */
  }
});

async function getIndex() {
  if (index) return index;
  if (!pendingIndex)
    pendingIndex = fetch(`${base}search-index.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load index");
        return r.json();
      })
      .then((data) => {
        index = data;
        return data;
      })
      .finally(() => {
        pendingIndex = undefined;
      });
  return pendingIndex;
}
function appendResult(article) {
  const link = document.createElement("a");
  link.className = "search-result";
  link.href = article.url;
  const category = document.createElement("span");
  category.textContent = article.category;
  const heading = document.createElement("h3");
  heading.textContent = article.title;
  const description = document.createElement("p");
  description.textContent = article.description;
  link.append(category, heading, description);
  results.append(link);
}
function renderSearch() {
  if (!index) return;
  const words = input.value
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const matches = index.articles
    .map((a) => {
      const title = a.title.toLocaleLowerCase();
      const desc = a.description.toLocaleLowerCase();
      const text =
        `${title} ${desc} ${a.category} ${a.text}`.toLocaleLowerCase();
      if (!words.every((word) => text.includes(word))) return null;
      return {
        ...a,
        score: words.reduce(
          (n, w) => n + (title.includes(w) ? 5 : desc.includes(w) ? 3 : 1),
          0,
        ),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
  results.replaceChildren();
  matches.slice(0, 12).forEach(appendResult);
  status.textContent = words.length
    ? matches.length
      ? `${matches.length} ${matches.length === 1 ? "page" : "pages"} found${matches.length > 12 ? " · showing the first 12" : ""}.`
      : index.ui.searchEmpty
    : index.ui.searchHint;
}
async function openSearch(trigger) {
  if (dialog.open) {
    input.focus();
    return;
  }
  lastTrigger = trigger || document.activeElement;
  dialog.showModal();
  input.focus();
  status.textContent = "Loading the field guide…";
  try {
    await getIndex();
    renderSearch();
  } catch {
    status.textContent =
      "Search could not load. Browse the categories or close and retry.";
  }
}
document
  .querySelectorAll("[data-open-search]")
  .forEach((button) =>
    button.addEventListener("click", () => openSearch(button)),
  );
document
  .querySelector("[data-close-search]")
  ?.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const b = dialog.getBoundingClientRect();
    if (
      event.clientX < b.left ||
      event.clientX > b.right ||
      event.clientY < b.top ||
      event.clientY > b.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener("close", () => lastTrigger?.focus());
input.addEventListener("input", renderSearch);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") results.querySelector("a")?.click();
  if (event.key === "ArrowDown") {
    event.preventDefault();
    results.querySelector("a")?.focus();
  }
});
document.addEventListener("keydown", (event) => {
  const editing =
    event.target instanceof HTMLElement &&
    (event.target.matches("input, textarea, select") ||
      event.target.isContentEditable);
  if (
    ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") ||
    (event.key === "/" && !editing)
  ) {
    event.preventDefault();
    openSearch(document.activeElement);
  }
});
const mobileMenu = document.querySelector(".mobile-menu");
document.addEventListener("click", (event) => {
  if (mobileMenu?.open && !mobileMenu.contains(event.target))
    mobileMenu.open = false;
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileMenu?.open) {
    mobileMenu.open = false;
    mobileMenu.querySelector("summary").focus();
  }
});

const sections = [...document.querySelectorAll(".prose section[id]")];
if ("IntersectionObserver" in window && sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;
      document.querySelectorAll(".toc nav a").forEach((link) => {
        if (link.hash === `#${visible.target.id}`)
          link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-100px 0px -60% 0px" },
  );
  sections.forEach((section) => observer.observe(section));
}
