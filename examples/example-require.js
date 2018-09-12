// Require modules by name
console.log(require("os").type());

// Require relative to the working directory
console.log(require("./package.json").name);

self.close();