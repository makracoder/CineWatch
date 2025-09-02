# 🎬 CineWatch - Interactive Movie Recommender

A modern, responsive movie recommendation website that helps you find the perfect movie based on your mood, preferences, and company. Built with vanilla JavaScript and powered by the TMDB API.

## ✨ Features

### 🏠 Landing Page
- Beautiful hero section with animated movie cards
- Feature highlights showcasing the app's capabilities
- Smooth navigation to the recommender

### 🎯 Smart Recommendations
- **Genre Selection**: Choose from 16 different movie genres
- **Release Year Filter**: Filter by decade or era
- **Mood-Based Matching**: Happy, Sad, or Neutral moods
- **Social Context**: Recommendations for watching alone, with friends, family, or partner
- **Intelligent Filtering**: Combines multiple criteria for personalized results

### 💾 Favorites System
- Save your favorite movies locally
- Persistent storage using localStorage
- Easy management with add/remove functionality
- Dedicated favorites page with grid view

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Toggle between themes with persistent preference
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Smooth Animations**: Hover effects and transitions
- **Modal Details**: Rich movie information with trailers
- **Loading States**: Professional loading indicators

### 📱 Mobile-First Design
- Fully responsive across all devices
- Touch-friendly interface
- Optimized for mobile browsing

## 🚀 Quick Start

### 1. Get Your TMDB API Key

1. Visit [The Movie Database (TMDB)](https://www.themoviedb.org/)
2. Create a free account
3. Go to your [Account Settings](https://www.themoviedb.org/settings/api)
4. Request an API key for "Developer" use
5. Copy your API key

### 2. Configure the Application

1. Open `script.js` in your code editor
2. Find line 3: `const TMDB_API_KEY = 'YOUR_TMDB_API_KEY';`
3. Replace `'YOUR_TMDB_API_KEY'` with your actual API key
4. Save the file

### 3. Run the Application

Simply open `index.html` in your web browser! No build process or server setup required.

## 📁 File Structure

```
CineWatch/
├── index.html          # Landing page
├── recommend.html      # Movie recommender page
├── favorites.html      # Favorites page
├── style.css          # All styles and responsive design
├── script.js          # JavaScript functionality
└── README.md         # This file
```

## 🛠️ Technical Details

### Tech Stack
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: No frameworks, pure ES6+ JavaScript
- **TMDB API**: Movie data and recommendations
- **Font Awesome**: Icons and visual elements

### Key Features Implementation

#### API Integration
- Uses TMDB's `/discover/movie` endpoint
- Implements intelligent genre mapping based on mood and social context
- Fetches movie details including trailers
- Handles API errors gracefully

#### Local Storage
- Persistent theme preference
- Favorites management
- No server-side storage needed

#### Responsive Design
- Mobile-first approach
- CSS Grid for flexible layouts
- Media queries for different screen sizes
- Touch-friendly interactions

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (#6366f1)
- **Secondary**: Amber (#f59e0b)
- **Light Mode**: Clean whites and grays
- **Dark Mode**: Deep blues and slate colors

### Typography
- **Font**: Inter (system font fallback)
- **Weights**: 400, 500, 600, 700, 800
- **Responsive**: Scales appropriately on all devices

## 🔧 Customization

### Adding New Genres
1. Add genre checkbox in `recommend.html`
2. Update genre mapping in `script.js` `getMoodGenres()` function
3. Use TMDB genre IDs for accuracy

### Modifying Mood Mapping
Edit the `moodGenreMap` object in `script.js` to change how moods map to genres:

```javascript
const moodGenreMap = {
    happy: [35, 16, 10751], // Comedy, Animation, Family
    sad: [18], // Drama
    neutral: [53, 28, 99] // Thriller, Action, Documentary
};
```

### Styling Changes
All styles are in `style.css` with CSS custom properties for easy theming:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #f59e0b;
    /* ... other variables */
}
```

## 🌟 Advanced Features

### Smart Recommendations
The app uses intelligent filtering that combines:
- User-selected genres
- Mood-based genre suggestions
- Social context preferences
- Release year preferences

### Performance Optimizations
- Lazy loading for movie posters
- Efficient DOM manipulation
- Minimal API calls
- Optimized CSS animations

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios

## 🐛 Troubleshooting

### Common Issues

**Movies not loading?**
- Check your API key is correctly set in `script.js`
- Verify your internet connection
- Check browser console for error messages

**Favorites not saving?**
- Ensure localStorage is enabled in your browser
- Check for browser privacy settings blocking localStorage

**Styling issues?**
- Clear browser cache
- Check if all CSS files are loading properly

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the browser console for errors
3. Ensure your TMDB API key is valid and active

---

**Enjoy discovering amazing movies with CineWatch! 🎬✨**
