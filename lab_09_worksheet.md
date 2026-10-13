# Lab 09 — A real frontend for your Session-7 token, with viem

**Họ tên:** Phạm Thu Hà - 11247164

**Địa chỉ ví (tài khoản thử):** `0x263E1Fec189cb34433ffa420BCeDc82999bC88dB`

**Hợp đồng Buổi 7 (TrustKeys, chainId 11968):**
- ClassToken: `0x84C3D423717A85CA27195542056ad8d553EefD37`
- ClassBadge: `0xd1AB98277b5c8fde755522687B233dA055A19458`

---

## Bước 0 (5') — Setup / Chuẩn bị

Dùng lại ClassToken và ClassBadge đã deploy ở Buổi 7, không deploy lại. Trong thư mục `lab09` (gồm `index.html`, `read.js`, `trustkeys.js`, `abis.js`, `send-tx.js`, `package.json`):

```bash
node --version
npm install
```

Kết quả:

```
added 13 packages, and audited 14 packages in 7s
found 0 vulnerabilities
```

**Q1 / Câu 1: In web2 a "GET my balance" hits your server's database. Here, what does a balance read actually hit, and why is it free? / Ở web2, "đọc số dư" gọi database máy chủ của bạn. Ở đây, đọc số dư gọi tới đâu, và vì sao miễn phí?**

Trả lời: Đọc số dư gọi tới một node RPC của TrustKeys bằng `eth_call`, đọc trạng thái công khai của chuỗi. Việc này miễn phí vì không thay đổi trạng thái nên không tốn gas và không cần chữ ký. / It hits a TrustKeys RPC node via `eth_call`, a read of public chain state; it changes no state, so it costs no gas.

---

## Bước 1 (10') — Lab 9.1: đọc bằng Node, không cần ví

Lệnh đã chạy:
```bash
node read.js
TOKEN=0x84C3D423717A85CA27195542056ad8d553EefD37 ACCOUNT=0x263E1Fec189cb34433ffa420BCeDc82999bC88dB BADGE=0xd1AB98277b5c8fde755522687B233dA055A19458 node read.js
```

Kết quả:

```
== Network ==
chainId: 11968
latest block: 717678n
gasPrice (wei): 2000000000n
extraData bytes: 97

== Token ==
name/symbol/decimals: ClassToken CTK 18
balanceOf(0x263E1Fec189cb34433ffa420BCeDc82999bC88dB): 999900 CTK

== Badge tokenURI ==
{
  "name": "Blockchain Class Badge #0",
  "attributes": [
    { "trait_type": "Student", "value": "Phạm Thu Hà" },
    { "trait_type": "Course", "value": "Blockchain Technology and Cryptocurrency" }
  ],
  "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz..."
}
```

![read.js](screenshots/lab09_b1_read.png)

**Q2 / Câu 2: read.js prints extraData bytes: 97. Why does that number matter on TrustKeys, and why did viem read the block anyway when raw web3.py would have thrown? / Vì sao con số 97 quan trọng trên TrustKeys, và vì sao viem đọc được block trong khi web3.py thô sẽ lỗi?**

Trả lời: `extraData` dài 97 byte, lớn hơn 32 byte, nghĩa là TrustKeys là mạng Proof-of-Authority (clique): phần mở rộng chứa chữ ký của validator. viem, ethers và MetaMask đọc được khối này bình thường, còn `web3.py` thô báo lỗi nếu chưa gắn middleware PoA (`ExtraDataToPOAMiddleware`). / More than 32 bytes means PoA (clique); viem parses it fine, raw web3.py needs the PoA middleware.

---

## Bước 2 (10') — Lab 9.2: kết nối ví và đọc số dư

Mở `index.html` qua server cục bộ (`python3 -m http.server 8000`, rồi vào `http://localhost:8000/index.html`), bấm **Connect** (MetaMask chuyển sang mạng TrustKeys L1 testnet), dán địa chỉ ClassToken và bấm **Load token**. Trang hiện `CTK — 0x84C3...fD37` và `Số dư: 999900 CTK`, khớp với `read.js`.

![Connect và Load token](screenshots/lab09_b2_connect.png)

**Q3 / Câu 3: The app read your balance through the public client, but needed the wallet client to connect. What is the difference between a provider and a signer (viem: public vs wallet client)? / Khác biệt giữa provider và signer (public vs wallet client) là gì?**

Trả lời: Provider (viem: public client) chỉ đọc trạng thái công khai của chuỗi qua RPC, không cần khóa. Signer (viem: wallet client) giữ hoặc điều khiển khóa riêng và tạo chữ ký cho các thao tác ghi. Vì vậy trang đọc số dư bằng public client mà không cần ví, còn Connect và chuyển token mới cần wallet client. / A provider only reads public state; a signer controls the key and produces signatures for writes.

---

## Bước 3 (10') — Lab 9.3: chuyển token, hiển thị trạng thái

Điền người nhận (bạn cùng lớp, cùng người nhận ở Lab 07) `0xccD639c18E7DbE514824031a2358328453825327`, số lượng `100`, bấm **Send**. Luồng mã: `simulateContract` (bắt lỗi trước khi ký) → `writeContract` (cửa sổ MetaMask, phát giao dịch, trạng thái PENDING) → `waitForTransactionReceipt` (SUCCESS hoặc REVERTED). Số dư chỉ được cập nhật sau khi có receipt.

Kết quả: giao dịch thành công, sự kiện chuyển 100 CTK tới `0xccD6...5327` ở block #717680 hiện trong danh sách sự kiện.

![Chuyển token thành công](screenshots/lab09_b3_send_success.png)

> Ghi chú: lần Send đầu (block #717679) mình điền nhầm địa chỉ người nhận là địa chỉ hợp đồng ClassBadge (`0xd1AB...9458`) nên 100 CTK nằm trong hợp đồng đó, không lấy lại được. Sau đó mình gửi lại đúng người nhận ở block #717680.

**Thử Reject:** bấm **Send** rồi **Reject** trong MetaMask, trang hiện lỗi `User rejected the request.` và không bị treo.

![Reject](screenshots/lab09_b3_reject.png)

**Q4 / Câu 4: Why do we call simulateContract before writeContract? And why must we not update the on-screen balance until the receipt arrives? / Vì sao simulate trước write? Vì sao KHÔNG cập nhật số dư trước khi có receipt?**

Trả lời: `simulateContract` chạy lệnh gọi trên trạng thái hiện tại và báo revert ngay trên máy, không tốn gas, nên lỗi (ví dụ không đủ số dư) được bắt trước khi cửa sổ ví hiện lên. Không cập nhật số dư sớm vì giao dịch vẫn có thể bị revert hoặc bị sắp xếp lại (reorg) sau khi phát đi; receipt mới là nguồn sự thật cuối cùng. / Simulate catches reverts before signing (no gas); the receipt is the source of truth because a tx can revert or be re-orged.

---

## Bước 4 (5') — Lab 9.4: lịch sử bằng getLogs

Danh sách sự kiện được lấy bằng `getContractEvents({ eventName: "Transfer", fromBlock, toBlock })` trên 5000 block gần nhất. Kết quả hiện bốn sự kiện:

```
#717680  0x263E...88dB → 0xccD6...5327 : 100 CTK
#717679  0x263E...88dB → 0xd1AB...9458 : 100 CTK
#717571  0x263E...88dB → 0xccD6...5327 : 100 CTK
#717568  0x0000...0000 → 0x263E...88dB : 1000000 CTK
```

![Danh sách sự kiện](screenshots/lab09_b4_events.png)

**Q5 / Câu 5: Your getLogs window is 5000 blocks. What breaks if you ask for fromBlock: 0 on a busy chain, and what is the production fix? / Cửa sổ 5000 block; hỏi từ block 0 trên chain đông sẽ hỏng gì, và cách khắc phục thật là gì?**

Trả lời: Hỏi `fromBlock: 0` quét quá nhiều block nên bị timeout hoặc RPC giới hạn tốc độ. Cách khắc phục: chia cửa sổ block nhỏ và phân trang, hoặc dùng indexer (The Graph, Ponder) để truy vấn bằng GraphQL. / A full-range query times out or is rate-limited; use bounded windows/pagination or an indexer.

---

## Bước 5 — Lab 9.5 (bonus): mint ClassBadge và giải mã tokenURI

Dùng `send-tx.js` với khóa của tài khoản thử (nhập qua biến môi trường, không lưu vào file, xóa bằng `unset PRIVATE_KEY` sau khi dùng):

```bash
BADGE=0xd1AB98277b5c8fde755522687B233dA055A19458 TO=0xccD639c18E7DbE514824031a2358328453825327 STUDENT="Nguyen Viet Tien" node send-tx.js
```
```
PENDING 0x504f21990b0527866aba7a7d5b3ac46c3496915a5080cbdfc9f4f282683d9377
SUCCESS block 717712n
```

![Mint badge](screenshots/lab09_b5_mint.png)

Giải mã badge vừa mint:
```bash
BADGE=0xd1AB98277b5c8fde755522687B233dA055A19458 TOKEN_ID=1 node read.js
```
```
== Badge tokenURI ==
{
  "name": "Blockchain Class Badge #1",
  "attributes": [
    { "trait_type": "Student", "value": "Nguyen Viet Tien" },
    { "trait_type": "Course", "value": "Blockchain Technology and Cryptocurrency" }
  ],
  "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz..."
}

== Decoded SVG ==
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">... Nguyen Viet Tien ... Badge #1 ...</svg>
```

![Giải mã badge](screenshots/lab09_b5_decode.png)

**Q6 / Câu 6: The badge image came back as a data:image/svg+xml;base64,… URI straight from the contract. How does the browser render it with no IPFS gateway and no image server? / Ảnh huy hiệu về dưới dạng data-URI từ hợp đồng — trình duyệt hiển thị thế nào khi không có gateway IPFS và không có máy chủ ảnh?**

Trả lời: Data-URI tự chứa dữ liệu: trình duyệt tự giải mã base64 thành SVG và vẽ ra. Trường `image` trong JSON cũng là một data-URI (SVG base64) nên không cần tải thêm gì từ ngoài. / A data-URI is self-describing: the browser decodes the base64 itself, so no external fetch is needed.

---

## Đường sản phẩm: wagmi + React

**Q7 / Câu 7: The index.html and the wagmi component do the same three things. What does wagmi add over calling viem by hand, and what does it reuse unchanged? / wagmi thêm gì so với gọi viem tay, và dùng lại nguyên vẹn cái gì?**

Trả lời: wagmi thêm trạng thái React và cache TanStack Query (tự refetch, loại bỏ yêu cầu trùng, cờ loading/error) cùng lớp trừu tượng connector (injected, WalletConnect). Nó dùng lại nguyên vẹn các viem client, chain object (`defineChain`) và ABI. / wagmi adds React state, a TanStack Query cache and a connector abstraction; it reuses the same viem clients, chain object and ABIs unchanged.

---

## Nộp bài / Submit

- Mở `index.html`, kết nối MetaMask với TrustKeys, tải ClassToken, đọc số dư, chuyển CTK có trạng thái PENDING → SUCCESS và thấy giao dịch trong danh sách sự kiện (Bước 2–4).
- Chạy `read.js` và hiển thị kết quả mạng (Bước 1).
- Bonus: mint ClassBadge và giải mã `tokenURI` (Bước 5).
- Không dán khóa thật; khóa của tài khoản thử chỉ nhập qua biến môi trường và đã xóa khỏi phiên terminal sau khi dùng.
