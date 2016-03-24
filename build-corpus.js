'use strict';

// Load libraries.
var _        = require('underscore');
var jsonfile = require('jsonfile');

// Load corpora.
var compoundWords = require('./data/compound-words-raw.json'),
    everyWord     = require('./node_modules/word-list-json/words.json').words;

// The file to which to write split compounds.
var wordsFile = './data/compound-words-processed.json';

// Say we're starting.
console.log('\nSplitting compounds…\n\n---\n');

// Set up flow. Split all compounds and then write to file.
return Promise.all(
  compoundWords.map(splitCompounds)
).then(
  writeDataToFile
);

// Determine if the chunk of the split word appears in the 'all words' list.
function isWord (word) {
  return _.contains(everyWord, word);
}

// Split words by going through them letter by letter until both portions are
// words found in the list of all words.
function splitCompounds (compoundWord) {
  var compoundWordLength = compoundWord.length,
      compoundWordMiddle = Math.round(compoundWord.length / 2),
      firstWordOfCompound,
      secondWordOfCompound,
      wordsOfCompound;

  // To find a more accurate split point for the compound word, and to do it
  // faster, split it first in the middle and then 'spiral' outwards. E.g.:
  //
  //     - apple/sauce
  //     - airp/lane, air/plane
  //     - headmi/stress, headm/istress, headmis/tress, head/mistress
  //
  // The order of split point placement for the word 'skyscraper' would look
  // like this:
  //
  //     s / k / y / s / c / r / a / p / e / r
  //       7   5   3   1   0   2   4   6   8

  for (var i = 0; i < compoundWordLength/2; i++) {

    // Move split 1 step backwards and 1 step forwards from the middle at each
    // turn of the loop.
    var splitPointBackward = compoundWordMiddle - i,
        splitPointForward  = compoundWordMiddle + i,
        segmentA1          = compoundWord.substr(                  0,  splitPointBackward ),
        segmentA2          = compoundWord.substr( splitPointBackward,  compoundWordLength ),
        segmentB1          = compoundWord.substr(                  0,  splitPointForward  ),
        segmentB2          = compoundWord.substr(  splitPointForward,  compoundWordLength );

    // Uncomment the next two lines to show the progress of the spiraling split.
    // console.log(segmentA1 + '|' + segmentA2);
    // console.log(segmentB1 + '|' + segmentB2);

    if (isWord(segmentA1) && isWord(segmentA2)) {
      firstWordOfCompound  = segmentA1;
      secondWordOfCompound = segmentA2;
      wordsOfCompound      = [segmentA1, segmentA2];
      break;
    }
    else if (isWord(segmentB1) && isWord(segmentB2)) {
      firstWordOfCompound  = segmentB1;
      secondWordOfCompound = segmentB2;
      wordsOfCompound      = [segmentB1, segmentB2];
      break;
    }

  }

  // Uncomment to see results of each compound split.
  console.log(compoundWord + ': ' + firstWordOfCompound + ', ' + secondWordOfCompound);

  return {
    compoundWord: compoundWord,
    firstWord:    firstWordOfCompound,
    secondWord:   secondWordOfCompound
  };
}

function writeDataToFile (wordDataItems) {
  // row format:
  // {
  //   compound: "",
  //   firstWord: "",
  //   secondWord: ""
  // }

  console.log('\n---\n\nWriting all split compounds to file…');

  jsonfile.writeFile(wordsFile, wordDataItems, {spaces: 2}, function (error) {
    console.log('\nDone! Processed ' + compoundWords.length + ' compounds!\n');

    if (error !== null)
      console.error('ERROR: ' + error);
  });
}