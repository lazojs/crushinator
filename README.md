# crushinator

> Thank you, Bob Barker. I'm as happy as a girl can be. End statement.

Copies Lazo component dependencies based on component package.json meta data.

## Usage

```javascript
var crushinator = require('crushinator');

// arguments
// 1. application distribution/target
// 2. options
      - modulesDir: the directory that contains the node modules for the application; default 'node_modules'
      - resolver: function that resolves version conflicts; default most recent version (semver);
        should return module to use in application distribution; paramaters are module object and array of conflicts
        including module object
      - htmlImportsDest: application distribution target for html imports; default is application_dist/app/imports
// 3. callback

crushinator('app/dist', { modulesDir: 'app/node_modules' }, function (err, results) {
    if (err) {
        throw err;
    }

    // results: object of modules copied + meta data; key is module name
    // example results object
    {
        module_name: {
            version: "1.2.3", // version copied
            data: { }, // package.json contents
            path: 'a/b/c', // node module path
            versions: [], // versions of module found
            paths: [] // src, dest paths for directories copied based on lazo meta data in module package.json
        }
    }
});
```