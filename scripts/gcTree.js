//Object to represent a single node. Holds references to the left, center, and right children, as well as its value.
var TreeNode = function(value, left, center, right) {
	this.value = value;
	this.left = left;
	this.center = center;
	this.right = right;
}

//Give it a toString method for printing
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

//Object to represent a tree. It holds a reference to the root node
var Tree = function(rootValue) {
	if(rootValue) {
		console.log("Initializing new tree with root of " + rootValue);
		this.root = new TreeNode(rootValue);
	} else {
		console.log("Initializing new tree with no root node");
		this.root = undefined;
	}
}

Tree.prototype = {
	//Function to add a node to the tree in its proper location
	addNode: function(value) {
		//check to make sure the value exists and is a number
		if(value == undefined|| isNaN(value)) {
			if(value == undefined) {
				console.log("Attempt to add a new node with a null value failed");	
			} else {
				console.log("Value of '" + value + "' is not allowed");
			}
			return;
		}
		console.log("Adding new node with value " + value);
		//If the tree is missing its root node, set it here
		if(!this.root) {
			this.root = new TreeNode(value);
		} else {
			//Descend down the tree, examining the left, center, and right children to compare values and determine which
			//branch we should head down. Once we've found the right spot, we'll have a pointer to the parent node (prevNode)
			//that we set our new node to be the child of.
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
	//Breadth-first tree traversal to print out the tree
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
myTree.addNode(0);
myTree.addNode();
myTree.addNode(7);
myTree.addNode(2);
myTree.addNode("ari");
myTree.addNode(2);
myTree.traverse();