const fs = require('fs').promises;
const path = require('path');


// Main app function
(async ()=>{
    // Getting the paths as arguments to command
    const [filePath, secondArg] = process.argv.slice(2);

    if (!filePath || !secondArg) {
        console.error('Usage: node script.js <file-to-read> <output-path>');
        process.exit(1);
    }

    // Get the absolute paths
    const absoluteFilePath = path.resolve(filePath);
    const outputPath = path.resolve(secondArg);

    // Get the code
    const code = await fs.readFile(absoluteFilePath, 'utf8');

    // Split the code into operations
    const operations = splitByOperation(code);

    operations.forEach((operation)  => {
        const type = determineType(operation);
        if(type === 'assignment'){
            const [ variableName, variableInterior ] = manageVariableAssignment(operation);

            console.log(manageInterior(variableInterior));
        }
    });
})();

// Manage interior
function manageInterior(interior){
    var inStr = '';
    var inBrackets = 0
    var i = 0;
    var total = '';
    var out = [];

    var currentStr = '';
    var currentVar = '';
    var currentNum = '';

    var isStr = false;
    var isVar = false;
    var isNumber = false;
    


    var currentInBrackets = '';

    interior.split('').forEach(character => {
        // Brackets handle
        inBrackets = bracketsHandle(character, inBrackets, inStr);
        
        // String handle
        inStr = stringHandle(character, inStr);

        if(inBrackets !== 0){
            currentInBrackets += character;
        }

        if(inBrackets === 0 && currentInBrackets !== ''){
            total += manageInterior(currentInBrackets);
            currentInBrackets = '';
        }

        if(character === '+' && inStr === '' && currentStr !== ''){
            out.push(['string', currentStr.slice(1)]);
            isStr = true;
            currentStr = '';
            return;
        }

        if(inStr === ''){
            if(!currentVar && /^[0-9]+$/.test(character) || character == '.'){
                isNumber = true;
                currentNum += character;
            }

            if(!currentVar && isNumber && !(/^[0-9]+$/.test(character) || character == '.')){
                // Number is over. IT'S OVER
                out.push(['number', currentNum]);
                currentNum = '';
            }
        }
        if(inStr !== ''){
            currentStr += character;
        }
        i++;
    });

    if(isStr){
        out.push(['string', currentStr.slice(1)]);
    }
    if(isNumber){
        out.push(['number', currentNum]);
    }
    return out;
}

// Manage variable assignment
function manageVariableAssignment(operation) {
    var inStr = '';
    var inBrackets = 0
    var currentOutput = '';
    var name = '';

    operation.split('').forEach(character => {
        // Brackets handle
        inBrackets = bracketsHandle(character, inBrackets, inStr);
        
        // String handle
        inStr = stringHandle(character, inStr);

        if(character === '=' && inBrackets === 0 && inStr === ''){
            name = currentOutput;
        }

        currentOutput += character;
    });
    return [ name, operation.slice(name.length+1) ];
}

// Get operation type
function determineType(operation) {
    var inStr = '';
    var inBrackets = 0
    var currentOutput = '';
    var i = 0;
    var type;

    operation.split('').forEach(character => {
        // Brackets handle
        inBrackets = bracketsHandle(character, inBrackets, inStr);
        
        // String handle
        inStr = stringHandle(character, inStr);

        // Equals sign
        if(character === '=' && inStr === '' && inBrackets === 0 && !type) {
            type = 'assignment';
        }

        // Brackets
        if(character === '(' && inStr === '' && operation.split('')[i-1] && inBrackets === 1 && !type) {
            if(currentOutput === 'if'){
                type = 'condition';
            }else
            if(currentOutput === 'while'){
                type = 'iteration';
            } else{
                type = 'function';
            }
        }

        currentOutput += character;
        i++;
    });
    return type;
}
// Get operation from code
function splitByOperation(code) {
    var inStr = '';
    var inBrackets = 0
    var currentOutput = '';
    var operations = [];
    var inFunction = 0;
    var lineNumber = 0;

    code.split('').forEach(character => {
        // Brackets handle
        inBrackets = bracketsHandle(character, inBrackets, inStr);

        // Braces
        if(character === '{' && inStr === ''){
            inFunction++;
        }
        if(character === '}' && inStr === ''){
            inFunction--;

            if(inFunction === 0){
                operations.push(currentOutput + '}');
                currentOutput = '';
                return
            }
        }

        // String handle
        inStr = stringHandle(character, inStr);

        // Semi colon
        if(character === ';' && inFunction === 0 && inStr === '' && inBrackets === 0){
            operations.push(currentOutput);
            currentOutput = '';
            return
        }

        if(character === ';' && inFunction === 0 && inStr === '' && inBrackets !== 0){
            fatalError('Unopened or unclosed brackets', lineNumber);
            return;
        }
        
        if(character === ' ' && inFunction === 0 && inStr === '' && inBrackets === 0){
            return;
        }

        if(character === '\n'){
            lineNumber++;
        }

        currentOutput += character;
    });

    return operations;
}

// Give a fatal compiling error
function fatalError(error, line){
    console.error(`\x1b[31mFatal Error on line ${line}: ${error}\x1b[0m`);
    process.kill(0);
}

function stringHandle(character, inStr){
    // Strings - single
    if(character === '\'' && inStr === '\''){
        inStr = '';
        return inStr;
    }
    if(character === '\'' && inStr === ''){
        inStr = '\'';
        return inStr;
    }

    // String double
    if(character === '"' && inStr === '"'){
        inStr = '';
        return inStr;
    }
    if(character === '"' && inStr === ''){
        inStr = '"';
        return inStr;
    }

    return inStr;
}
function bracketsHandle(character, inBrackets, inStr){
    if(character === '(' && inStr === ''){
        inBrackets++;
    }
    if(character === ')' && inStr === ''){
        inBrackets--;
    }

    return inBrackets;
}