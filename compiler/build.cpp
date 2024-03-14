// © WebWorks Spark
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
    oss << std::fixed << std::setprecision(10) << num;
    std::string input = oss.str();
    
    std::string result;
    for (int i = input.size() - 1; i >= 0; --i) {
        if (input[i] == '0' || input[i] == '.') {
            if(input[i] == '.'){
                result = input.substr(0, i);
                break; 
            }
            continue;
        } else {
            // If it's any other character, break the loop.
            result = input.substr(0, i + 1);
            break;
        }
    }
    return result;
}
double VARIBALE_kSd1p6npfPKJwgf10lZLq8qKlapPHM=3.14159265359;

int main(){
    out(numToString(VARIBALE_kSd1p6npfPKJwgf10lZLq8qKlapPHM-1-VARIBALE_kSd1p6npfPKJwgf10lZLq8qKlapPHM+(1+1)(10/5)+2));
    return 0;
}