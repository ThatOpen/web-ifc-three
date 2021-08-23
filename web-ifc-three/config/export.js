// Export all .ts files
let fs = require('fs');
let path = require('path');

const folder = './src'

const files = getAllFiles(folder, '.ts', ['index.ts','.test.ts'], []);

files.sort((a,b)=>a.split('/').length - b.split('/').length);

fs.writeFileSync('./src/index.ts', files.map(f=>`export * from '.${f.slice(folder.length, -3)}'`).join(';\n') + ';')

function getAllFiles(folder, include, excludes, files) {
    const list = fs.readdirSync(folder).sort();
    for (const item of list) {
        if(fs.statSync(`${folder}/${item}`).isDirectory()) {
            getAllFiles(`${folder}/${item}`, include, excludes, files);
        } else if(
            (item.slice(-include.length) === include) && 
            excludes.every(ex=>(item.slice(-ex.length) !== ex))
        ){
            files.push(`${folder}/${item}`)
        }
    }
    return files;
}