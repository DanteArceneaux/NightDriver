#!/bin/bash
# Setup script to create .env file with API keys

echo "Creating backend/.env file..."

cat > backend/.env << 'EOF'
PORT=3001
OPENWEATHER_API_KEY=a151d8c40b9db5483d12e7219a704eb1
TICKETMASTER_API_KEY=your_key_here
AERODATABOX_API_KEY=your_key_here
TOMTOM_API_KEY=your_key_here
EOF

echo "✅ .env file created with OpenWeatherMap API key!"
echo ""
echo "To add more API keys, edit backend/.env and replace 'your_key_here'"

