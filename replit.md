# Aetheria: Life Simulator

## Overview
Aetheria is a life simulator application built with React, TypeScript, and Vite. It uses the Gemini AI API for advanced AI features including video generation, high-res imaging, and thinking models.

## Project Architecture
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (via CDN)
- **AI Integration**: Google Gemini API (@google/genai)
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure
```
/
├── App.tsx           # Main application component
├── index.html        # Entry HTML file
├── index.tsx         # React entry point
├── types.ts          # TypeScript type definitions
├── vite.config.ts    # Vite configuration
├── components/       # React components
├── services/         # Service modules (Gemini API)
└── package.json      # Dependencies
```

## Development
- **Dev Server**: `npm run dev` - runs on port 5000
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Environment Variables
- `GEMINI_API_KEY`: Required for AI features (Google AI Studio API key)

## Recent Changes
- Configured Vite to run on port 5000 with allowedHosts enabled for Replit proxy
- Removed missing index.css reference from index.html
