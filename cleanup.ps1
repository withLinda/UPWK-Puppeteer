npm cache clean --force
Remove-Item -Path .\node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .\package-lock.json -Force -ErrorAction SilentlyContinue
npm install


Remove-Item -Path "Z:\DEV\Puppeteer-projects\UPWK-Puppeteer\src\data\auth\cookies\auth_cookies.json" -Force
Remove-Item -Path "Z:\DEV\Puppeteer-projects\UPWK-Puppeteer\src\data\auth\localStorage\auth_localStorage.json" -Force