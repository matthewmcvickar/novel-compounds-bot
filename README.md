# Novel Compounds Bot

**[@novelcompounds](https://twitter.com/novelcompounds)**

A Twitter bot that makes up new compound words.


## What It Does

Takes a compound (e.g., **whirlwind**), breaks it into its components (**whirl** and **wind**), substitutes one or both of those words with a synonym (**swirl** and **gust**), and presents you with a new compound (**swirlgust**).


---


## How I Built It

After making my [first bot](https://github.com/matthewmcvickar/oblique-questions-bot), I [jotted down a bunch of other ideas](https://gist.github.com/matthewmcvickar/1f7e3985c31fcdaab820). The 'Not Quite Synonymous Compound Bot' stuck in my mind, so I decided to work on it.

### Part 1: Finding Compound Words

I searched the internet for lists of English compound words. There weren't a lot of data sets, but after a bunch of Googling, I found a handful of lists ([see sources below](#acknowledgements)).

I formatted and cleaned up the lists to create one long JSON file of unique compound words ([`compound-words-raw.json`](data/compound-words-raw.json)). I had about 2,800 words at that point.

### Part 2: Splitting Compounds Automatically

Then I wrote a script ([`build-flawed-corpus.js`](build-flawed-corpus.js)) that attempts to split the compounds into their component words.

The script runs through each word in the [`compound-words-raw.json`](data/compound-words-raw.json) file, splitting them like this:

1. Get a word: `dogcatcher`

2. Starting from the middle (rounding up), split the word in half: `dogca` / `tcher`

3. See if both parts of the word appear in [a list of English words](https://github.com/sindresorhus/word-list). If they don't, move outward in a spiral, splitting the word until both parts are found.

    ```text
                  +-------+
                  |       |
    d   o   g / c / a / t / c   h   e   r
              |   |   |   |
              |   +---+   |
              +-----------+

    1. dogca / tcher [failure]
    2. dogc / atcher [failure]
    3. dogcat / cher [failure]
    4. dog / catcher [success]
    ```

4. Write the split compound data to a JSON file:

    ```json
    {
      "compoundWord": "dogcatcher",
      "firstWord": "dog",
      "secondWord": "catcher"
    }
    ```

### Part 3: Splitting Compounds Automatically Is Hard

Once [build-flawed-corpus.js](build-flawed-corpus.js) is done running, I had a JSON file full of compound words and their components to work with.

As its name suggests, the script doesn't always do a good job. That's because compound words can be tricky for a machine that doesn't intuitively understand English.

Take the word 'airship' for example. You and I know that it's made up of the words 'air' and 'ship.' The computer, though, sees 'airs' and 'hip' and thinks it's done because they're both valid words.

This was happening a lot:

  - doeskin → does/kin
  - eyesore → eyes/ore
  - bugspray → bugs/pray (haha)

I tried to get around this a handful of ways:

  - Moving the starting point of the split.
  - Using a smaller dictionary of English words to compare the splits.
  - Weighing two sets of split words against each other based on occurences within a corpus and keeping the higher-scoring one.
  - Trying to determine split points based on pronunciation keys.
  - Looking for an etymological dictionary structured enough and to do the splitting.
  - Not caring and releasing the bot with a flawed data set.

Nothing worked, so I just went through all 2800 words and corrected the mistakes by hand.

### Part 4: Cleaning Up

Going through the list by hand was good, though. In addition to correcting mis-split compounds, I got rid of a bunch of other troublesome compounds:

  - offensive words
  - archaic words (['sadiron'](https://www.wordnik.com/words/sadiron), ['nowise'](https://www.wordnik.com/words/nowise))
  - words that were different forms of the same word ('righthand' and 'righthanded')
  - compounds I considered iffy for my purposes ('today,' 'fourteen')
  - compounds containing more than two words ('heretofore')
  - words that weren't actually compounds ('rearrange,' 'limerick').

This final, corrected list is at [`compound-words-canonical.json`](data/compound-words-canonical.json). It contains approximately 2,675 compounds.

### Part 5: Making Novel Compounds

The [`novel-compounds-bot.js`](novel-compounds-bot.js) script does the following:

1. Choose a compound at random from [`compound-words-canonical.json`](data/compound-words-canonical.json).

2. For the component words of the compound, get synonyms for each from the [Wordnik API](http://developer.wordnik.com/). From the list of synonyms returned by Wordnik, filter out [bad words](https://github.com/dariusk/wordfilter/blob/master/lib/badwords.json), and choose one synonym at random for each word.

3. Randomly decide whether to replace both words or just one.

4. Output a new compound word and tweet it.

This script is running on Heroku.


---


## Acknowledgements

I could not have created this bot without help from the following people and resources:

- [Justin Falcone](http://twitter.com/modernserf) provided code review and helped me understand JavaScript Promises.

- This project was inspired by many bot-makers, but the work of [Allison Parrish](http://twitter.com/aparrish), [Nora Reed](https://twitter.com/NoraReed), and [Darius Kazemi](https://twitter.com/tinysubversions) stand out in particular.

- The [Wordnik API](http://developer.wordnik.com/) provides the synonyms by which the new compounds are built. It's awesome.

- The list of compound words itself was generated by copying and pasting the lists from these websites:

  - [Enchanted Learning: Compound Words](http://www.enchantedlearning.com/grammar/compoundwords/)
  - [Hugh Fox III: List of Compound Words](http://foxhugh.com/word-lists/list-of-compound-words/)
  - [LearningDifferences.com: Compound Word Lists](http://www.learningdifferences.com/Main%20Page/Topics/Compound%20Word%20Lists/Compound_Word_%20Lists_complete.htm)
  - [ManyThings.org: Compound Words](http://www.manythings.org/vocabulary/lists/a/words.php?f=compound_words)

- [Sindre Sorhus](https://github.com/sindresorhus)'s [word-list](https://github.com/sindresorhus/word-list) provided me with the list of words against which I compared my compounds to split them up.


## Afterward

This is my second Twitter bot. ([@obliquestions](https://twitter.com/obliquestions) is the first.) The idea for this bot came to me shortly after creating @obliquestions, when I had [a bunch more ideas](https://gist.github.com/matthewmcvickar/1f7e3985c31fcdaab820) (this is 'Not Quite Synonymous Compound Bot' in that list).
