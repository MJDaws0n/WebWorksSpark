# WebWorksSpark
WebWorksSpark is a programing language coded specifically for [WebWorks](https://webworkshub.online)

# Current
It's currently under development and being made in NodeJS, and the language is being compiled into c++.

# Future
In the near future, WebWorksSpark will be compiled into assembly to allow for maximum effeciency, it's also planned for the compiler to be re-written in WebWorksSpark to also allow faster compiling that NodeJS can currenly offer.

# Setup
At the moment there is no instilation, so you are required to install the dependancies manually. For now, while it's ran through node and not standalone, go to `./compiler/` and run
```sh
npm i
```
This will require nodeJS and NPM to be installed.

Then, procceed to download mingw from [here](https://winlibs.com/#download-release). Unzip the file and add it to the `./compiler/` folder. Ensure the file is called `mingw64` exactly and inside that folder you can see the `bin` folder.

# How to build
## Build
Run this command in a command line to build your programm. The first argument is just to tell nodeJS where the JavaScript file you want to run is. For WebWorks Spark, it's located in the compiler folder. The `WWS FILE LOCATION` should be replaced by the location of your WWS file, and `EXE OUTPUT LOCATION`, should be replaced with where you want to put your exe file.
```sh
node .\compiler\app.js '[WSS FILE LOCATION]' '[EXE OUTPUT LOCATION]'
```

This is an example in what I ran to build the example Number Adder program
```sh
node .\compiler\app.js '.\Example Projects\Number Adder\main.wws' '.\Example Projects\Number Adder\main.exe'
```
## Debug
Debug mode will not compile your program to an exe, it will just build it to c++ located in the compiler directory and called `build.cpp`. This is meant if you want to modify or make your own programs outside of WebWorks Spark. It's not really suggested as it's not exactly formatted for people to be able to read it easily.
```sh
node .\compiler\app.js '[WSS FILE LOCATION]' '[EXE OUTPUT LOCATION]' debug
```

# How to run
Double click the exe file.<br>
Yeah, it's that easy.

The programm will immediately quit if there is not inputs or long loops, this is just because it quits once it finishes running. To see it in action, add an input at the end of your code, or, open a terminal, and type
```sh
.'[EXE LOCATION]'
```

For example
```sh
.'.\Example Projects\Number Adder\main.exe'
```
To build the Number Adder example project

# Syntax
Everything is function based. Like, every single thing.

## log
<b>Description:</b> Logs a message to the console


### Arguments:

- <b>Message</b>:<br>
<b>Description:</b> The Message to log to the console
<br>
<b>Data type:</b> String, Number, Boolean

<b>Example:</b>
```wss
log('Hello World!');
```

## def
<b>Description:</b> Creates a new variable


### Arguments:
- <b>Variable Name</b>:<br>
<b>Description:</b> The name of the variable
<br>
<b>Data type:</b> [Monotype String](https://github.com/MJDaws0n/WebWorksSpark/tree/main?tab=readme-ov-file#monotype-string)

- <b>Variable Data Type</b>:<br>
<b>Description:</b> The data type of the variable, can be 'string' or 'number'
<br>
<b>Data type:</b> Monotype String - String only, must not contain variables or any other type

- <b>Variable Value</b>:<br>
<b>Description:</b> The content of the variable
<br>
<b>Data type:</b> Must match type of variable

<b>Example:</b>
```wss
def('name', 'string', 'John Doe');
```

## mod
<b>Description:</b> Modifies an existing variable


### Arguments:
- <b>Variable Name</b>:<br>
<b>Description:</b> The name of the variable
<br>
<b>Data type:</b> Monotype String - String only, must not contain variables or any other type

- <b>New Variable Value</b>:<br>
<b>Description:</b> The new content of the variable
<br>
<b>Data type:</b> Must match type of variable

<b>Example:</b>
```wss
mod('name', 'Jane Smith');
```



# Language
## Monotype String
A Monotype String, is a data type where a string can be placed, but the string cannot include a variable or other function. For example, the following is a Monotype String,
```wws
'Hello World'
```
However, these are not:
```wws
'Hello ' + 'World'
```
```wss
'Hello ' + variable
```
```wss
'Hello ' + myFunction()
```
```wss
15
```
```wss
true
```
```wss
variable
```
```wss
myFunction()
```