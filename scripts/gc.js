//We need some way to go from a character to an integer. This is it.
//Params: 'char' (String), the character you want an integer representation of
//Returns: Integer representation of input character. If the character is not 0-9, return -1.
function getIntFromString(char) {
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
}


var input = process.argv[2];	//Read input from the command line

//Splitting the input on an empty string gives us a character array. 
//Reversing it is optional but it makes the for loop and exponents easier to read.
var chars = input.split("").reverse();

var result = 0;					//Where we'll store our final integer representation
var success = true;				//Boolean, tells us if we encountered any errors

//Iterate over our array
for(var i = 0; i < chars.length; i++) {
	//We expect the +/- sign to be the last character. If its a - sign, multiply the result by -1.
	//If its a + sign, you could do nothing or multiply by 1. I chose to multiply by 1 for symmetry's sake.
	if(i == chars.length - 1 && chars[i] == "-") {
		result *= -1;
	} else if(i == chars.length - 1 && chars[i] == "+") {
		result *= 1;
	} else {
		//The exponent is necessary to turn 3 into 300, 4 into 40, etc. depending on its place in the string
		var exponent = i;
		//Call our string -> int
		var integer = getIntFromString(chars[i]);
		//getIntFromString returns -1 for an unknown character, so we check that here
		if(integer < 0) {
			//the input had a bad character in it. Flip success to false, print some output for the user, and break out of the loop.
			success = false;
			console.log("your input string doesn't seem to be correct. stopping execution");
			break;
		}
		//We're good to go, so multiply our integer by 10^exponent and add that to our current result. See note 1 at the bottom of this file.
		var adder = integer * Math.pow(10, exponent);
		result += adder;
	}
}

//If we didn't come across any bad characters
if(success) {
	console.log(result);
	if(parseInt(input) == result) {
		console.log("It worked!");
	}	
}



var TreeNode = function(value, left, center, right) {
	this.value = value;
	this.left = left;
	this.center = center;
	this.right = right;
}

TreeNode.prototype = {
	toString: function() {
		var string = "Value: " + this.value;
		if(this.left) {
			string += " Left: " + this.left.value;
		}
		if(this.center) {
			string += " Center: " + this.center.value;
		}
		if(this.right) {
			string += " Right: " + this.right.value;
		}
		return string;
	}
}

var Tree = function(rootValue) {
	this.root = new TreeNode(rootValue);
}

Tree.prototype = {
	addNode: function(value) {
		if(!this.root) {
			this.root = new TreeNode(value);
		} else {
			var prevNode;
			var curNode = this.root;
			while(curNode) {
				if(value == curNode.value) {
					prevNode = curNode;
					curNode = curNode.center;
					if(!curNode) {
						prevNode.center = new TreeNode(value);
					}
				} else if(value < curNode.value) {
					prevNode = curNode;
					curNode = curNode.left;
					if(!curNode) {
						prevNode.left = new TreeNode(value);
					}
				} else if(value > curNode.value) {
					prevNode = curNode;
					curNode = curNode.right;
					if(!curNode) {
						prevNode.right = new TreeNode(value);
					}
				}
			}
		}
	},
	traverse: function() {
		var nodes = [ this.root ];
		while(nodes.length > 0) {
			var node = nodes.pop();
			console.log(node.toString());
			if(node.left) {
				nodes.unshift(node.left);	
			}
			if(node.center) {
				nodes.unshift(node.center);	
			}
			if(node.right) {
				nodes.unshift(node.right);	
			}
		}
	}
}

var myTree = new Tree(5);
myTree.addNode(14);
myTree.addNode(4);
myTree.addNode(9);
myTree.addNode(5);
myTree.addNode(7);
myTree.addNode(2);
myTree.addNode(2);
myTree.addNode(10);
myTree.addNode(6);
myTree.traverse();

//Note 1:
//If this example needed to expand to be able to handle hex, binary, etc., I would modify the 'getIntFromString'
//method to take a second parameter: base representation. With the string and the number type, I could limit or expand
//the allowable characters, for example restricting to (0,1) for binary or expanding to (0-9,A-F). The only other change
//would be replacing the 10 in Math.pow(10, exponent) to Math.pow(base, exponent) where base is 2 for binary, 16 for hex etc.