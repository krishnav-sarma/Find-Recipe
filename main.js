const SEARCH_API_URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
const RANDOM_API_URL = "https://www.themealdb.com/api/json/v1/1/random.php";
const LOOKUP_API_URL = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=";

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsGrid = document.getElementById("results-grid");
const favoritesGrid = document.getElementById("favorites-grid");
const messageArea = document.getElementById("message-area");
const randomButton = document.getElementById("random-button");
const favoritesButton = document.getElementById("favorites-button");
const modal = document.getElementById("recipe-modal");
const modalContent = document.getElementById("recipe-details-content");
const modalCloseBtn = document.getElementById("modal-close-btn");

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const searchTerm = searchInput.value.trim();

  if (searchTerm) {
    searchRecipes(searchTerm);
  } else {
    showMessage("Please enter a search term", true);
  }
});

async function searchRecipes(query) {
  showMessage(`Searching for "${query}"...`, false, true);
  resultsGrid.innerHTML = "";
  favoritesGrid.classList.add("hidden");
  resultsGrid.classList.remove("hidden");
  favoritesButton.textContent = "My Favorites";

  try {
    const response = await fetch(`${SEARCH_API_URL}${query}`);
    if (!response.ok) throw new Error("Network error");

    const data = await response.json();
    clearMessage();
    console.log("data: ", data);

    if (data.meals) {
      displayRecipes(data.meals);
    } else {
      showMessage(`No recipes found for "${query}"`);
    }
  } catch (error) {
    showMessage("Something went wrong, Please try again.", true);
  }
}

function showMessage(message, isError = false, isLoading = false) {
  messageArea.textContent = message;
  messageArea.className = "message";
  if (isError) messageArea.classList.add("error");
  if (isLoading) messageArea.classList.add("loading");
}

function clearMessage() {
  messageArea.textContent = "";
  messageArea.className = "message";
}

function displayRecipes(recipes) {
  if (!recipes || recipes.length === 0) {
    showMessage("No recipes to display");
    return;
  }

  const favorites = JSON.parse(localStorage.getItem("recipeFavorites")) || {};
  const userFavorites = favorites["defaultUser"] || [];

  resultsGrid.innerHTML = "";

  recipes.forEach((recipe) => {
    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("recipe-item");
    recipeDiv.dataset.id = recipe.idMeal;

    const isFavorite = userFavorites.some(fav => fav.idMeal === recipe.idMeal);

    recipeDiv.innerHTML = `
      <button class="favorite-star ${isFavorite ? 'active' : ''}">★</button>
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy">
      <h3>${recipe.strMeal}</h3>
    `;

    resultsGrid.appendChild(recipeDiv);
  });

  // Add event listeners to the stars
  document.querySelectorAll(".favorite-star").forEach(star => {
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      const recipeItem = e.target.closest(".recipe-item");
      const recipeId = recipeItem.dataset.id;
      const recipe = recipes.find(r => r.idMeal === recipeId);
      
      const wasAdded = manageFavorites(recipeId, recipe);
      e.target.classList.toggle("active", wasAdded);
      showFavoriteNotification(wasAdded ? "Added to favorites!" : "Removed from favorites");
    });
  });
}

randomButton.addEventListener("click", getRandomRecipe);

async function getRandomRecipe() {
  showMessage("Fetching a random recipe...", false, true);
  resultsGrid.innerHTML = "";
  favoritesGrid.classList.add("hidden");
  resultsGrid.classList.remove("hidden");
  favoritesButton.textContent = "My Favorites";

  try {
    const response = await fetch(RANDOM_API_URL);
    if (!response.ok) throw new Error("Something went wrong.");
    const data = await response.json();

    clearMessage();

    if (data.meals && data.meals.length > 0) {
      displayRecipes(data.meals);
    } else {
      showMessage("Could not fetch a random recipe. Please try again.", true);
    }
  } catch (error) {
    showMessage(
      "Failed to fetch a random recipe. Please check your connection and try again.",
      true
    );
  }
}

favoritesButton.addEventListener("click", toggleFavoritesView);

function toggleFavoritesView() {
  resultsGrid.classList.toggle("hidden");
  favoritesGrid.classList.toggle("hidden");
  
  if (!favoritesGrid.classList.contains("hidden")) {
    displayFavorites();
    favoritesButton.textContent = "Back to Results";
  } else {
    favoritesButton.textContent = "My Favorites";
  }
}

function manageFavorites(recipeId, recipeData = null) {
  let favorites = JSON.parse(localStorage.getItem("recipeFavorites")) || {};
  const userId = "defaultUser"; // In a real app, you'd have user authentication

  if (!favorites[userId]) {
    favorites[userId] = [];
  }

  const userFavorites = favorites[userId];
  const index = userFavorites.findIndex(fav => fav.idMeal === recipeId);

  if (index === -1) {
    // Add to favorites
    if (recipeData) {
      userFavorites.push(recipeData);
    }
  } else {
    // Remove from favorites
    userFavorites.splice(index, 1);
  }

  localStorage.setItem("recipeFavorites", JSON.stringify(favorites));
  return index === -1; // Returns true if added, false if removed
}

function displayFavorites() {
  const favorites = JSON.parse(localStorage.getItem("recipeFavorites")) || {};
  const userFavorites = favorites["defaultUser"] || [];
  
  favoritesGrid.innerHTML = "";

  if (userFavorites.length === 0) {
    favoritesGrid.innerHTML = '<p class="message">You have no favorite recipes yet!</p>';
    return;
  }

  userFavorites.forEach((recipe) => {
    const recipeDiv = document.createElement("div");
    recipeDiv.classList.add("recipe-item");
    recipeDiv.dataset.id = recipe.idMeal;

    recipeDiv.innerHTML = `
      <button class="favorite-star active">★</button>
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" loading="lazy">
      <h3>${recipe.strMeal}</h3>
    `;

    favoritesGrid.appendChild(recipeDiv);
  });

  // Add event listeners to the stars in favorites view
  document.querySelectorAll("#favorites-grid .favorite-star").forEach(star => {
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      const recipeItem = e.target.closest(".recipe-item");
      const recipeId = recipeItem.dataset.id;
      
      manageFavorites(recipeId);
      recipeItem.remove();
      showFavoriteNotification("Removed from favorites");
      
      if (favoritesGrid.children.length === 0) {
        favoritesGrid.innerHTML = '<p class="message">You have no favorite recipes yet!</p>';
      }
    });
  });

  // Add click handler for recipe items in favorites
  favoritesGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".recipe-item");
    if (card && !e.target.classList.contains("favorite-star")) {
      const recipeId = card.dataset.id;
      getRecipeDetails(recipeId);
    }
  });
}

function showFavoriteNotification(message) {
  const notification = document.createElement("div");
  notification.className = "favorite-notification";
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 500);
  }, 2000);
}

function showModal() {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

resultsGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".recipe-item");
  if (card && !e.target.classList.contains("favorite-star")) {
    const recipeId = card.dataset.id;
    getRecipeDetails(recipeId);
  }
});

async function getRecipeDetails(id) {
  modalContent.innerHTML = '<p class="message loading">Loading details...</p>';
  showModal();

  try {
    const response = await fetch(`${LOOKUP_API_URL}${id}`);
    if (!response.ok) throw new Error("Failed to fetch recipe details.");
    const data = await response.json();

    console.log("details: ", data);
    if (data.meals && data.meals.length > 0) {
      displayRecipeDetails(data.meals[0]);
    } else {
      modalContent.innerHTML =
        '<p class="message error">Could not load recipe details.</p>';
    }
  } catch (error) {
    modalContent.innerHTML =
      '<p class="message error">Failed to load recipe details. Check your connection or try again.</p>';
  }
}

modalCloseBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

function displayRecipeDetails(recipe) {
  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = recipe[`strIngredient${i}`]?.trim();
    const measure = recipe[`strMeasure${i}`]?.trim();

    if (ingredient) {
      ingredients.push(`<li>${measure ? `${measure} ` : ""}${ingredient}</li>`);
    } else {
      break;
    }
  }

  const categoryHTML = recipe.strCategory
    ? `<h3>Category: ${recipe.strCategory}</h3>`
    : "";
  const areaHTML = recipe.strArea ? `<h3>Area: ${recipe.strArea}</h3>` : "";
  const ingredientsHTML = ingredients.length
    ? `<h3>Ingredients</h3><ul>${ingredients.join("")}</ul>`
    : "";
  const instructionsHTML = `<h3>Instructions</h3><p>${
    recipe.strInstructions
      ? recipe.strInstructions.replace(/\r?\n/g, "<br>")
      : "Instructions not available."
  }</p>`;
  const youtubeHTML = recipe.strYoutube
    ? `<h3>Video Recipe</h3><div class="video-wrapper"><a href="${recipe.strYoutube}" target="_blank">Watch on YouTube</a><div>`
    : "";
  const sourcHTML = recipe.strSource
    ? `<div class="source-wrapper"><a href="${recipe.strSource}" target="_blank">View Original Source</a></div>`
    : "";

  modalContent.innerHTML = `
  <div class="recipe-header">
    <h2>${recipe.strMeal}</h2>
  </div>
  <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
  ${categoryHTML}
  ${areaHTML}
  ${ingredientsHTML}
  ${instructionsHTML}
  ${youtubeHTML}
  ${sourcHTML}
  `;
}

  // Add event listener for the modal favorite button
  document.getElementById("modal-favorite-btn").addEventListener("click", (e) => {
    const wasAdded = manageFavorites(recipe.idMeal, recipe);
    e.target.classList.toggle("active", wasAdded);
    showFavoriteNotification(wasAdded ? "Added to favorites!" : "Removed from favorites");
  });
