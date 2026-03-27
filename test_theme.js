import fs from 'fs';
const indexCss = fs.readFileSync('/Users/haoranzhao/Desktop/不知名项目/Synaptix/web/src/index.css', 'utf-8');
console.log(indexCss.includes('.light'));
