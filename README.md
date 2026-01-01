# Hawkins Neural Persona Matrix

<video src="matrix_strangerthings.mp4" controls></video>

> **Infinite character variants from the Stranger Things universe, reimagined through the Hawkins Lab neural rendering engine.**

## Overview

The Hawkins Neural Persona Matrix is an AI-powered web application that generates unique temporal variants of Stranger Things characters. Using Google's Gemini AI, the app transforms beloved characters into completely reimagined personas across different eras, professions, and scenarios while maintaining their core identity and facial features.

## How It Works

### The Neural Engine

The application leverages two powerful AI models from Google's Gemini family:

1. **Gemini 3 Flash Preview** - Generates creative persona metadata including:
   - Unique adjective-based titles (e.g., "Daring Derrick", "Ethereal Eleven")
   - Rich cinematic descriptions placing characters in random eras, careers, or genres
   - Variational caching to ensure every generation is unique

2. **Gemini 2.5 Flash Image** - Creates photorealistic image reconstructions:
   - Maintains facial features and character identity
   - Regenerates scenes with new lighting, clothing, backgrounds, and poses
   - Outputs 8k movie-quality stills with cinematic bokeh

### The Interface

The UI presents a "Neural Matrix" displaying all 10 core Stranger Things characters:
- **Derrick** (D) - The bully
- **Eleven** (E) - The telekinetic warrior
- **Mike** (M) - The leader
- **Dustin** (D) - The science enthusiast
- **Steve** (S) - The heroic babysitter
- **Nancy** (N) - The investigator
- **Lucas** (L) - The pragmatic friend
- **Eddie** (E) - The Hellfire Club leader
- **Will** (W) - The sensitive artist
- **Max** (M) - The independent skater

Each character card shows:
- **Staged Mode**: Original character images in grayscale
- **Generated Mode**: AI-generated temporal variants with unique titles and descriptions
- **Real-time Status**: Animated loading states with thematic messages
- **Hover Details**: Full persona descriptions and neural metadata

### Key Features

🔄 **Individual Regeneration**: Click the sync button on any character to generate a new unique variant

💾 **Download Variants**: Save any generated persona image to your local system

🎨 **Variational Cache**: The app tracks used adjectives to ensure maximum creativity and uniqueness across generations

🎭 **Cinematic Theming**: Dark, sci-fi inspired UI with Matrix-style animations and Stranger Things aesthetics

## Run Locally

**Prerequisites:** Node.js (v16 or higher)

1. **Clone the repository**
   ```bash
   git clone https://github.com/muldercw/Temporal-Matrix.git
   cd Temporal-Matrix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your Gemini API key**
   
   Create a `.env.local` file in the root directory:
   ```env
   API_KEY=your_gemini_api_key_here
   ```
   
   Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling (utility-first approach)
- **Lucide React** - Icon library
- **Google Generative AI SDK** - AI model integration

## Project Structure

```
├── App.tsx              # Main application component with UI logic
├── geminiService.ts     # AI service layer for Gemini API calls
├── specimens.ts         # Character data and source images
├── types.ts             # TypeScript interfaces
├── utils.ts             # Utility functions
├── index.tsx            # React entry point
├── index.html           # HTML template
└── vite.config.ts       # Vite configuration
```

## Usage Tips

- **First Load**: The app fetches and processes all character images on initial load
- **Generation Time**: Each persona variant takes ~10-20 seconds to generate (metadata + image)
- **Unique Results**: The variational cache ensures you won't see repeat adjectives
- **Download**: Click the download button (visible after hover) to save any generated variant
- **Hover**: Hover over any card to see the full persona description and metadata

## License

This project is for educational and demonstration purposes. Stranger Things characters and related intellectual property are owned by Netflix.

## Credits

Built with ❤️ using Google's Gemini AI platform
