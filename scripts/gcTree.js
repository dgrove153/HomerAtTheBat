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