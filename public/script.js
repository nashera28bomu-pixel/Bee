const hero = document.getElementById("hero");
const newsGrid = document.getElementById("newsGrid");
const tickerText = document.getElementById("tickerText");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");

let currentCategory = "general";

async function fetchNews(category = "general") {
  try {
    newsGrid.innerHTML = "<h2>Loading...</h2>";

    const response = await fetch(`/api/news?category=${category}`);

    const news = await response.json();

    renderHero(news[0]);
    renderTicker(news);
    renderNews(news.slice(1));
  } catch (err) {
    newsGrid.innerHTML = "<h2>Failed to load news</h2>";
  }
}

function renderHero(article) {
  hero.style.backgroundImage = `url(${article.image})`;

  hero.innerHTML = `
    <div class="heroContent">
      <h1>${article.title}</h1>
      <p>${article.description || "No description"}</p>
      <a href="${article.url}" target="_blank">
        Read Full Article
      </a>
    </div>
  `;
}

function renderTicker(news) {
  tickerText.innerHTML = news
    .slice(0, 10)
    .map(n => `🔥 ${n.title}`)
    .join(" | ");
}

function renderNews(news) {
  newsGrid.innerHTML = news
    .map(article => `
      <div class="card">
        <img src="${article.image}" />

        <div class="cardContent">
          <h3>${article.title}</h3>

          <p>${article.description || "No description available."}</p>

          <a href="${article.url}" target="_blank">
            Read More
          </a>
        </div>
      </div>
    `)
    .join("");
}

searchBtn.addEventListener("click", async () => {
  const query = searchInput.value;

  if (!query) return;

  const response = await fetch(`/api/search?q=${query}`);

  const results = await response.json();

  renderHero(results[0]);

  renderNews(results.slice(1));
});

const categoryButtons = document.querySelectorAll(".cat");

categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    categoryButtons.forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");

    currentCategory = btn.dataset.cat;

    fetchNews(currentCategory);
  });
});

fetchNews();

setInterval(() => {
  fetchNews(currentCategory);
}, 1000 * 60 * 5);
