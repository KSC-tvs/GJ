const fs = require('fs');

['./src/data/gemstones.json', './src/data/site-config.json'].forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/"\/images\//g, '"images/');
  fs.writeFileSync(file, text, 'utf8');
});

console.log('Normalized JSON paths');
