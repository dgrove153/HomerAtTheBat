//We need some way to go from a character to an integer. This is it.
//Params: 'char' (String), the character you want an integer representation of
//Returns: Integer representation of input character. If the character is not 0-9, return -1.
function getIntFromString(char, base) {
	if(base == 10) {
		switch(char)
		{
			case "1":
				return 1;
			case "2":
				return 2;
			case "3":
				return 3;
			case "4":
				return 4;
			case "5":
				return 5;
			case "6":
				return 6;
			case "7":
				return 7;
			case "8":
				return 8;
			case "9":
				return 9;
			case "0":
				return 0;
			default:
				return -1;
		}	
	} else if(base == 2) {
		switch(char) {
			case "1":
				return 1;
			case "0":
				return 0;
			default: 
				return -1;
		}
	} else if(base == 16) {
		switch(char) {
			case "1":
				return 1;
			case "2":
				return 2;
			case "3":
				return 3;
			case "4":
				return 4;
			case "5":
				return 5;
			case "6":
				return 6;
			case "7":
				return 7;
			case "8":
				return 8;
			case "9":
				return 9;
			case "0":
				return 0;
			case "a":
				return 10;
			case "b":
				return 11;
			case "c":
				return 12;
			case "d":
				return 13;
			case "e":
				return 14;
			case "f":
				return 15;
			default:
				return -1;	
		}
	}
}

//Get the integer representation of the base from the input string
//Params: 'base' (String), the character you want the integer base of
//Returns: Integer representation of the base. Defaults to 10.
function getBaseFromString(base) {
	switch(base) {
		case "10":
			return 10;
		case "2":
			return 2;
		case "16":
			return 16;
		default:
			return 10;
	}
}

function convertStringToInteger(string, base) {
	//Splitting the input on an empty string gives us a character array. 
	//Reversing it is optional but it makes the for loop and exponents easier to read.
	if(!string || string.length == 0) {
		console.log("You didn't give me a string. stopping execution");
		return;
	}
	var chars = string.split("").reverse();

	var result = 0;				//Where we'll store our final integer representation
	var success = true;			//Boolean, tells us if we encountered any errors

	for(var i = 0; i < chars.length; i++) {			//Iterate over our array
		//We expect the +/- sign to be the last character. If its a - sign, multiply the result by -1.
		//If its a + sign, you could do nothing or multiply by 1. I chose to multiply by 1 for symmetry's sake.
		if(i == chars.length - 1 && chars[i] == "-") {
			result *= -1;
		} else if(i == chars.length - 1 && chars[i] == "+") {
			result *= 1;
		} else {
			var exponent = i;	//The exponent is necessary to turn 3 into 300, 4 into 40, etc. depending on its place in the string
			var integer = getIntFromString(chars[i], base);		//Call our string -> int function
			if(integer < 0) {	//getIntFromString returns -1 for an unknown character, so we check that here
				//the input had a bad character in it. Flip success to false, print some output for the user, and break out of the loop.
				success = false;
				console.log("your input string doesn't seem to be correct. stopping execution");
				break;
			}
			//We're good to go, so multiply our integer by base^exponent and add that to our current result. See note 1 at the bottom of this file.
			var adder = integer * Math.pow(base, exponent);
			result += adder;
		}
	}

	//If we didn't come across any bad characters
	if(success) {
		console.log("Let's verify...")
		console.log("Using parseInt: " + parseInt(input, base));
		console.log("Using my function: " + result);
		if(parseInt(input, base) == result) {
			console.log("It worked!");
		}	
	}
}

var input = process.argv[2];					//Read input from the command line
var base = getBaseFromString(process.argv[3]);	//Read base from the command line

convertStringToInteger(input, base);

//Note 1:
//I had an implementation of this question that only handled base 10 but I saw how simple it would be to expand it
//to handle other bases. What I did to be able to handle hex, binary, etc. was modify the 'getIntFromString'
//method to take a second parameter: base representation. With the string and the number type, I could limit or expand
//the allowable characters, for example restricting to (0,1) for binary or expanding to (0-9,A-F). The only other change
//was replacing the 10 in Math.pow(10, exponent) to Math.pow(base, exponent) where base is 2 for binary, 16 for hex etc.
//I defaulted to base 10 in the getBaseFromString function.