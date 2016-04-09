'use strict';

// Load libraries.
var _          = require('underscore');
var request    = require('request');
var wordfilter = require('wordfilter');
var Twit       = require('twit');

var twitter = new Twit({
  consumer_key:        process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:     process.env.TWITTER_CONSUMER_SECRET,
  access_token:        process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var WORDNIK_API_KEY  = process.env.WORDNIK_API_KEY;

// When working from local machine.
// var twitter         = new Twit(require('./twitter-config.js'));
// var WORDNIK_API_KEY = require('./wordnik-config.js').wordnik_api_key;

// Load corpora.
var compoundWords         = require('./data/compound-words-processed.json');
var numberOfCompoundWords = Object.keys(compoundWords).length;

// Make new compound and tweet it.
function makeNovelCompound() {
  synonymizeWords(pickCompound()).then(function (results) {
    postNewCompoundTweet(makeNewCompound(results));
  });
}

// To make sure synonyms are single words, filtering out spaces and dashes. This
// list extends the default set:
//     https://github.com/dariusk/wordfilter/blob/master/lib/badwords.json
wordfilter.addWords([
  ' ',
  '-',
  '\'',
  '’'
]);

function isAllowedWord (word) {
  if (!wordfilter.blacklisted(word)) {
    return word;
  }
}

// Create a new compound word.
function pickCompound () {
  // Pick a compound.
  var compound = compoundWords[_.random(0, numberOfCompoundWords - 1)];

  console.log('Chosen compound: ' + compound.compoundWord + ' (' + compound.firstWord + ', ' + compound.secondWord + ')');

  return {
    originalCompound: compound.compoundWord,
    firstWord: compound.firstWord,
    secondWord: compound.secondWord
  };
}

// Get synonyms for a word and pick one.
function getRelatedWord (word, relationship) {
  var url = 'http://api.wordnik.com:80/v4/word.json/' + word +
            '/relatedWords?useCanonical=true&relationshipTypes=' + relationship +
            '&limitPerRelationshipType=25' + '&api_key=' + WORDNIK_API_KEY;

  return new Promise (function (resolve) {

    request(url, function(error, response, body) {
      if (error) {
        console.log('\n\n====\n\nERROR:\n\n');
        console.log(error);
      }

      var relatedWordsData = JSON.parse(body);

      if (relatedWordsData.length > 0) {

        var relatedWords = relatedWordsData[0].words.map(isAllowedWord),
            relatedWord  = relatedWords[_.random(0, relatedWords.length - 1)];

        console.log('New synonym for ' + word + ': ' + relatedWord);

        resolve(relatedWord);
      }
      else {
        resolve(undefined);
      }
    });

  });

}

function synonymizeWords (wordData) {
  return Promise.all([
    getRelatedWord(wordData.firstWord, 'synonym'),
    getRelatedWord(wordData.secondWord, 'synonym')
  ]).then(function (results) {
    wordData.firstWordSynonym  = results[0];
    wordData.secondWordSynonym = results[1];
    return wordData;
  });
}

function makeNewCompound (wordData) {
  // If neither word has a synonym, we can't make a new compound, so give up and
  // try again.
  if (wordData.firstWordSynonym === undefined &&
    wordData.secondWordSynonym === undefined) {
    throw('No synonyms. Start again.');
  }

  // If one of the two words has no synonym, leave it alone and replace the
  // other word.
  else if (wordData.firstWordSynonym === undefined) {
    wordData = replaceWords(wordData, 'second');
  }
  else if (wordData.secondWordSynonym === undefined) {
    wordData = replaceWords(wordData, 'first');
  }

  // If they both have synonyms, randomly replace either one or both of them.
  else {
    var wordPossibilities = ['first', 'second', 'both'];
    wordData = replaceWords(wordData, wordPossibilities[_.random(wordPossibilities.length - 1)]);
  }

  console.log(wordData);

  return wordData;
}

function replaceWords (wordData, which) {
  switch (which) {
    case 'first': {
      wordData.newCompound = wordData.firstWordSynonym + wordData.secondWord;
      break;
    }
    case 'second': {
      wordData.newCompound = wordData.firstWord + wordData.secondWordSynonym;
      break;
    }
    case 'both': {
      wordData.newCompound = wordData.firstWordSynonym + wordData.secondWordSynonym;
      break;
    }
    default: {
      return false;
    }
  }

  return wordData;
}

// Put the tweet together.
function composeTweet (wordData) {
  var a = wordData.originalCompound.toLowerCase(),
      b = wordData.newCompound.toLowerCase(),
      A = capitalizeFirstLetter(a),
      B = capitalizeFirstLetter(b);

  var templates = [
    A + '? ' + B + '!',
    A + '? ' + B + '.',
    B + ', like ' + a + '.',
    B + ', not ' + a + '.',
    B + ' rather than ' + a + '.',
    B + ' instead of ' + a + '.',
    B + ' as opposed to ' + a + '.',
    'Not ' + a + '. ' + B + '.'
  ];

  var tweet = templates[_.random(templates.length - 1)];

  return tweet;
}

function capitalizeFirstLetter (string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function postNewCompoundTweet (wordData) {

  // Create a tweet with the new compound.
  var tweet = composeTweet(wordData);

  console.log(tweet);

  twitter.post('statuses/update', { status: tweet }, function (error) {
    if (error) {
      console.log('error:', error);
    }
  });
}

// Tweet on a regular schedule. 6 times a day means every 4 hours.
var timesToTweetPerDay = 6;

// Because Heroku cycles dynos once per day, the bot's schedule will not be
// regular: https://devcenter.heroku.com/articles/how-heroku-works#dyno-manager
setInterval(function () {
  try {
    makeNovelCompound();
  }
  catch (e) {
    console.log(e);
  }
}, (1000 * 60 * 60 * 24) / timesToTweetPerDay);

// Go!
makeNovelCompound();
