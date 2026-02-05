$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
Set-Location "C:\Users\katar\Documents\claude\climbing-training-companion"
npx vercel --prod --yes
