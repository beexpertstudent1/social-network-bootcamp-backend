const fs = require('fs');

const exists = fs.existsSync('/folders/configs/sc-aws-bootcamp.json');

module.exports = exists
    ? require('/folders/configs/sc-aws-bootcamp.json')
    : require('../envConfig/dev/sc-aws-bootcamp.json');