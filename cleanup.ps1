npm cache clean --force
Remove-Item -Path .\node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path .\package-lock.json -Force -ErrorAction SilentlyContinue
npm install


