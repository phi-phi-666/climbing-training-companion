Set-Location "C:\Users\katar\Documents\claude\climbing-training-companion"

$message = @"
Initial commit: Climbing Training Companion PWA

- React 18 + Vite + TypeScript + Tailwind CSS
- IndexedDB storage via Dexie.js for sessions and nutrition
- AI-powered warmup/cooldown generators via OpenRouter API
- Session logging with muscle group and exercise selection
- Nutrition tracking with vegan gamification points
- Dashboard with days since last session and today's options
- PWA support with vite-plugin-pwa

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
"@

git commit -m $message
