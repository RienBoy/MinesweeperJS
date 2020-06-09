var fs = require('fs');

var highscores = {
    'beginner': {name: null, score: 999999},
    'intermediate': {name: null, score: 999999},
    'expert': {name: null, score: 999999}
};

fs.writeFile('highscores.json', JSON.stringify(highscores), function(err) {
    if (err) console.log(err);
});