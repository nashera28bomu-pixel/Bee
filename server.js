const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const Parser = require("rss-parser");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const parser = new Parser();

app.use(cors());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const CACHE_FILE = path.join(__dirname, "cache", "news.json");

let memoryCache = [];

async function fetchRSSNews() {
  try {
    const feed = await parser.parseURL(
      "https://feeds.bbci.co.uk/news/rss.xml"
    );

    return feed.items.slice(0, 20).map(item => ({
      title: item.title,
      description: item.contentSnippet,
      url: item.link,
      image:
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c",
      source: "BBC News",
      publishedAt: item.pubDate
    }));
  } catch (err) {
    console.log("RSS ERROR", err.message);
    return [];
  }
}

async function fetchAPInews(category = "general") {
  try {
    const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&apikey=${process.env.GNEWS_API_KEY}`;

    const response = await axios.get(url);

    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image:
        article.image ||
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c",
      source: article.source.name,
      publishedAt: article.publishedAt
    }));
  } catch (err) {
    console.log("API ERROR", err.message);
    return [];
  }
}

async function refreshNews() {
  console.log("Refreshing news cache...");

  const rssNews = await fetchRSSNews();
  const apiNews = await fetchAPInews();

  const merged = [...apiNews, ...rssNews];

  memoryCache = merged;

  fs.writeFileSync(CACHE_FILE, JSON.stringify(merged, null, 2));

  console.log("News cache updated");
}

if (!fs.existsSync("cache")) {
  fs.mkdirSync("cache");
}

if (!fs.existsSync(CACHE_FILE)) {
  fs.writeFileSync(CACHE_FILE, "[]");
}

refreshNews();

setInterval(refreshNews, 1000 * 60 * 10);

app.get("/api/news", async (req, res) => {
  try {
    const category = req.query.category || "general";

    if (category === "general") {
      return res.json(memoryCache);
    }

    const categoryNews = await fetchAPInews(category);

    res.json(categoryNews);
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch news"
    });
  }
});

app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.json([]);
    }

    const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&apikey=${process.env.GNEWS_API_KEY}`;

    const response = await axios.get(url);

    res.json(response.data.articles);
  } catch (err) {
    res.status(500).json({ error: "Search failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
