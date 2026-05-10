const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const accountRepo = require("../repo/account.repository");

exports.login = async (email, password) => {
    const account = await accountRepo.findByEmail(email);

    if (!account) {
        throw new Error("Account not found!!!")
    }


    if (account.provider !== "local") {
        throw new Error("Please login with correct method!!!")
    }

    if (!account.isVerified) {
        throw new Error("Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực OTP!!!")
    }

    const isMatch = await bcrypt.compare(password, account.passwordHash);

    if (!isMatch) {
        throw new Error("Password is incorrect!!!")
    }

    const payload = {
        id: account._id,
        email: account.email,
        role: account.role
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    const redirectUrl = account.role === "admin" ? "/admin/profile" : "/user/profile";

    return {
        token: token,
        redirectUrl: redirectUrl
    }
}