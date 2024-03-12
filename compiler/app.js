const fs = require('fs');

let fatalError = false;

if(!process.argv[2]){
    createError('Unspecified input file');
    fatalError = true;
}
if(!process.argv[3]){
    createError('Unspecified output file');
    fatalError = true;
}
var filePath;

if (fullDir(process.argv[2])){
    filePath = process.argv[2];
} else{
    filePath = process.cwd()+'/'+process.argv[2];
}

const outputPath = '.\\..\\';

var outputFile;
if (fullDir(process.argv[3])){
    outputFile = process.argv[3];
} else{
    outputFile = process.cwd()+'/'+process.argv[3];
}

const debug = false;

if (debug) {
    console.log('Debug mode active');
}

var finalCode = '';

let knownFunctions = [
    '', // Blank must be there or issues occur
    '//', // Comments support
    'def', // Creating variables
    'mod', // Updating variables
    'log', // Logging to the console
    'num', // Dealing with any numbers
    'str', // Casting to a string
];

let variables = []

if(!fatalError){
    if (fs.existsSync(filePath)) {
        var currentNew = fs.readFileSync(filePath, 'utf8');; // Set initial value
        while (currentNew != '' && !fatalError) {
            getFunction(nextOperation(currentNew)['op']);
            currentNew = nextOperation(currentNew)['new'];
        }
        compile();
    } else {
        createError('Cannot find file ' + filePath);
        fatalError = true;
    }
}

function getFunction(operation, returnValue) {
    if (!functionValidator(operation)) {
        return;
    }
    var action = "";
    var actionContent = operation;
    for (let i = 0; i < operation.length; i++) {
        var currentChar = operation[i];
        actionContent = actionContent.substring(1);
        // Opening bracket check
        if (currentChar == "(") {
            // Break the loop
            i = operation.length;
            currentChar = '';
        }
        action += currentChar;
    }
    if(!returnValue){
        var args = getFunctionArgs(actionContent.slice(0, -1));
        appendFunction(action, args);
    } else{
        var args = getFunctionArgs(actionContent.slice(0, -1));
        return([action, args]);
    }
}
function appendFunction(action, args, returnValue) {
    action = action.trim();
    var finalOutput = '';
    var output = "";
    output += action + '(';
    args.forEach(arg => {
        output += arg + ',';
    });
    output = output.slice(0, -1);
    output += ')';

    if (!knownFunctions.includes(action)) {
        createError('Unknown function: "' + action + '"');
    }
    if (action == 'log') {
        finalOutput += 'out(' + decodeValue(args[0]) + ');';
    }
    if (action == 'str') {
        finalOutput += 'numToString(' + decodeValue(args[0]) + ');';
    }
    if (action == 'def') {
        const validation = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
        if(!validation.test(decodeValue(args[0], true).slice(1, -1))){
            createError('Variable name contains or begins with illegal characters: ' + args[0]);
        }
        variables.push(
            {
                name: decodeValue(args[0], true),
                identification: 'VARIBALE_' + makeVariableID(),
                type: decodeValue(args[1], true),
                value: decodeValue(args[2], true)
            }
        );
    }

    if (action == 'mod') {
        var found = false;
        variables.forEach((variable) => {
            if (variable.name == decodeValue(args[0])) {
                // Modify the variable
                finalOutput += variable.identification + '=' + decodeValue(args[1]) + ';';
                found = true;
            }
        })
        if (!found) {
            createError('Variable undefined: ' + decodeValue(args[0]).slice(1, -1));
        }
    }

    if(!returnValue){
        finalCode += finalOutput;
    } else{
        return finalOutput;
    }
}
function functionValidator(operation) {
    var openCount = 0;
    var closeCount = 0;

    var error = false;
    for (let i = 0; i < operation.length; i++) {
        if (!fatalError) {
            var currentChar = operation[i];
            // Bracket check
            if (currentChar == "(") {
                openCount++;
            }
            if (currentChar == ")") {
                closeCount++;
                if (openCount < closeCount) {
                    createError('Unmatched Bracket. Closed, never opened: ' + operation);
                    error = true;
                    i = operation.length;
                }
            }
            if (currentChar != ' ' && currentChar != ')' && openCount == closeCount && openCount != 0) {
                createError('Invalid syntax, code after final bracket: ' + operation.trim());
            }
        }
    }

    if (openCount != closeCount && !error) {
        error = true;
        createError('Unmatched Bracket. Opened, never closed: ' + operation);
        return false;
    }

    if (error) {
        return false;
    } else {
        return true;
    }
}
function nextOperation(content) {
    var newContent = content;
    var inString = false;
    var currentOperation = '';
    var lastChar;
    var newLineOnly = false;

    for (let i = 0; i < content.length; i++) {
        var currentChar = content[i];
        newContent = newContent.substring(1);

        if (newLineOnly && currentChar == '\n') {
            newLineOnly = false;
        }

        if (!newLineOnly) {
            // Check if a comment has started
            if (lastChar && lastChar == '/' && currentChar == '/') {
                // Continue only untill a new line
                newLineOnly = true;

                currentChar = '';
                currentOperation = currentOperation.slice(0, -1); // Remove prev /
            }
            lastChar = currentChar;

            // Space checker
            if (!inString && currentChar == " ") {
                currentChar = '';
            }

            // New line check
            if (!inString && currentChar == "\n") {
                currentChar = '';
            }

            // Semi colon check
            if (!inString && currentChar == ";") {
                // Break the loop
                i = content.length;
                currentChar = '';
            }

            // String check
            var notMoved = true;
            if (inString && currentChar == "'") {
                inString = false;
                notMoved = false;
            }
            if (!inString && currentChar == "'" && notMoved) {
                inString = true;
            }
            currentOperation += currentChar;
        }
    }
    return (
        {
            op: currentOperation,
            new: newContent
        }
    );
}
function getFunctionArgs(string) {
    var inString = false;
    var inBrackets = false;
    var currentOperation = '';
    var currentString = '';
    var array = [];

    var bracketOpenCount = 0;
    var bracketClosedCount = 0;

    for (let i = 0; i < string.length; i++) {
        var currentChar = string[i];
        if (!inString && !inBrackets && currentChar == ",") {
            array.push(currentString);
            currentString = '';
        }
        if((currentChar != "," && !inString) || inString){
            currentString += currentChar;
        }

        if (!inString && !inBrackets && currentChar == " ") {
            currentString = '';
        }

        // String check
        var notMoved = true;
        if (inString && currentChar == "'") {
            inString = false;
            notMoved = false;
        }
        if (!inString && currentChar == "'" && notMoved) {
            inString = true;
        }

        // Bracket check
        var notMovedBracket = true;
        if (inBrackets && currentChar == ")") {
            inBrackets = false;
            notMovedBracket = false;
            bracketClosedCount++;
        }
        if (!inBrackets && currentChar == "(" && notMovedBracket) {
            inBrackets = true;
            bracketOpenCount++;
        }
        currentOperation += currentChar;
    }
    array.push(currentString);
    currentString = '';

    return array;
}
function createError(errorMessage) {
    const redText = '\x1b[31m';
    const resetColor = '\x1b[0m';

    console.error(redText + 'Error: ' + errorMessage.replace(/[^\x20-\x7E]/g, '') + resetColor);
    fatalError = true;

    process.exit(6);
}
function makeVariableID() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 30) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    if (variables.some(variable => variable.identification === 'VARIABLE_' + result)) {
        return makeVariableID(); // Regenerate if ID already exists
    }
    return result;
}
function decodeValue(value,) {
    if(!value){
        createError('No value set to de-code.');
    }
    var finalValue = '';
    var inString = false;
    var currentVar = '';
    var currentString = '';
    var pastType = 'none';
    var currentNum = '';
    var type = '';
    var inFunction = false;

    var bracketOpenCount = 0;
    var bracketClosedCount = 0;

    var optString = '';
    // Optimise the string
    for (let i = 0; i < value.length; i++) {
        var currentChar = value[i];

        if(!inString && currentChar != ' '){
            optString += currentChar;
        } else if(inString){
            optString += currentChar;
        }

        // String management
        var managedString = false;
        if(!inString && currentChar == "'"){
            // Starting a new string
            inString = true;
            managedString = true
        }

        if(inString && currentChar == "'" && !managedString){
            // Ending a string
            inString = false;
            managedString = true
        }
    }
    // Processing the value
    for (let i = 0; i < optString.length; i++) {
        var currentChar = optString[i];

        // Manage the + symbol
        if(currentChar == '+' && !inFunction && !inString){
            if(optString[i-1] && optString[i-1] == "'" && optString[i+1] && optString[i+1] != "'"){// Past was a string and we have another set to deal with that is not a string
                finalValue += '+';
            }

            // Clear the current char
            currentChar = '';

            if(currentVar != ''){ // We have a current variable
                // End the variable
                pastType = 'variable';
                
                if(currentVar.includes('(') && currentVar.includes(')')){
                    // Hang on, this is not a variable, it's a function
                    finalValue += appendFunction(getFunction(currentVar, true)[0], getFunction(currentVar, true)[1], true).slice(0 ,-1);
                } else{
                    // Check if the variable is declared
                    var placeName;
                    var varType;
                    variables.forEach(variable => {
                        if(variable.name == '"'+currentVar+'"'){
                            placeName = variable.identification;
                            varType = variable.type;
                        }
                    });

                    if(!placeName){
                        createError('Unknown variable: '+currentVar );
                    }

                    if(varType != type && type != ''){
                        createError(`Cannot mix data type. Initialy ${type} now ${varType}`);
                    }
                    type = varType;

                    finalValue += placeName;
                }
                
                if(optString[i+1]){
                    finalValue += '+';
                }
                currentVar = '';
            }

            // Number management
            if(currentVar == '' && currentNum != ''){ // Not a variable we are trying to deal with
                // End the variable
                pastType = 'number';

                finalValue += currentNum;

                if(optString[i+1]){
                    finalValue += '+';
                }

                currentNum = '';
            }
        }

        function charIsNumber(char){
            if(char && (
                char == '0' ||
                char == '1' ||
                char == '2' ||
                char == '3' ||
                char == '4' ||
                char == '5' ||
                char == '6' ||
                char == '7' ||
                char == '8' ||
                char == '9' 
            )){
                return true;
            } else{
                return false;
            }
        }
        // Number managment
        if((charIsNumber(currentChar) || (currentChar == '.' && optString[i-1] && optString[i+1] && charIsNumber(optString[i-1]) && charIsNumber(optString[i+1]))) && !inString && currentVar == '' && !inFunction){
            currentNum += currentChar;
            if(type != '"number"' && type != ''){
                createError(`Cannot mix data type. Initialy "${type}" now number`);
            }
            type = '"number"';
        }

        // Variable management
        if(!inString && !charIsNumber(currentChar) && currentChar != "'" && currentChar != '' && currentChar != "."){
            // We are in a variable
            currentVar += currentChar;

            if(currentChar == '(' && inFunction){
                // We are already in a function but have a bracket
                bracketOpenCount++;
            }
            if(currentChar == ')' && inFunction){
                // We are already in a function but have a bracket
                bracketClosedCount++;

                if(bracketOpenCount == bracketClosedCount){
                    // We need to end end it, cause it's all over, wow, that was probably a long chain of functions that I don't even want to think about
                    inFunction = false;
                }
            }

            if(currentChar == '(' && !inFunction){
                // We are now inside a function
                inFunction = true;
                bracketOpenCount++;
            }
        }

        // String management
        var managedString = false;
        if(!inString && currentChar == "'" && !inFunction){
            // Starting a new string
            if(pastType == 'string'){ // Some optimisation can be done here
                finalValue = finalValue.slice(0, -1);
            }
            if(type != '"string"' && type != ''){
                createError(`Cannot mix data type. Initialy ${type} now string`);
            }
            type = '"string"';
            inString = true;
            managedString = true
        }

        if(inString && currentChar == "'" && !managedString && !inFunction){
            // Ending a string
            inString = false;
            if(pastType != 'string'){ // Some optimisation can be done here
                finalValue += '"';
            }
            finalValue += currentString+'"';
            pastType = 'string';
            currentString = '';
            managedString = true
        }

        // Push the character
        if(inString && currentChar != "'"){
            currentString += currentChar;
        }
    }

    finish();
    function finish(){
        if(currentVar != ''){ // We have a current variable
            // End the variable
            pastType = 'variable';

            if(currentVar.includes('(') && currentVar.includes(')')){
                // Hang on, this is not a variable, it's a function
                finalValue += appendFunction(getFunction(currentVar, true)[0], getFunction(currentVar, true)[1], true).slice(0 ,-1);
            } else{
                var placeName;
                var varType;
                variables.forEach(variable => {
                    if(variable.name == '"'+currentVar+'"'){
                        placeName = variable.identification;
                        varType = variable.type;
                    }
                });

                if(!placeName){
                    createError('Unknown variable: '+currentVar );
                }

                if(varType != type && type != ''){
                    createError(`Cannot mix data type. Initialy ${type} now ${varType}`);
                }
                type = varType;

                finalValue += placeName;
            }
            currentVar = '';
        }

        // Number management
        if(currentVar == '' && currentNum != ''){ // Not a variable we are trying to deal with
            // End the variable
            pastType = 'number';

            finalValue += currentNum;

            currentNum = '';
        }
    }

    return finalValue.replace(/\n/g,'\\n').replace(/\r/g,'');
}
function compile() {
    if (fatalError) {
        console.error('\x1b[31mFailed to compile program\x1b[0m');
        return;
    }

    // Variables
    var variablesCode = '';

    // Manage string variables
    variables.forEach((variable) => {
        var made = false;
        const variableType = variable.type.slice(1, -1);
        if (variableType == 'string') {
            variablesCode += `std::string ${variable.identification}=${variable.value};`;
            made = true;
        }
        if (variableType == 'number') {
            variablesCode += `double ${variable.identification}=${variable.value};`;
            made = true;
        }
        if (variableType == 'array') {
            createError('Data type not introduced yet');
        }
        if (variableType == 'dictionary') {
            createError('Data type not introduced yet');
        }
        if (!made) {
            createError('Invalid data type: ' + variable.type);
            return;
        }
    })

    const compiledCode =
`// \u00A9 WebWorks Spark
// This is a c++ version of your program
// It's not suggested to edit this file
#include <iostream>
#include <string>
#include <sstream>
#include <iomanip>
void out(const std::string& message) {
    std::cout << message;
}
std::string numToString(double num) {
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(10) << num; // Corrected: use num instead of value
    std::string input = oss.str();
    
    std::string result;
    for (int i = input.size() - 1; i >= 0; --i) {
        if (input[i] == '0' || input[i] == '.') {
            // If the character is '0' or '.', skip it.
            continue;
        } else {
            // If it's any other character, break the loop.
            result = input.substr(0, i + 1);
            break;
        }
    }
    return result; // Added a semicolon here
}
${variablesCode}

int main(){
    ${finalCode}
    return 0;
}`;
    fs.writeFile(__dirname+'/build.cpp', compiledCode, (err) => {
        if (err) {
            createError('Error compiling to file:', err);
        } else {
            console.log('Initial build complete');
            if (debug) {
                console.log('Debug mode active, skipping executable building.');
            } else {
                // Check the output file location exists
                fs.writeFile(outputFile, 'Testing directory is writable.\n\nIf you see this it\'s likely GCC failed to compile your app', (err) => {
                    if (err) {
                        createError('Invalid output location:');
                    } else{
                        const { exec } = require('child_process');

                        const command = `"${__dirname}/mingw64/bin/g++.exe" "${__dirname}/build.cpp" -o "${outputFile}" -static -static-libgcc -static-libstdc++`;
        
                        console.log('Building...');
        
                        // Execute the build command
                        exec(command, (error, stdout, stderr) => {
                            if (error) {
                                createError(`Building failed: `/*+error*/);
                                return;
                            }
        
                            console.log('Build successful!');
                            console.log('Finishing off');
                            console.log('Removing temp files');
        
                            fs.unlink(__dirname+'/build.cpp', (err) => {
                                if (err) {
                                    createError(`Error removing temp file: ${err}`);
                                    return;
                                }
                                console.log('Complete');
                            });
                        });
                    }
                });
            }
        }
    });
}
function fullDir(str) {
    // Check if the string has at least two characters
    if (str.length >= 2) {
        // Check if the second character is a colon
        if (str.charAt(1) === ':') {
            return true;
        }
    }
    return false;
}