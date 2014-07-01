var getIntFromString = function(char) {
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

var input = process.argv[2];

var chars = input.split("").reverse();

var result = 0;

// for(var i = chars.length - 1; i >= 0; i--) {
// 	if(i == 0 && chars[i] == "-") {
// 		result *= -1;
// 	} else {
// 		var exponent = chars.length - 1 - i;
// 		var integer = getIntFromString(chars[i]);
// 		console.log(exponent);
// 		console.log(integer);
// 		var adder = integer * Math.pow(10, exponent)
// 		console.log(adder);
// 		result += adder;
// 	}
// }

var success = true;

for(var i = 0; i < chars.length; i++) {
	if(i == chars.length - 1 && chars[i] == "-") {
		result *= -1;
	} else {
		var exponent = i;
		var integer = getIntFromString(chars[i]);
		if(integer < 0) {
			success = false;
			console.log("your input string doesn't seem to be correct. stopping execution");
			break;
		}
		var adder = integer * Math.pow(10, exponent);
		result += adder;
	}
}

if(success) {
	console.log(result);
	if(parseInt(input) == result) {
		console.log("it worked");
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
				//console.log("New Node: " + value + ", Cur Node: " + curNode.value);
				if(value == curNode.value) {
					prevNode = curNode;
					curNode = curNode.center;
					if(!curNode) {
						//console.log("adding " + value + " to the center of " + prevNode.value);
						prevNode.center = new TreeNode(value);
					}
				} else if(value < curNode.value) {
					prevNode = curNode;
					curNode = curNode.left;
					if(!curNode) {
						//console.log("adding " + value + " to the left of " + prevNode.value);
						prevNode.left = new TreeNode(value);
					}
				} else if(value > curNode.value) {
					prevNode = curNode;
					curNode = curNode.right;
					if(!curNode) {
						//console.log("adding " + value + " to the right of " + prevNode.value);
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
myTree.addNode(4);
myTree.addNode(9);
myTree.addNode(5);
myTree.addNode(7);
myTree.addNode(2);
myTree.addNode(2);
myTree.traverse();