const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Создание директории для патчей
const patchesDir = path.join(__dirname, '.generated');
if (!fs.existsSync(patchesDir)) {
    fs.mkdirSync(patchesDir);
}

// Перемещение существующих патчей в директорию .generated
const patchFiles = fs.readdirSync(__dirname).filter(file => file.startsWith('patch-') && file.endsWith('.js'));

patchFiles.forEach(file => {
    const oldPath = path.join(__dirname, file);
    const newPath = path.join(patchesDir, file);
    fs.renameSync(oldPath, newPath);
    console.log(`Moved ${file} to ${patchesDir}`);
});

// Обновление package.json для новой директории патчей
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

packageJson.scripts['latest-patch'] = "node .generated/patch-1.0.2.js";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Автоматизация git-команд
execSync('git add .', { stdio: 'inherit' });
execSync('git commit -m "Move patch files to .generated directory"', { stdio: 'inherit' });
execSync('git push origin master', { stdio: 'inherit' });

// Создание следующего патча и открытие его в редакторе
const nextPatchNumber = 2;
const nextPatchFilename = path.join(patchesDir, `patch-1.0.${nextPatchNumber}.js`);
fs.writeFileSync(nextPatchFilename, '');
execSync(`code ${nextPatchFilename}`, { stdio: 'inherit' });

console.log('Patch applied. Use "npm test" to run the tests.');
