var mongoose = require("mongoose");

var finTranSchema = new mongoose.Schema({
	buyer: String,
	seller: String,
	transaction: {
		type: String,
		value: Number,
		year: Number
	}
}, { collection: 'financialTransactions'});
var FinancialTransaction = mongoose.model('financialTransaction', finTranSchema);
module.exports = FinancialTransaction;
