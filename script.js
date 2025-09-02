
// TMDB API Configuration
// Replace 'YOUR_TMDB_API_KEY' with your actual TMDB API key
const TMDB_API_KEY = 'ba2441b0df9de8d624a58bf663c44cab';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Global Variables
let currentMovie = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const recommendForm = document.getElementById('recommendForm');
const resultsSection = document.getElementById('resultsSection');
const loading = document.getElementById('loading');
const moviesGrid = document.getElementById('moviesGrid');
const movieModal = document.getElementById('movieModal');
const clearResults = document.getElementById('clearResults');
const emptyState = document.getElementById('emptyState');
const favoritesContent = document.getElementById('favoritesContent');
const favoritesGrid = document.getElementById('favoritesGrid');
const favoritesCount = document.getElementById('favoritesCount');
const clearAllFavorites = document.getElementById('clearAllFavorites');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    setupEventListeners();
    
    // Load favorites if on favorites page
    if (window.location.pathname.includes('favorites.html')) {
        loadFavorites();
    }
});

// Theme Management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.className = savedTheme === 'dark' ? 'dark-mode' : 'light-mode';
    updateThemeIcon();
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    document.body.className = isDark ? 'light-mode' : 'dark-mode';
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-mode');
    const icon = themeToggle.querySelector('i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Event Listeners
function setupEventListeners() {
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Form submission
    if (recommendForm) {
        recommendForm.addEventListener('submit', handleFormSubmission);
    }

    // Clear results
    if (clearResults) {
        clearResults.addEventListener('click', clearResultsSection);
    }

    // Clear all favorites
    if (clearAllFavorites) {
        clearAllFavorites.addEventListener('click', clearAllFavoritesHandler);
    }

    // Modal close
    const closeModal = document.querySelector('.close');
    if (closeModal) {
        closeModal.addEventListener('click', closeMovieModal);
    }

    // Close modal on outside click
    if (movieModal) {
        movieModal.addEventListener('click', function(e) {
            if (e.target === movieModal) {
                closeMovieModal();
            }
        });
    }
}

// Form Handling
async function handleFormSubmission(e) {
    e.preventDefault();

    const formData = new FormData(recommendForm);
    const filters = {
        genres: formData.getAll('genres'),
        releaseYear: formData.get('releaseYear'),
        mood: formData.get('mood'),
        watchingWith: formData.get('watchingWith')
    };

    // Validate form
    if (!validateForm(filters)) {
        return;
    }

    // Show loading and results section
    showLoading();
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });

    try {
        const movies = await fetchMovies(filters);
        console.log('Movies returned from fetchMovies:', movies.length);
        displayMovies(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        showError('Failed to fetch movies. Please try again.');
    } finally {
        hideLoading();
    }
}

function validateForm(filters) {
    // Check if a mood is selected
    if (!filters.mood) {
        alert('Please select a mood.');
        return false;
    }

    // Check if watching with is selected
    if (!filters.watchingWith) {
        alert('Please select who you\'re watching with.');
        return false;
    }

    // Genres are now optional - if none selected, we'll use mood-based suggestions
    return true;
}

// API Functions
async function fetchMovies(filters) {
    const params = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'en-US',
        sort_by: 'popularity.desc',
        include_adult: false,
        include_video: true,
        page: 1,
        'vote_count.gte': 50, // Lowered from 100 to 50
        'vote_average.gte': 5.5 // Lowered from 6.0 to 5.5
    });


    // Smart genre selection - prioritize user selections over mood suggestions
    let selectedGenres = [];
    if (filters.genres.length > 0) {
        selectedGenres = filters.genres;
    } else {
        selectedGenres = getMoodGenres(filters.mood, filters.watchingWith);
    }

    // Add genres to API request (limit to 3 genres max to avoid over-filtering)
    if (selectedGenres.length > 0) {
        const limitedGenres = selectedGenres.slice(0, 3);
        params.append('with_genres', limitedGenres.join(','));
    }

    // Add release date filter
    if (filters.releaseYear) {
        params.append('primary_release_date.gte', filters.releaseYear);
    }

    // Debug: Log the API request
    console.log('API Request:', `${TMDB_BASE_URL}/discover/movie?${params}`);

    const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${params}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Debug: Log the results
    console.log(`Found ${data.results.length} movies with current filters`);
    
    // If we get too few results, try with fewer restrictions
    if (data.results.length < 6) {
        console.log('Too few results, trying fallback...');
        const fallbackResults = await fetchMoviesWithFallback(filters);
        if (fallbackResults.length < 3) {
            console.log('Still too few results, getting popular movies without filters...');
            return await fetchPopularMovies();
        }
        return fallbackResults;
    }
    
    return data.results.slice(0, 12); // Limit to 12 movies
}

// Alternative: Get trending movies if no specific filters
async function fetchTrendingMovies() {
    const response = await fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.results.slice(0, 12);
}

// Get popular movies with minimal filters
async function fetchPopularMovies() {
    const params = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'en-US',
        sort_by: 'popularity.desc',
        include_adult: false,
        include_video: true,
        page: 1,
        'vote_count.gte': 10, // Very low vote count requirement
        'vote_average.gte': 4.5 // Very low rating requirement
    });

    console.log('Popular movies API Request:', `${TMDB_BASE_URL}/discover/movie?${params}`);

    const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${params}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Popular movies found ${data.results.length} movies`);
    return data.results.slice(0, 12);
}

async function fetchMoviesWithFallback(filters) {
    const params = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'en-US',
        sort_by: 'popularity.desc',
        include_adult: false,
        include_video: true,
        page: 1,
        'vote_count.gte': 20, // Much lower vote count requirement
        'vote_average.gte': 5.0 // Much lower rating requirement
    });

    // Use user-selected genres if present, otherwise use mood-based genres
    let fallbackGenres = [];
    if (filters.genres.length > 0) {
        fallbackGenres = filters.genres.slice(0, 2);
    } else {
        fallbackGenres = getMoodGenres(filters.mood, filters.watchingWith).slice(0, 2);
    }
    if (fallbackGenres.length > 0) {
        params.append('with_genres', fallbackGenres.join(','));
    }

    // Add release date filter
    if (filters.releaseYear) {
        params.append('primary_release_date.gte', filters.releaseYear);
    }

    console.log('Fallback API Request:', `${TMDB_BASE_URL}/discover/movie?${params}`);

    const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${params}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Fallback found ${data.results.length} movies`);
    return data.results.slice(0, 12);
}

function getMoodGenres(mood, watchingWith) {
    const moodGenreMap = {
        happy: [35, 16, 10751, 12], // Comedy, Animation, Family, Adventure
        sad: [18, 10749], // Drama, Romance
        neutral: [53, 28, 99, 878] // Thriller, Action, Documentary, Sci-Fi
    };
    const watchingWithGenreMap = {
        family: [10751, 16, 12], // Family, Animation, Adventure
        partner: [10749, 18, 35], // Romance, Drama, Comedy
        friends: [35, 28, 12, 53], // Comedy, Action, Adventure, Thriller
        alone: [53, 99, 878, 18] // Thriller, Documentary, Sci-Fi, Drama
    };
    let genres = [];
    if (typeof mood === 'string' && moodGenreMap[mood]) {
        genres = genres.concat(moodGenreMap[mood]);
    }
    if (watchingWithGenreMap[watchingWith]) {
        genres = genres.concat(watchingWithGenreMap[watchingWith]);
    }
    // Remove duplicates
    return [...new Set(genres)];
}

// Display Functions
// function displayMovies(movies) {
//     console.log('Displaying movies:', movies.length, 'movies');
//     console.log('Sample movies:', movies.slice(0, 3).map(m => m.title));
    
//     if (movies.length === 0) {
//         moviesGrid.innerHTML = '<p class="no-results">No movies found matching your criteria. Try adjusting your filters.</p>';
//         return;
//     }

//     const movieCardsHTML = movies.map(movie => createMovieCard(movie)).join('');
//     console.log('Generated HTML length:', movieCardsHTML.length);
//     console.log('Sample HTML:', movieCardsHTML.substring(0, 200) + '...');
    
//     moviesGrid.innerHTML = movieCardsHTML;
    
//     // Add event listeners to movie cards
//     addMovieCardListeners();
    
//     // Check if movies are actually in the DOM
//     const actualCards = document.querySelectorAll('.movie-card');
//     console.log('Actual movie cards in DOM:', actualCards.length);
// }


// Example: After fetching movies from API
function displayMovies(movies) {
    const moviesGrid = document.getElementById('moviesGrid');
    const resultsSection = document.getElementById('resultsSection');
    if (movies.length > 0) {
        const movieCardsHTML = movies.map(movie => createMovieCard(movie)).join('');
        moviesGrid.innerHTML = movieCardsHTML;
        addMovieCardListeners();
        resultsSection.style.display = 'block';
    } else {
        moviesGrid.innerHTML = '<p>No movies found.</p>';
        resultsSection.style.display = 'block';
    }
}

function createMovieCard(movie) {
    const isFavorited = favorites.some(fav => fav.id === movie.id);
    const posterPath = movie.poster_path 
        ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
        : 'https://via.placeholder.com/300x450/6366f1/ffffff?text=No+Poster';
    
    return `
        <div class="movie-card" data-movie-id="${movie.id}">
            <img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${new Date(movie.release_date).getFullYear()}</span>
                    <span class="movie-rating">
                        <i class="fas fa-star"></i>
                        ${movie.vote_average.toFixed(1)}
                    </span>
                </div>
                <div class="movie-actions">
                    <button class="info-btn" onclick="showMovieDetails(${movie.id})">
                        <i class="fas fa-info-circle"></i>
                        More Info
                    </button>
                    <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite(${movie.id})">
                        <i class="fas fa-heart"></i>
                        ${isFavorited ? 'Remove' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function addMovieCardListeners() {
    const movieCards = document.querySelectorAll('.movie-card');
    movieCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('button')) {
                const movieId = this.dataset.movieId;
                showMovieDetails(movieId);
            }
        });
    });
}

// Movie Details Modal
async function showMovieDetails(movieId) {
    try {
        const movie = await fetchMovieDetails(movieId);
        currentMovie = movie;
        displayMovieModal(movie);
        movieModal.style.display = 'block';
    } catch (error) {
        console.error('Error fetching movie details:', error);
        alert('Failed to load movie details.');
    }
}

async function fetchMovieDetails(movieId) {
    const response = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=videos`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

function displayMovieModal(movie) {
    const posterPath = movie.poster_path 
        ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
        : 'https://via.placeholder.com/300x450/6366f1/ffffff?text=No+Poster';
    
    const isFavorited = favorites.some(fav => fav.id === movie.id);
    
    document.getElementById('modalPoster').src = posterPath;
    document.getElementById('modalTitle').textContent = movie.title;
    document.getElementById('modalYear').textContent = new Date(movie.release_date).getFullYear();
    document.getElementById('modalRating').textContent = `★ ${movie.vote_average.toFixed(1)}`;
    document.getElementById('modalRuntime').textContent = `${movie.runtime} min`;
    document.getElementById('modalOverview').textContent = movie.overview || 'No overview available.';
    
    // Update favorite button
    const favoriteBtn = document.getElementById('modalFavoriteBtn');
    if (favoriteBtn) {
        favoriteBtn.className = `favorite-btn ${isFavorited ? 'favorited' : ''}`;
        favoriteBtn.innerHTML = `<i class="fas fa-heart"></i>${isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}`;
        favoriteBtn.onclick = () => toggleFavorite(movie.id);
    }

    // Update trailer button
    const trailerBtn = document.getElementById('trailerBtn');
    if (trailerBtn) {
        const trailer = movie.videos?.results?.find(video => video.type === 'Trailer');
        if (trailer) {
            trailerBtn.onclick = () => openTrailer(trailer.key);
        } else {
            trailerBtn.style.display = 'none';
        }
    }

    // Update remove button for favorites page
    const removeBtn = document.getElementById('modalRemoveBtn');
    if (removeBtn) {
        removeBtn.onclick = () => removeFromFavorites(movie.id);
    }
}

function closeMovieModal() {
    movieModal.style.display = 'none';
    currentMovie = null;
}

function openTrailer(trailerKey) {
    window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank');
}

// Favorites Management
function toggleFavorite(movieId) {
    const movie = currentMovie || getMovieFromGrid(movieId);
    
    if (!movie) {
        console.error('Movie not found');
        return;
    }

    const existingIndex = favorites.findIndex(fav => fav.id === movieId);
    
    if (existingIndex >= 0) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        updateFavoriteButton(movieId, false);
    } else {
        // Add to favorites
        favorites.push({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            vote_average: movie.vote_average,
            overview: movie.overview
        });
        updateFavoriteButton(movieId, true);
    }

    // Save to localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    
    // Update favorites count if on favorites page
    if (favoritesCount) {
        updateFavoritesCount();
    }
}

function getMovieFromGrid(movieId) {
    // This is a fallback - in a real app, you'd store movie data differently
    const movieCard = document.querySelector(`[data-movie-id="${movieId}"]`);
    if (movieCard) {
        return {
            id: parseInt(movieId),
            title: movieCard.querySelector('.movie-title').textContent,
            poster_path: null, // Would need to extract from img src
            release_date: new Date().toISOString(),
            vote_average: 0,
            overview: ''
        };
    }
    return null;
}

function updateFavoriteButton(movieId, isFavorited) {
    const buttons = document.querySelectorAll(`[data-movie-id="${movieId}"] .favorite-btn, #modalFavoriteBtn`);
    buttons.forEach(button => {
        button.className = `favorite-btn ${isFavorited ? 'favorited' : ''}`;
        button.innerHTML = `<i class="fas fa-heart"></i>${isFavorited ? 'Remove' : 'Add'}`;
    });
}

// Favorites Page Functions
function loadFavorites() {
    if (favorites.length === 0) {
        showEmptyState();
    } else {
        showFavoritesContent();
        displayFavorites();
    }
}

function showEmptyState() {
    if (emptyState) emptyState.style.display = 'block';
    if (favoritesContent) favoritesContent.style.display = 'none';
}

function showFavoritesContent() {
    if (emptyState) emptyState.style.display = 'none';
    if (favoritesContent) favoritesContent.style.display = 'block';
    updateFavoritesCount();
}

function displayFavorites() {
    if (!favoritesGrid) return;
    
    favoritesGrid.innerHTML = favorites.map(movie => createFavoriteCard(movie)).join('');
    addMovieCardListeners();
}

function createFavoriteCard(movie) {
    const posterPath = movie.poster_path 
        ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
        : 'https://via.placeholder.com/300x450/6366f1/ffffff?text=No+Poster';
    
    return `
        <div class="movie-card" data-movie-id="${movie.id}">
            <img src="${posterPath}" alt="${movie.title}" class="movie-poster" loading="lazy">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <div class="movie-meta">
                    <span>${new Date(movie.release_date).getFullYear()}</span>
                    <span class="movie-rating">
                        <i class="fas fa-star"></i>
                        ${movie.vote_average.toFixed(1)}
                    </span>
                </div>
                <div class="movie-actions">
                    <button class="info-btn" onclick="showMovieDetails(${movie.id})">
                        <i class="fas fa-info-circle"></i>
                        More Info
                    </button>
                    <button class="favorite-btn favorited" onclick="removeFromFavorites(${movie.id})">
                        <i class="fas fa-trash"></i>
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `;
}

function removeFromFavorites(movieId) {
    const index = favorites.findIndex(fav => fav.id === movieId);
    if (index >= 0) {
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        
        // Remove from grid
        const movieCard = document.querySelector(`[data-movie-id="${movieId}"]`);
        if (movieCard) {
            movieCard.remove();
        }
        
        // Close modal if open
        if (movieModal.style.display === 'block') {
            closeMovieModal();
        }
        
        // Update count and check if empty
        updateFavoritesCount();
        if (favorites.length === 0) {
            showEmptyState();
        }
    }
}

function clearAllFavoritesHandler() {
    if (confirm('Are you sure you want to remove all favorites?')) {
        favorites = [];
        localStorage.removeItem('favorites');
        showEmptyState();
    }
}

function updateFavoritesCount() {
    if (favoritesCount) {
        favoritesCount.textContent = favorites.length;
    }
}

// Utility Functions
function showLoading() {
    if (loading) {
        loading.style.display = 'block';
        moviesGrid.style.display = 'none';
    }
}

function hideLoading() {
    if (loading) {
        loading.style.display = 'none';
        moviesGrid.style.display = 'grid';
    }
}

function clearResultsSection() {
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    if (recommendForm) {
        recommendForm.reset();
    }
}

function showError(message) {
    if (moviesGrid) {
        moviesGrid.innerHTML = `<p class="error-message">${message}</p>`;
    }
}

// Add some CSS for error and no results messages
const style = document.createElement('style');
style.textContent = `
    .error-message, .no-results {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-secondary);
        font-size: 1.1rem;
    }
    
    .error-message {
        color: #ef4444;
    }
`;
document.head.appendChild(style);

// Test function to check API directly
window.testAPI = async function() {
    console.log('Testing API directly...');
    
    // Test 1: Popular movies with no filters
    const popularParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'en-US',
        sort_by: 'popularity.desc',
        include_adult: false,
        page: 1
    });
    
    try {
        const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${popularParams}`);
        const data = await response.json();
        console.log(`✅ Popular movies (no filters): ${data.results.length} movies found`);
        console.log('Sample movies:', data.results.slice(0, 3).map(m => m.title));
    } catch (error) {
        console.error('❌ Error testing popular movies:', error);
    }
    
    // Test 2: Action movies
    const actionParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        language: 'en-US',
        sort_by: 'popularity.desc',
        include_adult: false,
        page: 1,
        with_genres: '28' // Action
    });
    
    try {
        const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${actionParams}`);
        const data = await response.json();
        console.log(`✅ Action movies: ${data.results.length} movies found`);
        console.log('Sample action movies:', data.results.slice(0, 3).map(m => m.title));
    } catch (error) {
        console.error('❌ Error testing action movies:', error);
    }
};

// Test function to force display movies
window.testDisplay = function() {
    console.log('Testing display function...');
    
    // Create some test movies
    const testMovies = [
        {
            id: 1,
            title: "Test Movie 1",
            poster_path: null,
            release_date: "2023-01-01",
            vote_average: 7.5
        },
        {
            id: 2,
            title: "Test Movie 2", 
            poster_path: null,
            release_date: "2023-01-02",
            vote_average: 8.0
        },
        {
            id: 3,
            title: "Test Movie 3",
            poster_path: null,
            release_date: "2023-01-03",
            vote_average: 6.5
        }
    ];
    
    console.log('Testing with', testMovies.length, 'movies');
    displayMovies(testMovies);
};
