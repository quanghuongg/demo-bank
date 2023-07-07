// backend.js
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
var jwt = require('jsonwebtoken');


app.use(bodyParser.json());

var accounts = [
    { id: "1", username: "huongnq", balance: 10000000, password: "huongnq", transactionHistory: [] },
    { id: "2", username: "thuhuong", balance: 10000000, password: "thuhuong", transactionHistory: [] },
    { id: "3", username: "khanhngoc", balance: 10000000, password: "khanhngoc", transactionHistory: [] }
];

app.use(express.static(path.join(__dirname, "public")));


app.get("/balances", function (req, res) {
    var balances = accounts.map(account => ({ id: account.id, username: account.username, balance: account.balance }));
    res.json(balances);
});

// API để chuyển tiền
app.post("/transfer", authenticateToken, function (req, res) {
    var user = req.user;
    var sender = user.id;
    var receiver = req.body.receiver;
    var amount = req.body.amount;

    // Kiểm tra tính hợp lệ của dữ liệu

    var senderAccount = accounts.find(account => account.id === sender);
    var receiverAccount = accounts.find(account => account.id === receiver);

    if (!senderAccount || !receiverAccount) {
        res.status(404).json({ message: "Người dùng không tồn tại." });
        return;
    }

    if (senderAccount==receiverAccount){
        res.status(400).json({ message: "Không thể chuyển tiền cho chính mình." });
        return;
    } 

    if (amount < 10000) {
        res.status(400).json({ message: "Số tiền không đủ hạn mức 10000." });
        return;
    }
    if (amount > 1000000) {
        res.status(400).json({ message: "Số tiền vượt quá hạn mức 1000000." });
        return;
    }

    if (senderAccount.balance < amount) {
        res.status(400).json({ message: "Số dư không đủ." });
        return;
    }

    // Thực hiện chuyển tiền
    senderAccount.balance -= amount;
    receiverAccount.balance += amount;

    var senderTransaction = {
        sender: senderAccount.username,
        receiver: receiverAccount.username,
        amount: amount,
        timestamp: new Date(),
        type: "Chuyển tiền"
    };

    var receiverTransaction = {
        sender: sender,
        receiver: receiver,
        amount: amount,
        timestamp: new Date(),
        type: "Nhận tiền"
    };

    // Thêm giao dịch vào lịch sử giao dịch của người gửi và người nhận
    senderAccount.transactionHistory.push(senderTransaction);
    receiverAccount.transactionHistory.push(receiverTransaction);

    res.json({ message: "Giao dịch chuyển tiền thành công." });
});


// API để rút tiền
app.post("/withdraw", authenticateToken, function (req, res) {
    var user = req.user.id;
    var amount = req.body.amount;

    // Kiểm tra tính hợp lệ của dữ liệu

    var userAccount = accounts.find(account => account.id === user);

    if (!userAccount) {
        res.status(404).json({ message: "Người dùng không tồn tại." });
        return;
    }

    if (userAccount.balance < amount) {
        res.status(400).json({ message: "Số dư không đủ." });
        return;
    }

    // Thực hiện rút tiền
    userAccount.balance -= amount;

    var transaction = {
        sender: userAccount.username,
        receiver: null,
        amount: amount,
        timestamp: new Date(),
        type: "Rút tiền"
    };

    // Thêm giao dịch vào lịch sử giao dịch của người rút tiền
    userAccount.transactionHistory.push(transaction);

    res.json({ message: "Giao dịch rút tiền thành công." });
});

// API để lấy lịch sử giao dịch của người dùng
app.get("/transaction-history", authenticateToken, function (req, res) {
    // Kiểm tra tính hợp lệ của token và lấy thông tin người dùng từ token
    var user = req.user;

    // Lấy thông tin user ID từ token
    var userId = user.id;

    // Tìm tài khoản của người dùng trong mảng accounts
    var userAccount = accounts.find(account => account.id === userId);

    if (!userAccount) {
        res.status(404).json({ message: "Người dùng không tồn tại." });
        return;
    }

    // Lấy lịch sử giao dịch của người dùng từ thuộc tính transactionHistory của tài khoản
    var transactionHistory = userAccount.transactionHistory;

    res.json(transactionHistory);
});


// API đăng nhập và tạo token
app.post("/login", function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    // Tìm kiếm tài khoản trong mảng accounts
    var userAccount = accounts.find(function (account) {
        return account.username === username && account.password === password;
    });

    if (userAccount) {
        // Tạo token chứa thông tin người dùng
        var token = jwt.sign({ id: userAccount.id, username: userAccount.username }, "secret-key", { expiresIn: "1h" });

        // Trả về token trong phản hồi
        res.json({ token: token });
    } else {
        // Trả về lỗi nếu thông tin không hợp lệ
        res.status(401).json({ message: "Đăng nhập không thành công. Vui lòng kiểm tra tên người dùng và mật khẩu." });
    }
});


function authenticateToken(req, res, next) {
    // Lấy token từ header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // Token không tồn tại
        return res.sendStatus(401);
    }

    // Xác thực token và lấy thông tin người dùng từ token
    jwt.verify(token, 'secret-key', (err, user) => {
        if (err) {
            // Token không hợp lệ
            return res.sendStatus(403);
        }

        // Lưu thông tin người dùng vào biến req.user
        req.user = user;

        // Tiếp tục xử lý các middleware hoặc router tiếp theo
        next();
    });
}

// API logout
app.post("/logout", authenticateToken, function (req, res) {
    // Lấy thông tin người dùng từ token được xác thực
    var user = req.user;

    // Ghi log người dùng đã đăng xuất
    console.log("Người dùng đã đăng xuất:", user.username);

    // Trả về phản hồi thành công
    res.status(200).json({ message: "Đăng xuất thành công." });
});


app.listen(3000, function () {
    console.log("Server đang lắng nghe cổng 3000...");
});
