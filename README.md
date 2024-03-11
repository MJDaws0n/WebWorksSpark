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

Then, procceed to download mingw from [here](https://sourceforge.net/projects/mingw-w64/files/mingw-w64/mingw-w64-release/). Unzip the file and add it to the `./compiler/` folder. Ensure the file is called mingw64 exactly and inside you see the bin folder.