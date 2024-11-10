// Build command
const { exec } = require('child_process');
const fs = require('fs/promises');

const fileExists = async (filePath) => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
};
class Builder{
    path = null;
    interpreter = null;

    constructor(outputFile, interpreter){
        this.path = outputFile;
        this.interpreter = interpreter;
    }
    async compile(code){
        return new Promise((resolve, reject) => {
            let variableString = '';

            this.interpreter.variables.forEach(variable => {
                variableString += `Variable ${variable.id} = {"${variable.name}", "null", "null"};`
            });

            const writeCode = 
            `
            #include <iostream>{NL}
            #include <string>{NL}
            #include <vector>{NL}
            #include <variant>{NL}
            #include <sstream>{NL}
            #include <memory>{NL}   

            struct Variable {
                std::string name;
                std::string type;
                std::variant<std::string, std::shared_ptr<Variable>> value;
            };

            Variable msg_out(const Variable& var) {
                std::visit([](auto&& arg) {
                    std::cout << arg << std::endl;
                }, var.value);

                return Variable{
                    "WWS_TEMP_STRING",
                    "string",
                    var.value
                };
            }

            int stringToInt(const std::string& str) {
                try {
                    return std::stoi(str);
                } catch (...) {
                    return 0;
                }
            }

            Variable maths_multiply(const std::vector < Variable > & vars) {
                int accumulator = 1;
                for (const auto & msg: vars) {
                    if (std::holds_alternative < std::string > (msg.value)) {
                        accumulator *= stringToInt(std::get < std::string > (msg.value));
                    } else if (std::holds_alternative < std::shared_ptr < Variable >> (msg.value)) {
                    Variable combination = (maths_multiply({
                        * std::get < std::shared_ptr < Variable >> (msg.value)
                    }));
                        accumulator *= stringToInt(std::get < std::string > (combination.value));
                    }
                }
                return Variable {
                    "WWS_TEMP_NUMBER",
                    "number",
                    std::to_string(accumulator)
                };
            }

            Variable str_combine(const std::vector < Variable > & vars) {
                std::string output = "";
                int firstTypeIsNum = 0;
                int accumulator = 0;
                
                for (const auto & msg: vars) {
                    if (std::holds_alternative < std::string > (msg.value)) {
                    if(firstTypeIsNum == 0 && (msg.type) == "number"){
                        firstTypeIsNum = 1;
                    } else if(firstTypeIsNum == 0){
                        firstTypeIsNum = -1;
                    }
                    
                    if(firstTypeIsNum == 1){
                        accumulator += stringToInt(std::get < std::string > (msg.value));
                    } else{
                        output += std::get < std::string > (msg.value);
                    }
                    } else if (std::holds_alternative < std::shared_ptr < Variable >> (msg.value)) {
                    Variable combination = (str_combine({
                        * std::get < std::shared_ptr < Variable >> (msg.value)
                    }));
                    
                    if(firstTypeIsNum == 0 && (combination.type) == "number"){
                        firstTypeIsNum = 1;
                    } else if(firstTypeIsNum == 0){
                        firstTypeIsNum = -1;
                    }
                    
                    if(firstTypeIsNum == 1){
                        accumulator += stringToInt(std::get < std::string > (combination.value));
                    } else{
                        output += std::get < std::string > (combination.value);
                    }
                    }
                }
                if(firstTypeIsNum == 1){
                    return Variable {
                        "WWS_TEMP_NUMBER",
                        "number",
                        std::to_string(accumulator)
                    };
                }
                return Variable {
                    "WWS_TEMP_STRING",
                    "string",
                    output
                };
            }

            std::string give_num() {
                return "123";
            }
    
            int main() {
                ${variableString}
                ${code}
                return 0;
            }`.replace(/\n/g, "").replace(/ {4}/g, "").replace(/{NL}/g, "\n");
            fs.writeFile(`${__dirname}/build.cpp`, writeCode, 'utf8')
                .then(() => resolve())
                .catch(error => reject(`Error creating temporary build file. Check "${__dirname}" is writable.`));
        });
    }
    async build(){
        if(this.path === null){
            throw new Error("Path not set");
        }
        return new Promise((resolve, reject) => {
            exec(`"${__dirname}/mingw64/bin/g++.exe" "${__dirname}/build.cpp" -o "${this.path}" -static -static-libgcc -static-libstdc++`, (error, stdout, stderr) => {
                if (error) {
                    reject(error.message);
                }
                if (stderr) {
                    resolve()
                }
            });
        });
    }
}

function error(message, line) {
    // Output in red
    console.error(`\x1b[31mError on line ${line}: ${message}\x1b[0m`);
    process.exit(1);
}
function buildError(message, line) {
    // Output in red
    console.error(`\x1b[31mBuild Error: ${message}\x1b[0m`);
    process.exit(1);
}

class Function{
    available = [
        "out",
        "giveNum"
    ]
    split(code, number){
        let inString = false;
        let functionName = '';
        let doneFunctionName = false;
        let currentArg = '';
        const args = [];
        let bracketsOpen = 0;

        for (let index = 0; index < code.length; index++) {
            const character = code[index];
            if(character === '"' && inString == '"'){
                inString = false;
            } else
            if(character === '\'' && inString == '\''){
                inString = false;
            } else
            if(character === '"' && !inString){
                inString = '"';
            } else
            if(character === '\'' && !inString){
                inString = '\'';
            }

            if(doneFunctionName){
                if(character === '(' && !inString){
                    bracketsOpen++;
                }
                if(character === ')' && !inString){
                    bracketsOpen--;
                }
                if(character === ',' && !inString && bracketsOpen == 0){
                    args.push(currentArg);
                    currentArg = '';
                } else{
                    currentArg += character;
                }

                // Is the last character
                if(!code[index+1] && code[index] === ')'){
                    args.push(currentArg.slice(0, -1));
                    currentArg = '';

                    // Add a bracket to the list to even things out
                    bracketsOpen++;
                } else if(!code[index+1] && code[index] !== ')'){
                    error('Unexpected end of code. Expected a closing parenthesis.', number);
                }
            }

            if(character === '(' && !inString){
                doneFunctionName = true;
            }
            if(!doneFunctionName){
                functionName += character;
            }
        }

        if(bracketsOpen < 0){
            // To many closing brackets
            error('Unexpected closing parenthesis.', number);
        }
        if(bracketsOpen > 0){
            // To many openning brackets
            error('Expected a closing parenthesis.', number);
        }

        return { 'name': functionName, 'args': args };
    }
    isAvailable(name){
        // Check this.avaiable to see if the function is available
        return this.available.includes(name);
    }
    process(name, args, number, interpreter){
        switch (name) {
            case 'out':{
                const message = args.join('+');
                const out = 'str_combine({'+interpreter.manageParameter(message, number).out.join(',')+'})';
                return `msg_out(${out})`
            }
            case 'giveNum':{
                return `give_num()`
            }
            default:{
                error(`Function ${name} is not available.`, number);
                break;
            }
        }
    }
}
class Interpreter{
    variables = [];
    getOps(code){
        // Parse between each ;
        let lineNum = 1;
        let inString = false;
        const operations = [];
        let currentOperation = '';
        let inComment = false;
        let stringOpenedLine = 0;

        for (let index = 0; index < code.length; index++) {
            const character = code[index];
            if(inComment && character !== '\n'){
                continue;
            } else
            if(inComment && character === '\n'){
                inComment = false;
                continue;
            }
            
            if(character === '\n' && !inString){
                lineNum++;
                continue;
            } else
            if(character === '\n'){
                lineNum++;
            }

            if(character === '\r'&& !inString){
                continue;
            }
            if(character === ' ' && !inString){
                continue;
            }

            if(character === '"' && inString == '"'){
                inString = false;
                currentOperation += character;
                continue;
            } else
            if(character === '\'' && inString == '\''){
                inString = false;
                currentOperation += character;
                continue;
            } else
            if(character === '"' && !inString){
                stringOpenedLine = lineNum;
                inString = '"';
                currentOperation += character;
                continue;
            } else
            if(character === '\'' && !inString){
                stringOpenedLine = lineNum;
                inString = '\'';
                currentOperation += character;
                continue;
            }

            if(character === '/' && code[index] && code[index+1] ==  '/' && !inString){
                inComment = true;
                continue;
            }

            if(character  === ';' && !inString){
                operations.push({ 'op': currentOperation, 'ln': lineNum });
                currentOperation = '';
            } else{
                currentOperation += character;
            }
        }

        if(inString){
            error('String opened but never closed.', stringOpenedLine);
        }

        return operations;
    }
    determineType(code, number){
        let inString = false;
        let type = null;
        let inBrackets = false;

        for (let index = 0; index < code.length; index++) {
            const character = code[index];
            if(character === '"' && inString == '"'){
                inString = false;
                continue;
            } else
            if(character === '\'' && inString == '\''){
                inString = false;
                continue;
            } else
            if(character === '"' && !inString){
                inString = '"';
                continue;
            } else
            if(character === '\'' && !inString){
                inString = '\'';
                continue;
            }

            if(character === '(' && !inString){
                inBrackets = true;
            }
            if(character === ')' && !inString && inBrackets){
                inBrackets = false;
            }

            if(character == '=' && !inString){
                // We know immediately it is an assignment
                type = 'assignment';
                break;
            }

            if(code[index-1] && inBrackets){
                // As it's not already determined it is conditional, it must be a function, condition, or iteration
                if(code.slice(0, index).trim() === 'if'){
                    type = 'condition';
                    break;
                } else
                if(code.slice(0, index).trim() === 'while'){
                    type = 'while';
                    break;
                } else
                if(code.slice(0, index).trim() === 'for'){
                    type = 'for';
                    break;
                } else
                if(code.slice(0, index).trim().startsWith('function')){
                    type = 'functionAssignment';
                    break;
                } else{
                    type = 'function';
                    break;
                }
            }
        }

        if(type === null){
            error('Invalid operation.', number);
        }

        return type;
    }
    manageParameter(code, number){
        let type = null;
        let out = [];

        // Split by +
        const parts = splitByPlus(code);

        // Loop through each part
        parts.forEach(part => {
            const processedPart = processPart(part, number, this);
            if(type === null){
                type = processedPart.type;
            }
            out.push(processedPart.out);
        });

        function processPart(code, number, that){
            let out = '';
            let type = null;
            let inString = false;
            let currentVariable = '';
            let numberStr = '';
            let bracketsOpen = 0;
            let inBrackets = false;
            let inBracketsCode = '';
    
            for (let index = 0; index < code.length; index++) {
                const character = code[index];

                if(character === '(' && !inString){
                    bracketsOpen++;
                    inBrackets = true;
                }
                if(character === ')' && !inString){
                    bracketsOpen--;
                }

                if(!inBrackets){
                    if(character === '"' && inString == '"' && (type === null || type === 'string')){
                        inString = false;
                        if(code[index+1] && type === 'string'){
                            error('String already closed.', number);
                        }
                    } else
                    if(character === '\'' && inString == '\'' && (type === null || type === 'string')){
                        inString = false;
                        if(code[index+1] && type === 'string'){
                            error('String already closed.', number);
                        }
                    } else
                    if(character === '"' && !inString){
                        inString = '"';
                    } else
                    if(character === '\'' && !inString){
                        inString = '\'';
                    }

                    // Check the first character to see what type it is
                    if((character == '"' || character == '\'') && !code[index-1] && type === null){
                        type = 'string';
                        out += '"';
                    } else
                    if(isValidNumberChar(character) && !code[index-1]){
                        type = 'number';
                    } else
                    if(!code[index-1]){
                        // Must be a function of variable
                        type = 'variable|function';
                    }

                    // Check if it's not the first character
                    if(type === 'variable|function'){
                        if(!code[index+1]){
                            // At the end of the part
                            currentVariable += character;

                            if(character === ')'){
                                // Type is function
                                type = 'function';
                                
                                const functionBuilder = new Function();
                                const newFunction = functionBuilder.split(currentVariable, number);

                    
                                if(!functionBuilder.isAvailable(newFunction.name)){
                                    error(`Function ${newFunction.name} is not available.`, number);
                                }
                    
                                out += (functionBuilder.process(newFunction.name, newFunction.args, number, that));
                            } else{
                                // Type is variable
                                type = 'variable';

                                // That is just the classes 'this'
                                const variable = that.getVariable(currentVariable);

                                if(variable === null){
                                    error(`Undefined variable -> ${currentVariable}.`, number);
                                }

                                out += variable.id;
                            }
                        } else{
                            currentVariable += character;
                        }
                    }

                    if(type === 'number' && code[index]){
                        numberStr += character;             
                    }
                    if(type === 'number' && !code[index+1]){;
                        const sums = splitByTimesAndDivide(numberStr);
                        let numOutStr = '';

                        numOutStr += 'std::make_shared<Variable>(';
                        sums.forEach(sum => {
                            if(sum.startsWith('*')){
                                numOutStr += `maths_multiply({Variable{"WWS_TEMP_NUMBER", "number", "${sum.slice(1)}"},`;
                            } else
                            if(sum.startsWith('/')){
                                numOutStr += `maths_divide({Variable{"WWS_TEMP_NUMBER", "number", "${sum.slice(1)}"}},`;
                            } else{
                                numOutStr += `Variable{"WWS_TEMP_NUMBER", "number", "${sum}"},`;
                            }
                        });
                        numOutStr = numOutStr.slice(0, -1);
                        sums.forEach(sum => {
                            if(sum.startsWith('*') || sum.startsWith('/')){
                                numOutStr += '})'
                            }
                        });

                        numOutStr += ')';

                        out += `Variable{"WWS_TEMP_NUMBER", "number", ${numOutStr}}`;
                    }

                    if(inString && code[index-1] && type === 'string'){
                        out += character;
                    } else
                    if(type === 'string' && !inString && !code[index+1]){
                        // At the end of the string so add quote
                        out += '"';
                    }

                    // Last character string
                    if(!code[index+1] && type === 'string'){
                        out = `Variable{"WWS_TEMP_STRING", "string", ${out}}`;
                    }
                }

                if(inBrackets){
                    inBracketsCode += character;
                }

                if(bracketsOpen == 0 && inBrackets){
                    inBrackets = false;
                    // Split by +
                    const parts = splitByPlus(inBracketsCode.slice(1, -1));
                    const outParts = [];
                    let localFirstType = null;
                    parts.forEach(part => {
                        const processedPart = processPart(part, number, that);
                        if(localFirstType === null){
                            localFirstType = processedPart.type;
                        }
                        outParts.push(processedPart.out);
                    });
                    out += `Variable { "WWS_TEMP_${localFirstType.toUpperCase()}","${localFirstType}",std::make_shared<Variable>(str_combine({`+outParts.join(',')+'}))}';
                    inBracketsCode = '';
                }
            }

            return { 'type': type, 'out': out };
        }
        function splitByPlus(code){
            let inString = false;
            let inBracketsCount = 0;
            let currentPart = '';
            const parts = [];
    
            for (let index = 0; index < code.length; index++) {
                const character = code[index];
                if(character === '"' && inString == '"'){
                    inString = false;
                } else
                if(character === '\'' && inString == '\''){
                    inString = false;
                } else
                if(character === '"' && !inString){
                    inString = '"';
                } else
                if(character === '\'' && !inString){
                    inString = '\'';
                }

                if(character === '(' && !inString){
                    inBracketsCount++;
                }
                if(character === ')' && !inString){
                    inBracketsCount--;
                }

                if(character === '+' && !inString && inBracketsCount == 0){
                    parts.push(currentPart);
                    currentPart = '';
                } else{
                    currentPart += character;
                }

                // Is the last character
                if(!code[index+1]){
                    parts.push(currentPart);
                    currentPart = '';
                }
            }

            return parts;
        }

        function splitByTimesAndDivide(code){
            let inString = false;
            let inBracketsCount = 0;
            let currentPart = '';
            const parts = [];
    
            for (let index = 0; index < code.length; index++) {
                const character = code[index];
                if(character === '"' && inString == '"'){
                    inString = false;
                } else
                if(character === '\'' && inString == '\''){
                    inString = false;
                } else
                if(character === '"' && !inString){
                    inString = '"';
                } else
                if(character === '\'' && !inString){
                    inString = '\'';
                }

                if(character === '(' && !inString){
                    inBracketsCount++;
                }
                if(character === ')' && !inString){
                    inBracketsCount--;
                }

                if(character === '*' && !inString && inBracketsCount == 0){
                    parts.push('*'+currentPart);
                    currentPart = '';
                } else if(character === '/' && !inString && inBracketsCount == 0){
                    parts.push('/'+currentPart);
                    currentPart = '';
                } else{
                    currentPart += character;
                }

                // Is the last character
                if(!code[index+1]){
                    parts.push(currentPart);
                    currentPart = '';
                }
            }

            return parts;
        }

        return { 'type': type, 'out': out };
    }
    assignment(code, number){
        let type = null;
        let variableName = '';
        let foundName = false;
        let out = '';

        for (let index = 0; index < code.length; index++) {
            const character = code[index];
            if(!foundName){
                if(character === '='){
                    foundName = true;
                    if(code[index+1] === '"' || code[index+1] === "'"){
                        type = 'string';
                    }

                    if(isValidNumberChar(code[index+1])){
                        type = 'number';
                    }

                    continue;
                }
                variableName += character;

                if(character == ' '){
                    error('Error variable name is not set correctly', number);
                }
            } else{
                out += character;
            }
        }

        // For testing purposes
        if(type === null){
            type = 'string';
        }

        const values = this.manageParameter(out, number).out;
        values.forEach((value, index) => {
            if (value.startsWith('VARIABLE_')) {
                values[index] = value;
            }
        });

        const value = `"WWS_TEMP_${type.toUpperCase()}","${type}",std::make_shared<Variable>(str_combine({`+values.join(',')+'}))';

        const variable = { 'type': type, 'name': variableName, 'out': value, 'id': 'VARIABLE_' + variableName };
        const oldVar = this.getVariable(variableName);

        if(oldVar !== null){
            // Variable is already defined, just update some infomation on it
            oldVar.type = variable.type
            oldVar.out = variable.out
        } else{
            // Variable is not defined, so create it
            this.variables.push(variable);
        }

        return variable;
    }
    getVariable(name) {
        return this.variables.find(variable => variable.name === name) || null;
    }
    whileIteration(code, number){

    }
    forIteration(code, number){

    }
    functAssignment(code, number){

    }
    iteration(code, number){

    }
}
function isValidNumberChar(input) {
    return /^[0-9]$/.test(input.trim());
}

(async ()=>{
    const filePath = process.argv[2];
    if (!filePath) {
        throw new Error("Please provide a file path as the first argument.");
    }
    if(!(await fileExists(filePath))){
        throw new Error("File \""+filePath+"\" not found");
    }

    const outPath = process.argv[3];
    if (!outPath) {
        throw new Error("Please provide a file path as the second argument.");
    }

    const data = await fs.readFile(filePath, 'utf8');

    const interpreter = new Interpreter();
    const operations = interpreter.getOps(data);
    let code = '';

    operations.forEach(operationInfo => {
        const operation = operationInfo['op'];
        const line = operationInfo['ln'];

        const type = interpreter.determineType(operation, line);
        if(type == 'function'){
            const functionBuilder = new Function();
            const newFunction = functionBuilder.split(operation, line);

            if(!functionBuilder.isAvailable(newFunction.name)){
                error(`Function ${newFunction.name} is not available.`, line);
            }

            code += (functionBuilder.process(newFunction.name, newFunction.args, line, interpreter))+';';
        }
        if(type == 'assignment'){
            const variable = interpreter.assignment(operation, line);
            code += `${variable.id} = {"${variable.name}", "${variable.type}", std::make_shared<Variable>(Variable{${variable.out}})};`;
        }
    });
    
    // Build the app
    const builder = new Builder(outPath, interpreter);
    try {
        await builder.compile(code);
        await builder.build();
    } catch (error) {
        buildError('Error building');
    }

    console.log('Built successfully');
})();