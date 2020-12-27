const fs = require('fs');

const exists = fs.existsSync('/folders/configs/sc-aws-bootcamp.json');

module.exports = exists
    ? require('/folders/configs/sn-aws-bootcamp.json')
    : require('../envConfig/dev/sn-aws-bootcamp.json');