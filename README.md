# TravelGuideAI

TravelGuideAI is an intelligent travel assistant application powered by Google's Gemini API. It offers personalized itinerary planning, travel agency management tools, content creation for travel blogs, and a conversational AI assistant with visual recognition capabilities.

## Features

- **Trip Planner**: Generate detailed day-by-day itineraries based on destination, duration, budget, and interests. Includes Google Maps Grounding to provide real, clickable location links.
- **Agency Portal**: A dedicated dashboard for travel agents to manage client requests and generate professional itineraries automatically.
- **Content Creator**: Tools for travel bloggers to generate SEO-optimized articles grounded in real-time Google Search data.
- **AI Assistant**: A floating chatbot that can answer travel questions and analyze uploaded photos of landmarks or locations.
- **User History**: Saves generated itineraries and content locally for easy access.

## Technologies Used

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **AI**: Google GenAI SDK (`@google/genai`)
- **Models Used**:
  - `gemini-2.5-flash` (Itinerary & Maps Grounding)
  - `gemini-3-flash-preview` (Content Creation, Chat, Search Grounding)
- **Icons**: Lucide React

## Setup & Installation

### Prerequisites

- Node.js (v18 or higher)
- A Google Cloud Project with the Gemini API enabled
- An API Key from Google AI Studio

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/travel-guide-ai.git
   cd travel-guide-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   API_KEY=your_google_api_key_here
   ```
   *Note: Ensure your bundler (like Vite) is configured to expose this variable or replace `process.env.API_KEY` in `services/geminiService.ts` with your key mechanism.*

4. **Run Locally**
   ```bash
   npm start
   # or
   npm run dev
   ```

## Usage Guide

1. **Individual Mode**: Enter your destination, budget, and interests to get a full itinerary. Click on the "Map View" tab to see locations.
2. **Agency Mode**: Switch to the Agency Portal to view sample client requests. Click "Generate Plan" to create professional responses.
3. **Content Mode**: Use the Content Creator to generate blog posts. The AI uses Google Search to find up-to-date information.
4. **Chat**: Click the floating chat bubble to talk to the AI. You can upload photos of places to get information about them.

## License

MIT