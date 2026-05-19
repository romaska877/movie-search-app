const API_KEY = "2bce3c31";
const API_URL = "https://www.omdbapi.com/";

const themeToggle = document.getElementById("themeToggle");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");
const movieGrid = document.getElementById("movieGrid");
const tabButtons = document.querySelectorAll(".tab-btn");
const movieModal = document.getElementById("movieModal");
const modalClose = document.getElementById("modalClose");
const modalBody = document.getElementById("modalBody");

let currentMovies = [];
let favorites = JSON.parse(localStorage.getItem("movieFavorites")) || [];
let activeTab = "results";

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  themeToggle.textContent = document.body.classList.contains("light") ? "Dark" : "Light";
});

function saveFavorites() {
  localStorage.setItem("movieFavorites", JSON.stringify(favorites));
}

function isFavorite(imdbID) {
  return favorites.some((movie) => movie.imdbID === imdbID);
}

async function fetchMovies(searchTerm) {
  message.textContent = "Searching movies...";
  movieGrid.innerHTML = "";

  try {
    const response = await fetch(`${API_URL}?apikey=${API_KEY}&s=${searchTerm}`);
    const data = await response.json();

    if (data.Response === "False") {
      throw new Error(data.Error);
    }

    currentMovies = data.Search;
    activeTab = "results";
    updateTabs();
    renderMovies(currentMovies);
    message.textContent = "";
  } catch (error) {
    message.textContent = error.message;
    movieGrid.innerHTML = `<p class="empty-state">No movies found.</p>`;
  }
}

async function fetchMovieDetails(imdbID) {
  const response = await fetch(`${API_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
  const data = await response.json();

  if (data.Response === "False") {
    throw new Error(data.Error);
  }

  return data;
}

function renderMovies(movies) {
  movieGrid.innerHTML = "";

  if (movies.length === 0) {
    movieGrid.innerHTML = `<p class="empty-state">No movies to show.</p>`;
    return;
  }

  movies.forEach((movie) => {
    const poster =
      movie.Poster !== "N/A"
        ? `<img src="${movie.Poster}" alt="${movie.Title} poster">`
        : `<div class="no-poster">No Poster Available</div>`;

    const movieCard = document.createElement("article");
    movieCard.className = "movie-card";

    movieCard.innerHTML = `
      <div class="poster-wrap">
        ${poster}
        <span class="rating-pill">${movie.Type}</span>
      </div>

      <div class="movie-body">
        <h3>${movie.Title}</h3>
        <p>${movie.Year}</p>

        <div class="movie-actions">
          <button class="details-btn" data-id="${movie.imdbID}">Details</button>
          <button class="favorite-btn ${isFavorite(movie.imdbID) ? "active" : ""}" data-id="${movie.imdbID}">
            ${isFavorite(movie.imdbID) ? "★" : "☆"}
          </button>
        </div>
      </div>
    `;

    movieGrid.appendChild(movieCard);
  });
}

function updateTabs() {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === activeTab);
  });
}

function toggleFavorite(movie) {
  if (isFavorite(movie.imdbID)) {
    favorites = favorites.filter((fav) => fav.imdbID !== movie.imdbID);
  } else {
    favorites.push(movie);
  }

  saveFavorites();

  if (activeTab === "favorites") {
    renderMovies(favorites);
  } else {
    renderMovies(currentMovies);
  }
}

async function openMovieModal(imdbID) {
  try {
    modalBody.innerHTML = `<p class="empty-state">Loading movie details...</p>`;
    movieModal.classList.add("show");

    const movie = await fetchMovieDetails(imdbID);

    const poster =
      movie.Poster !== "N/A"
        ? `<img src="${movie.Poster}" alt="${movie.Title} poster">`
        : `<div class="no-poster">No Poster Available</div>`;

    modalBody.innerHTML = `
      <div class="modal-movie">
        <div>${poster}</div>

        <div>
          <h2>${movie.Title}</h2>
          <p class="modal-meta">
            ${movie.Year} • ${movie.Runtime} • ${movie.Genre}
          </p>
          <p class="modal-meta">
            IMDb Rating: ${movie.imdbRating} / 10
          </p>
          <p class="modal-plot">${movie.Plot}</p>
        </div>
      </div>
    `;
  } catch (error) {
    modalBody.innerHTML = `<p class="empty-state">${error.message}</p>`;
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const searchTerm = searchInput.value.trim();

  if (searchTerm === "") {
    message.textContent = "Please enter a movie name.";
    return;
  }

  fetchMovies(searchTerm);
});

movieGrid.addEventListener("click", async (event) => {
  const imdbID = event.target.dataset.id;

  if (!imdbID) return;

  const movie =
    currentMovies.find((item) => item.imdbID === imdbID) ||
    favorites.find((item) => item.imdbID === imdbID);

  if (event.target.classList.contains("details-btn")) {
    openMovieModal(imdbID);
  }

  if (event.target.classList.contains("favorite-btn")) {
    toggleFavorite(movie);
  }
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeTab = button.dataset.tab;
    updateTabs();

    if (activeTab === "results") {
      renderMovies(currentMovies);
    } else {
      renderMovies(favorites);
    }
  });
});

modalClose.addEventListener("click", () => {
  movieModal.classList.remove("show");
});

movieModal.addEventListener("click", (event) => {
  if (event.target === movieModal) {
    movieModal.classList.remove("show");
  }
});

renderMovies(currentMovies);