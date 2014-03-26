///////////
//UTILITIES
///////////

exports.positionToSort = function(pos) {
	switch(pos)
	{
		case "C":
			return 1;
		case "1B":
			return 2;
		case "2B":
			return 3;
		case "3B":
			return 4;
		case "SS":
			return 5;
		case "2B/SS":
			return 6;
		case "1B/3B":
			return 7;
		case "OF":
			return 8;
		case "UTIL":
			return 9;
		case "P":
			return 10;
		case "DL":
			return 11;
		case "Bench":
			return 12;
		default:
			return 100;
	}	
}

exports.positionToStatus = function(status) {
	switch(status)
	{
		case "C":
		case "1B":
		case "2B":
		case "3B":
		case "SS":
		case "2B/SS":
		case "1B/3B":
		case "OF":
		case "UTIL":
		case "P":
		case "A":
			return "A";
		case "Bench":
		case "MIN":
		case "NRI":
		case "DES":
		case "RM":
			return "MIN";
		case "DL":
		case "D15":
		case "D60":
			return "DL";
		case "RST":
			return "RST";
		case "SUSP":
			return "SUSP";
		case "PL":
			return "A";
		case "FA":
			return "FA";
		default:
			return "";
	}
}