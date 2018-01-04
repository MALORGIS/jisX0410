@echo off

call mocha tests/*.test.js

call node node_modules/istanbul/lib/cli.js cover node_modules/mocha/bin/_mocha tests/*.test.js

call remap-istanbul -i coverage/coverage.json -o html-report -t html
