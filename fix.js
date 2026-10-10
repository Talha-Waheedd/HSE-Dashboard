const fs = require('fs');
const file = 'e:/CBL-APP/apps/management-dashboard/src/components/DataEntrySection.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/const \[searchQuery, setSearchQuery\] = useState\(''\);/g, '');
c = c.replace(/searchQuery/g, 'filters.search');
c = c.replace(/setSearchQuery\((.*?)\)/g, "setFilter('search', $1)");
c = c.replace(/onChange=\{e => setSearchQuery\(e\.target\.value\)\}/g, "onChange={e => setFilter('search', e.target.value)}");

fs.writeFileSync(file, c);
