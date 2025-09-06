# The Darknet District

## Overview

The Darknet District is a cyberpunk-themed interactive website featuring a dystopian digital underground aesthetic. The project combines entertainment, educational resources, and community features with a focus on cybersecurity, privacy, hacking culture, and digital resistance themes. The site includes interactive games, chat functionality with an AI character named Iris, educational resource sections, and e-commerce integrations for cyberpunk-themed merchandise and security tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built as a static multi-page website using vanilla HTML, CSS, and JavaScript with a cyberpunk aesthetic theme. Key architectural decisions include:

- **Static Site Structure**: All pages are standalone HTML files with shared CSS styling, enabling fast loading and easy deployment
- **Modular CSS Design**: Centralized styling in `style.css` with consistent cyberpunk theming (green terminal colors, monospace fonts, scanline effects)
- **Progressive Enhancement**: Core functionality works without JavaScript, with enhanced features layered on top
- **Responsive Design**: Mobile-first approach with viewport meta tags and responsive grid layouts

### Backend Architecture
The backend uses a Flask-based Python server providing API endpoints for chat functionality:

- **Flask Web Server**: Lightweight Python server handling HTTP requests and serving static files
- **Session Management**: In-memory session storage for chat conversations and user state
- **AI Integration**: OpenAI GPT integration for the Iris chatbot character with custom personality and responses
- **CORS Configuration**: Enabled for cross-origin requests to support frontend-backend communication

### Chat System Design
The chat functionality features an AI character named Iris with sophisticated interaction patterns:

- **Contextual Responses**: AI maintains character consistency with cyberpunk personality traits
- **Distraction System**: Venue-specific interruptions to simulate busy environment
- **Special Triggers**: Developer tools detection and rebellion mode activation
- **Rate Limiting**: Built-in conversation pacing and session management

### Game Integration
The site includes a custom 2D pixel art game called "Blackout Protocol":

- **Canvas-based Rendering**: HTML5 canvas for pixel-perfect game graphics
- **Modular Game Engine**: Shared engine code across multiple game levels
- **Session Persistence**: Browser storage for game progress and leaderboards
- **Asset Management**: Organized sprite sheets and background images

### Navigation and User Experience
The site employs a hub-and-spoke navigation model:

- **Central Hub**: Main index page serves as entry point to all sections
- **Resource Categories**: Organized sections for OSINT, OPSEC, legal resources, etc.
- **Interactive Elements**: Hover effects, terminal-style animations, and glitch aesthetics
- **Accessibility Features**: Keyboard navigation support and screen reader compatibility

## External Dependencies

### Third-Party Services
- **OpenAI API**: GPT model integration for Iris chatbot functionality requiring API key configuration
- **Google Analytics**: Website traffic tracking and user behavior analysis
- **Firebase Authentication**: User login and session management (partially implemented)
- **Shopify Integration**: E-commerce functionality for merchandise sales

### Development Tools
- **Python Flask**: Backend web framework for API endpoints and static file serving
- **Node.js Canvas**: Server-side image processing for game asset generation
- **BeautifulSoup**: Web scraping for product data aggregation from external stores
- **CORS**: Cross-origin resource sharing for frontend-backend communication

### Asset Dependencies
- **HAK5 Product Data**: External product information scraped from HAK5 store
- **Cyberpunk Graphics**: Custom pixel art assets and background images
- **Font Assets**: Monospace fonts for terminal aesthetic consistency

### Security and Privacy Tools
The site references and integrates with various privacy and security tools:

- **VPN Services**: Links to privacy-focused VPN providers
- **Secure Communication**: References to encrypted messaging platforms
- **OSINT Tools**: Educational links to open source intelligence resources
- **Digital Security**: Educational content about operational security practices