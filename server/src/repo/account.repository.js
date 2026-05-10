const Account = require("../models/Account")

exports.findByEmail = async (email) => {
    return await Account.findOne({ email })
}