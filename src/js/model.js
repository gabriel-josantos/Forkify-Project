import { async } from 'regenerator-runtime';
import { API_URL, RES_PER_PAGE, KEY, SPOON_KEY } from './config.js';
import { AJAX } from './helpers.js';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    resultsPerPage: RES_PER_PAGE,
    page: 1,
  },
  bookmarks: [],
};

function createRecipeObject(data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    calories: recipe.calories,
    ...(recipe.key && { key: recipe.key }),
  };
}

export async function loadCalories(data) {
  try {
    const des = state.recipe.ingredients.map(ing => {
      const cutIng = ing.description.split(' ');
      cutIng.splice(-1);
      return cutIng.join(' ');
    });
    console.log(des);

    const calArr = await state.recipe.ingredients.map(async function (ing) {
      //const query = 'sour cream';
      const res1 = await fetch(
        `https://api.spoonacular.com/food/ingredients/search?query=${ing.description}&apiKey=${SPOON_KEY}`
      );
      const data1 = await res1.json();

      const ingID = data1.results[0]?.id ? data1.results[0]?.id : 1026;
      const res2 = await fetch(
        `https://api.spoonacular.com/food/ingredients/${ingID}/information?amount=${ing.quantity}&unit=${ing.unit}&apiKey=${SPOON_KEY}`
      );
      const data2 = await res2.json();
      const calories = data2.nutrition.nutrients.filter(
        nut => nut.name === 'Calories'
      );
      return calories[0].amount;
    });
    //const calArr = [45, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20];
    state.recipe.ingredients.map((ing, i) => (ing.calories = calArr[i]));
    const totalCal = calArr.reduce((acc, cur) => acc + cur);
    state.recipe.totalCalories = totalCal;
    console.log(calArr.resolve());

    console.log(state.recipe.ingredients);
  } catch (err) {
    console.log(err);
  }
}

export async function loadRecipe(id) {
  try {
    const data = await AJAX(`${API_URL}${id}?key=${KEY}`);
    state.recipe = createRecipeObject(data);

    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;
  } catch (err) {
    console.error(`${err} ☢ ☢ ☢ ☢`);
    throw err;
  }
}

export async function loadSearchResults(query) {
  try {
    state.search.query = query;
    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);
    if (data.results === 0) throw new Error();
    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      };
    });
    state.search.page = 1;
  } catch (err) {
    console.error(`${err} ☢ ☢ ☢ ☢`);
    throw err;
  }
}

export function getSearchResultsPage(page = state.search.page) {
  state.search.page = page;
  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;
  //console.log(state.search.results.slice(start, end));
  return state.search.results.slice(start, end);
}

export function udpateServings(newServings) {
  state.recipe.ingredients.forEach(ing => {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
  });
  state.recipe.servings = newServings;
}

function persistBookmarks() {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
}

export function addBookmark(recipe) {
  //Add bookmark
  state.bookmarks.push(recipe);

  // Mark current crecipe as bookmark
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;
  persistBookmarks();
}

export function deleteBookmark(id) {
  //Delete bookmark
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);

  if (id === state.recipe.id) state.recipe.bookmarked = false;
  persistBookmarks();
}

function init() {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmarks = JSON.parse(storage);
}
init();
function clearBookmarks() {
  localStorage.clear('bookmarks');
}
//clearBookmarks();

export async function uploadRecipe(newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(el => el.trim());
        //const ingArr = ing[1].replaceAll(' ', '').split(',');
        if (ingArr.length !== 3)
          throw new Error(
            'Wrong ingredient format!, please use the correct format  :)'
          );
        const [quantity, unit, description] = ingArr;
        return { quantity: quantity ? +quantity : null, unit, description };
      });
    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };

    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
}
