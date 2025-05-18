document.addEventListener('DOMContentLoaded', () => {
    const puzzleArea = document.getElementById('puzzle-area');
    const checkButton = document.getElementById('check-button');
    const resetButton = document.getElementById('reset-button');
    const hintButton = document.getElementById('hint-button');
    const currentLevelDisplay = document.getElementById('current-level');
    const movesLeftDisplay = document.getElementById('moves-left');
    const feedbackMessage = document.getElementById('feedback-message');

    let currentLevel = 0;
    let movesMadeThisLevel = 0;
    let selectedStick = null;

    // --- 1. Define Stick Configurations for Digits/Operators ---
    // This is the most complex part. You need to define how each number (0-9)
    // and operator (+, -, =) is formed by individual matchsticks (their
    // positions and orientations relative to a container).
    // Example for '1' (could be two vertical sticks, or one central one)
    // We'll use simplified DIVs here, SVG would be more flexible for rotation.
    const stickTemplates = {
        '1': [
            { type: 'vertical', top: '25%', left: '45%', height: '50%', width: '10%' } // Simplified
        ],
        '2': [ /* ... definitions ... */ ],
        '3': [ /* ... definitions ... */ ],
        '4': [ /* ... definitions ... */ ],
        '5': [ /* ... definitions ... */ ],
        '6': [ /* ... definitions ... */ ],
        '7': [ /* ... definitions ... */ ],
        '8': [ /* ... definitions ... */ ],
        '9': [ /* ... definitions ... */ ],
        '0': [ /* ... definitions ... */ ],
        '+': [ /* ... definitions ... */ ],
        '-': [ /* ... definitions ... */ ],
        '=': [ /* ... definitions ... */ ]
    };

    // --- 2. Define Levels ---
    const levels = [
        {
            puzzle: "1-1=9", // Initial incorrect equation string
            movesAllowed: 2,
            solution: (num1, op, num2, res) => num1 === 1 && op === '+' && num2 === 1 && res === 2, // Function to check solution
            solutionString: "1+1=2" // For hint or direct check
        },
        {
            puzzle: "3-4=1",
            movesAllowed: 1,
            solution: (num1, op, num2, res) => num1 === 5 && op === '-' && num2 === 4 && res === 1,
            solutionString: "5-4=1"
        },
        // ... Add more levels based on the video ...
        {
            puzzle: "0-3=6",
            movesAllowed: 1,
            solution: (num1, op, num2, res) => num1 === 9 && op === '-' && num2 === 3 && res === 6,
            solutionString: "9-3=6"
        }
    ];

    // --- 3. Render a Puzzle ---
    function renderPuzzle(levelIndex) {
        puzzleArea.innerHTML = ''; // Clear previous puzzle
        const level = levels[levelIndex];
        currentLevelDisplay.textContent = levelIndex + 1;
        movesLeftDisplay.textContent = level.movesAllowed;
        movesMadeThisLevel = 0;
        feedbackMessage.textContent = '';
        selectedStick = null;

        const equation = level.puzzle; // e.g., "1-1=9"
        let charIndex = 0;

        // This needs to be sophisticated to handle multi-digit numbers
        // For simplicity, assuming single digits and one operator
        const parts = equation.match(/(\d+)([-+=])(\d+)([-+=])(\d+)/);
        if (!parts) {
            console.error("Could not parse puzzle:", equation);
            return;
        }
        // parts[1]=num1, parts[2]=op1, parts[3]=num2, parts[4]=op2 (equals), parts[5]=result

        [parts[1], parts[2], parts[3], parts[4], parts[5]].forEach(char => {
            const container = document.createElement('div');
            container.classList.add(isNaN(parseInt(char)) ? 'operator-container' : 'digit-container');
            container.dataset.char = char; // Store original character

            const sticks = stickTemplates[char];
            if (sticks) {
                sticks.forEach((stickData, index) => {
                    const stickElement = document.createElement('div');
                    stickElement.classList.add('matchstick');
                    stickElement.classList.add(stickData.height > stickData.width ? 'vertical' : 'horizontal'); // Crude orientation
                    stickElement.style.top = stickData.top;
                    stickElement.style.left = stickData.left;
                    stickElement.style.width = stickData.width;
                    stickElement.style.height = stickData.height;
                    stickElement.dataset.originalContainer = char;
                    stickElement.dataset.originalStickIndex = index; // To track which stick it is
                    stickElement.addEventListener('click', handleStickClick);
                    container.appendChild(stickElement);
                });
            }
            puzzleArea.appendChild(container);
        });
    }

    // --- 4. Handle Stick Interaction ---
    function handleStickClick(event) {
        const clickedStick = event.target;
        const level = levels[currentLevel];

        if (!selectedStick) {
            // Select a stick
            if (movesMadeThisLevel < level.movesAllowed) {
                selectedStick = clickedStick;
                selectedStick.classList.add('selected');
                // Potentially "detach" it visually or allow it to be moved to a "slot"
            } else {
                feedbackMessage.textContent = "No more moves allowed for this stick!";
            }
        } else {
            // Place the selected stick
            // This is where it gets tricky. You need "drop zones" or a way to determine
            // if the new position is valid and how it changes a number/operator.
            // For simplicity, let's assume we are moving it to another stick's position (swapping or adding)
            // OR ideally, moving it to an empty "slot" in a digit representation.

            // A more robust system would:
            // 1. Define "slots" for each digit where sticks can go.
            // 2. When a stick is picked, it's removed from its slot.
            // 3. When a "drop zone" (another slot, or a new container) is clicked,
            //    the stick is placed there.
            // 4. The digit/operator is re-evaluated based on its current sticks.

            // Simplified: remove from old parent, add to new (if clicked on a container)
            if (clickedStick.classList.contains('digit-container') || clickedStick.classList.contains('operator-container')) {
                 if (selectedStick.parentElement !== clickedStick) { // Don't count move if placed back in same container (needs refinement)
                    movesMadeThisLevel++;
                 }
                clickedStick.appendChild(selectedStick); // Simplistic move
            } else if (clickedStick.classList.contains('matchstick') && clickedStick !== selectedStick) {
                // Clicked another stick - maybe swap? or place near it?
                // This needs careful design.
                // For now, let's just move it to the same container as the clicked stick for demo
                 if (selectedStick.parentElement !== clickedStick.parentElement) {
                    movesMadeThisLevel++;
                 }
                clickedStick.parentElement.appendChild(selectedStick);
            }


            selectedStick.classList.remove('selected');
            selectedStick = null;
            movesLeftDisplay.textContent = level.movesAllowed - movesMadeThisLevel;
            updatePuzzleState(); // Re-evaluate what the numbers/operators are now
        }
    }

    // --- 5. Update Puzzle State (after a move) ---
    function updatePuzzleState() {
        // Iterate through each .digit-container and .operator-container
        // Count the sticks and their configuration to determine the new char
        // This is highly dependent on your stickTemplates and how you define them.
        // E.g., if a '1' container now has sticks for a '7', update its dataset.char
        console.log("Puzzle state needs to be re-evaluated based on stick positions.");
    }

    // --- 6. Check Solution ---
    checkButton.addEventListener('click', () => {
        const level = levels[currentLevel];
        if (movesMadeThisLevel > level.movesAllowed) {
            feedbackMessage.textContent = "Too many moves!";
            return;
        }

        // This is the HARDEST part: Parse the current visual state into an equation
        let currentEquationString = "";
        const containers = puzzleArea.querySelectorAll('.digit-container, .operator-container');
        containers.forEach(container => {
            // Based on the sticks *currently in this container*, determine the char
            // This requires a reverse lookup from stick configuration to char
            // For now, we'll assume the dataset.char was magically updated by updatePuzzleState()
            // OR, if you're only *moving* sticks, the containers might still represent their original intent
            // and you just need to check if the *target* solution is met.
            // The video solutions often *change* a digit/operator.
            currentEquationString += determineCharFromSticks(container);
        });


        // Simplified check based on solutionString (assumes we know the target)
        // A real check would parse currentEquationString and evaluate it.
        const actualCurrentEquation = parseVisualEquation(); // This function is complex
        console.log("Current Visual Equation:", actualCurrentEquation.str);

        // Example: If target is "1+1=2"
        if (actualCurrentEquation.num1 === 1 &&
            actualCurrentEquation.op === '+' &&
            actualCurrentEquation.num2 === 1 &&
            actualCurrentEquation.res === 2 && // Check if equals sign is present
            movesMadeThisLevel <= level.movesAllowed) { // And correct # of moves

            feedbackMessage.textContent = "Correct! Well done!";
            // Unlock next level
            setTimeout(() => {
                currentLevel++;
                if (currentLevel < levels.length) {
                    renderPuzzle(currentLevel);
                } else {
                    feedbackMessage.textContent = "You completed all levels!";
                    // Game end logic
                }
            }, 1500);
        } else {
            feedbackMessage.textContent = "Not quite right. Try again!";
        }
    });

    function determineCharFromSticks(containerElement) {
        // VERY COMPLEX: Based on the number of .matchstick children and their
        // classes/styles (positions, orientations), determine what digit/operator it is.
        // This requires a robust mapping.
        // For this placeholder, it will just return its original char or a ?
        const sticks = containerElement.querySelectorAll('.matchstick');
        // Example: if it has 2 vertical sticks arranged like an 11, it's '='
        // if it has 1 vertical stick in the middle, it's '1'
        // This is the inverse of renderPuzzle's stick placement.
        return containerElement.dataset.char || '?'; // Fallback
    }

    function parseVisualEquation() {
        // This function needs to look at the #puzzle-area, identify the
        // groups of sticks that form numbers and operators, and then
        // evaluate the resulting equation.
        // Example:
        const num1Str = determineCharFromSticks(puzzleArea.children[0]);
        const opStr = determineCharFromSticks(puzzleArea.children[1]);
        const num2Str = determineCharFromSticks(puzzleArea.children[2]);
        // const equalsStr = determineCharFromSticks(puzzleArea.children[3]);
        const resStr = determineCharFromSticks(puzzleArea.children[4]);

        const num1 = parseInt(num1Str);
        const num2 = parseInt(num2Str);
        const res = parseInt(resStr);
        let opFunc;
        let isValid = true;

        if (opStr === '+') opFunc = (a, b) => a + b;
        else if (opStr === '-') opFunc = (a, b) => a - b;
        // Add more operators if needed
        else isValid = false;

        if (isNaN(num1) || isNaN(num2) || isNaN(res) || !isValid) {
            return { isValid: false, str: `${num1Str}${opStr}${num2Str}=${resStr}` };
        }

        return {
            num1: num1, op: opStr, num2: num2, res: res,
            isValid: opFunc(num1, num2) === res,
            str: `${num1Str}${opStr}${num2Str}=${resStr}`
        };
    }


    // --- 7. Reset and Hint ---
    resetButton.addEventListener('click', () => {
        renderPuzzle(currentLevel);
    });

    hintButton.addEventListener('click', () => {
        // Provide a hint, e.g., highlight a stick that needs to be moved,
        // or show one part of the correct equation.
        const level = levels[currentLevel];
        feedbackMessage.textContent = `Hint: Try to make it "${level.solutionString}"`;
    });

    // --- Initial Load ---
    renderPuzzle(currentLevel);
});
