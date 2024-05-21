const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Обновление package.json для новой директории патчей
const packageJsonPath = path.join(__dirname, '../', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts['latest-patch'] = "node .generated/patch-1.0.3.js";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Автоматизация git-команд
execSync('git add .', { stdio: 'inherit' });
execSync('git commit -m "Move patch files to .generated directory"', { stdio: 'inherit' });
execSync('git push origin master', { stdio: 'inherit' });

// Создание следующего патча и открытие его в редакторе
const nextPatchNumber = 3;
const nextPatchFilename = path.join(patchesDir, `patch-1.0.${nextPatchNumber}.js`);
fs.writeFileSync(nextPatchFilename, '');
execSync(`code ${nextPatchFilename}`, { stdio: 'inherit' });

console.log('Patch applied. Use "npm test" to run the tests.');
