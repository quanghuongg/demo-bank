function transferMoney() {
  var receiver = document.getElementById("receiver").value;
  var amount = parseFloat(document.getElementById("amount").value);

  if (receiver === "" || isNaN(amount) || amount <= 0) {
    document.getElementById("message").innerHTML = "Thông tin không hợp lệ.";
    return;
  }

  fetch("/transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      receiver: receiver,
      amount: amount
    })
  })
    .then(function (response) {
      switch (response.status) {
        case 200:
          // Chuyển tiền thành công
          showBalances();
          showPopup("Chuyển tiền thành công!", true);
          break;
        case 400:
        case 404:
          // Xử lý lỗi 400 (Bad Request)
          response.json().then(function (data) {
            var errorMessage = data.message;
            showPopup(errorMessage, false);
          });
          break;
        case 500:
          // Xử lý lỗi 500 (Internal Server Error)
          showPopup("Lỗi server, vui lòng thử lại sau.", false);
          break;
        default:
          // Xử lý các trạng thái lỗi khác
          showPopup("Lỗi không xác định, vui lòng thử lại sau.", false);
          break;
      }
    })
    .catch(function (error) {
      // Xử lý khi có lỗi xảy ra trong quá trình gọi API
      showPopup(error.message, false);
    });
}

function withdrawMoney() {
  var amount = parseFloat(document.getElementById("withdrawAmount").value);

  if (isNaN(amount) || amount <= 0) {
    document.getElementById("message").innerHTML = "Thông tin không hợp lệ.";
    return;
  }

  fetch("/withdraw", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token"),
    },
    body: JSON.stringify({
      amount: amount
    })
  })
    .then(function (response) {
      switch (response.status) {
        case 200:
          // Rút tiền thành công
          showBalances();
          showPopup("Rút tiền thành công!", true);
          break;
        case 400:
        case 404:
          // Xử lý lỗi 400 (Bad Request)
          response.json().then(function (data) {
            var errorMessage = data.message;
            showPopup(errorMessage, false);
          });
          break;
        case 500:
          // Xử lý lỗi 500 (Internal Server Error)
          showPopup("Lỗi server, vui lòng thử lại sau.", false);
          break;
        default:
          // Xử lý các trạng thái lỗi khác
          showPopup("Lỗi không xác định, vui lòng thử lại sau.", false);
          break;
      }
    })
    .catch(function (error) {
      // Xử lý khi có lỗi xảy ra trong quá trình gọi API
      showPopup(error.message, false);
    });
}

function showBalances() {
  fetch("/balances")
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      var balanceList = document.getElementById("balance-list");
      balanceList.innerHTML = "";

      data.forEach(function (account) {
        var listItem = document.createElement("li");
        listItem.textContent = "Tài khoản #" + account.id + " (" + account.username + "): " + account.balance;
        balanceList.appendChild(listItem);
      });
    })
    .catch(function (error) {
      console.log(error);
    });
}

function getTransactionHistory() {
  // Gọi API để lấy lịch sử giao dịch của người dùng
  fetch("/transaction-history", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem("token"),
    },
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(function (data) {
      // Xử lý phản hồi từ API
      displayTransactionHistory(data);
    })
    .catch(function (error) {
      console.log(error);
    });
}

function displayTransactionHistory(transactions) {
  var transactionHistoryTable = document.getElementById("transactionHistoryTable");
  var transactionHistoryBody = document.getElementById("transactionHistoryBody");

  // Xóa các mục trong tbody
  transactionHistoryBody.innerHTML = "";

  // Hiển thị từng giao dịch chuyển tiền trong bảng
  transactions.forEach(function (transaction) {
    var senderName = transaction.sender;
    var receiverName = transaction.receiver;
    var amount = transaction.amount;
    var timestamp = transaction.timestamp;
    var transactionType = transaction.type;

    var row = document.createElement("tr");

    var senderCell = document.createElement("td");
    senderCell.textContent = senderName;
    row.appendChild(senderCell);

    var receiverCell = document.createElement("td");
    receiverCell.textContent = receiverName;
    row.appendChild(receiverCell);

    var amountCell = document.createElement("td");
    amountCell.textContent = amount;
    row.appendChild(amountCell);

    var timestampCell = document.createElement("td");
    timestampCell.textContent = timestamp;
    row.appendChild(timestampCell);

    var typeCell = document.createElement("td");
    typeCell.textContent = transactionType;
    row.appendChild(typeCell);

    transactionHistoryBody.appendChild(row);
  });

  // Hiển thị bảng lịch sử giao dịch nếu có giao dịch
  if (transactions.length > 0) {
    transactionHistoryTable.style.display = "table";
  } else {
    transactionHistoryTable.style.display = "none";
  }
}


function showPopup(message, isSuccess) {
  var popup = document.getElementById("popup");
  var popupContent = document.getElementById("popupContent");
  var popupMessage = document.getElementById("popupMessage");
  var closeBtn = document.getElementsByClassName("close")[0];

  popupMessage.textContent = message;

  if (isSuccess) {
    popup.classList.remove("error");
    popup.classList.add("success");
  } else {
    popup.classList.remove("success");
    popup.classList.add("error");
  }

  popup.style.display = "block";

  closeBtn.onclick = function () {
    popup.style.display = "none";
  };
}


function login() {
  var username = document.getElementById("usernameInput").value;
  var password = document.getElementById("passwordInput").value;

  fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  })
    .then(function (response) {
      if (response.ok) {
        // Lưu token vào localStorage
        response.json().then(function (data) {
          var token = data.token;
          localStorage.setItem("token", token);

          // Chuyển hướng sang trang chuyển tiền và rút tiền
          window.location.href = "index.html";
        });
      } else {
        // Xử lý khi API trả về lỗi
        response.json().then(function (data) {
          var errorMessage = data.message;
          alert(errorMessage);
        });
      }
    })
    .catch(function (error) {
      // Xử lý khi có lỗi xảy ra trong quá trình gọi API
      alert("Lỗi: " + error.message);
    });
}


window.onload = function () {
  // Kiểm tra token
  var token = localStorage.getItem("token");

  if (token) {
    // Nếu có token, hiển thị màn hình chuyển tiền và rút tiền
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("transferWithdrawScreen").style.display = "block";
  } else {
    // Nếu không có token, hiển thị màn hình đăng nhập
    document.getElementById("loginScreen").style.display = "block";
  }
};


function logout() {
  // Gọi API logout
  fetch("/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then(function (response) {
      // Xoá token khỏi localStorage
      localStorage.removeItem("token");
      // Chuyển hướng người dùng đến màn hình đăng nhập
      window.location.href = "login.html";
    })
    .catch(function (error) {
      console.error("Lỗi khi gọi API logout:", error);
    });
}

function getUserInfo() {
  fetch("/getUserInfo", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("token"),
    },
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(function (data) {
      // Hiển thị thông tin người dùng
      var userInfoContainer = document.getElementById("userInfoContainer");
      userInfoContainer.innerHTML = ""; // Xóa nội dung cũ

      var userIdElement = document.createElement("p");
      userIdElement.textContent = "User ID: " + data.id;

      var usernameElement = document.createElement("p");
      usernameElement.textContent = "Username: " + data.username;

      userInfoContainer.appendChild(userIdElement);
      userInfoContainer.appendChild(usernameElement);
    })
    .catch(function (error) {
      console.error("Lỗi khi gọi API getUserInfo:", error);
    });
}




// Gọi hàm showBalances khi trang web được tải
window.addEventListener("DOMContentLoaded", function () {
  var token = localStorage.getItem("token");
  if (token != null) {
    getUserInfo();
    showBalances();
  }
});
