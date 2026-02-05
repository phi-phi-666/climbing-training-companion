Set-Location "C:\Users\katar\Documents\claude\climbing-training-companion"

$message = @"
Add PWA icons and update manifest

- Update PWA manifest: name to Climbing Companion, short_name to Climbing
- Add climbing-themed app icon (mountain with carabiner design)
- Generate icons in required sizes (192x192, 512x512, apple-touch-icon)
- Add sharp dependency for icon generation script
- Update index.html with new favicon references

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
"@

git commit -m $message
