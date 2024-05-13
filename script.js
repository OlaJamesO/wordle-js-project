const ANSWER_LENGTH = 5;
const ROUNDS = 6;
const letters = document.querySelectorAll(".scoreboard-letter");
const loadingDiv = document.querySelector(".info-bar");

// I like to do an init function so I can use "await"
async function init() {
    // the state for the app
    let currentRow = 0;
    let currentGuess = "";
    let done = false;
    let isLoading = true;

    // nab the word of the day
    const response = await fetch("https://words.dev-apis.com/word-of-the-day");
    const { word: wordResponse } = await response.json();
    const word = wordResponse.toUpperCase();
    const wordParts = word.split("");
    isLoading = false;
    setLoading(isLoading);

    // Dynamically generate scoreboard letters
    const scoreboard = document.querySelector(".scoreboard");

    for (let i = 0; i < ANSWER_LENGTH * ROUNDS; i++) {
        const letterDiv = document.createElement("div");
        letterDiv.classList.add("scoreboard-letter");
        letterDiv.id = `letter-${i}`;
        scoreboard.appendChild(letterDiv);
    }
    // Select the dydnamic generated scoreboard letters
    const letters = document.querySelectorAll(".scoreboard-letter");

    // user adds a letter to the current guess

    function addLetterToScoreboard(letter, index) {
        const letterDiv = document.getElementById(`letter-${index}`);
        if (letterDiv) {
            letterDiv.textContent = letter;
        }
    }

    let gameOver = false;

    function addLetter(letter) {
        if (gameOver) {
            return;
        }

        if (currentGuess.length < ANSWER_LENGTH) {
            currentGuess += letter;
        } else {
            currentGuess = currentGuess.substring(0, currentGuess.length - 1) + letter;
        }

        addLetterToScoreboard(letter, currentRow * ANSWER_LENGTH + currentGuess.length - 1);

        if (currentGuess === word) {
            gameOver = true;
            greyOutRemainingBoxes();
        }
    }

    function greyOutRemainingBoxes() {
        for (let i = currentRow * ANSWER_LENGTH + currentGuess.length; i < MAX_TRIES * ANSWER_LENGTH; i++) {
            const letterDiv = document.getElementById(`letter-${i}`);
            if (letterDiv) {
                letterDiv.classList.add('greyed-out');
            }
        }
    }

    // user try to enter a guess 
    async function commit() {
        if (currentGuess.length !== ANSWER_LENGTH) {
            // do nothing
            return;
        }

        // check the API to see if it's a valid word
        // skip this step if you're not checking for valid words
        isLoading = true;
        setLoading(isLoading);
        const response = await fetch("https://words.dev-apis.com/validate-word", {
            method: "POST",
            body: JSON.stringify({ word: currentGuess }),
        });
        const { validWord } = await response.json();
        isLoading = false;
        setLoading(isLoading);

        // not valid, mark the word as invalid and return
        if (!validWord) {
            markInvalidWord();
            return;
        }

        const guessParts = currentGuess.split("");
        const map = makeMap(wordParts);
        let allRight = true;

        // check for correct letters in the correct spot
        for (let i = 0; i < ANSWER_LENGTH; i++) {
            if (guessParts[i] === wordParts[i]) {
                // mark as correct
                letters[currentRow * ANSWER_LENGTH + i].classList.add("correct");
                map[guessParts[i]]--;
            }
        }

        // check for second pass for correct letters in the wrong spot
        // I will use map to keep track of the letters that are correct but in the wrong spot
        // first pass just finds correct letters so we can mark those as
        for (let i = 0; i < ANSWER_LENGTH; i++) {
            if (guessParts[i] === wordParts[i]) {
                // do nothing
            } else if (map[guessParts[i]] && map[guessParts[i]] > 0) {
                // mark as close 
                letters[currentRow * ANSWER_LENGTH + i].classList.add("close");
                map[guessParts[i]]--;
            } else {
                allRight = false;
                letters[currentRow * ANSWER_LENGTH + i].classList.add("wrong");
            }
        }

        currentRow++;
        currentGuess = "";
        // Display result message above scoreboard
        // Display result message above scoreboard
        const resultMessage = document.querySelector('.result-message');
        if (allRight) {
            resultMessage.textContent = `You win! The word of the day is ${word}!!.. Congratulations! 🎉`;
            document.querySelector(".brand").classList.add("winner");
        } else if (currentRow === ROUNDS) {
            resultMessage.textContent = `You tried your best! The word of the day is ${word}. Better luck next time! 🤗`;
        }
        resultMessage.parentNode.classList.remove('hidden'); // Remove hidden class from the parent container
    }


    // user hits backspace, if the the length of the string is 0 then do nothing

    function backspace() {

        currentGuess = currentGuess.substring(0, currentGuess.length - 1);
        letters[currentRow * ANSWER_LENGTH + currentGuess.length].innerText = "";
    }

    // let the user know that their guess wasn't a real word
    // skip this if you're not doing guess validation
    function markInvalidWord() {
        for (let i = 0; i < ANSWER_LENGTH; i++) {
            letters[currentRow * ANSWER_LENGTH + i].classList.remove("invalid");

            // long enough for the browser to repaint without the "invalid class" so we can then add it again
            setTimeout(
                () => letters[currentRow * ANSWER_LENGTH + i].classList.add("invalid"),
                10
            );
        }
    }

    // listening for event keys and routing to the right function
    // we listen on keydown so we can catch Enter and Backspace
    document.addEventListener("keydown", handleKeyPress);
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);

    function handleKeyPress(event) {
        if (done || isLoading) {
            // do nothing
            return;
        }

        const action = event.key;
        if (action === "Enter") {
            commit();
        } else if (action === "Backspace") {
            backspace();
        } else if (isLetter(action)) {
            addLetter(action.toUpperCase());
        } else {
            // do nothing
        }
    }

    const hiddenInput = document.getElementById("hidden-input");
    hiddenInput.addEventListener('input', function (event) {
        const input = event.target.value.toUpperCase();
        if (input) {
            addLetter(input);
            hiddenInput.value = '';
        }
    });

    function handleTouchStart(event) {
        event.preventDefault();
        if (done || isLoading) {
            // do nothing
            return;
        }


        let target = event.target;
        // Traverse up the DOM hierarchy until a scoreboard-letter element is found
        while (target && !target.classList.contains("scoreboard-letter")) {
            target = target.parentElement;
        }

        if (target) {
            hiddenInput.focus();
            const action = target.innerText;
            if (action) {
                addLetter(action.toUpperCase());
            }
        }
    }

    function handleTouchEnd(event) {
        event.preventDefault();
        if (done || isLoading) {
            // do nothing
            return;
        }



        commit();
    }
}

// a little function to check to see if a character is alphabet letter
// this uses regex (the /[a-zA-Z]/ part)

function isLetter(letter) {
    return /^[a-zA-Z]$/.test(letter);
}

// show the loading spinner when needed
function setLoading(isLoading) {
    loadingDiv.classList.toggle("hidden", !isLoading);
}

// takes an array of letters (like ['E', 'L', 'I', 'T', 'E']) and creates
// an object out of it (like {E: 2, L: 1, T: 1}) so we can use that to
// make sure we get the correct amount of letters marked close instead
// of just wrong or correct

function makeMap(array) {
    const obj = {};
    for (let i = 0; i < array.length; i++) {
        if (obj[array[i]]) {
            obj[array[i]]++;
        } else {
            obj[array[i]] = 1;
        }
    }
    return obj;
}

init();