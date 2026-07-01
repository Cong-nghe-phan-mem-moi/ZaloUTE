# ZaloUTE

ZaloUTE là ứng dụng mạng xã hội nội bộ mô phỏng các chức năng chính của Zalo/Facebook cho môi trường sinh viên: đăng ký, đăng nhập, hồ sơ cá nhân, kết bạn, theo dõi, bài viết, bình luận, story, album/media, nhóm cộng đồng, chat realtime, thông báo, báo cáo nội dung và trang quản trị.

Repository gồm 2 ứng dụng chính:

- `client/`: giao diện React + Vite + Redux Toolkit.
- `server/`: REST API Node.js + Express + MongoDB/Mongoose + WebSocket.

Ngoài ra repo có tài liệu nghiệp vụ và kiểm thử:

- `diagram/`: use case diagram và sequence diagram PlantUML.
- `tests/api/`: Postman collections cho các nhóm API.
- `server/tests/`: unit test backend bằng `node:test`.

## Công nghệ sử dụng

**Frontend**

- React 19
- Vite
- React Router DOM
- Redux Toolkit, React Redux
- Axios
- Tailwind CSS
- date-fns

**Backend**

- Node.js, Express 5
- MongoDB, Mongoose
- JWT authentication
- express-session cho phiên reset mật khẩu
- bcrypt
- multer upload ảnh/video
- nodemailer gửi OTP email
- ws cho chat/thông báo realtime
- Joi validation
- express-rate-limit
- googleapis cho Google Login và Google Drive upload tùy cấu hình

## Cấu trúc thư mục

```text
ZaloUTE/
├── client/                     # Frontend React/Vite
│   ├── public/                 # Static assets
│   └── src/
│       ├── assets/             # Ảnh/logo
│       ├── components/         # Component tái sử dụng và component theo module
│       ├── hooks/              # Custom hooks
│       ├── pages/              # Trang theo route
│       ├── redux/              # Store và slices
│       ├── services/           # API client gọi backend
│       └── utils/              # Hàm tiện ích frontend
├── server/                     # Backend Express
│   ├── src/
│   │   ├── config/             # Database, mailer
│   │   ├── controllers/        # Nhận req/res, gọi service
│   │   ├── middlewares/        # Auth, upload, validation, rate limit
│   │   ├── models/             # Mongoose schemas
│   │   ├── repositories/       # Truy vấn database
│   │   ├── routes/             # Khai báo endpoint
│   │   ├── services/           # Business logic
│   │   ├── utils/              # OTP, privacy, online tracker...
│   │   └── server.js           # Entry point backend
│   ├── scripts/                # Script hỗ trợ lấy token/user id
│   ├── storage/uploads/        # File upload runtime
│   └── tests/                  # Unit tests
├── diagram/                    # PlantUML use case/sequence
└── tests/api/                  # Postman/Newman collections
```

## Yêu cầu môi trường

- Node.js 20 hoặc mới hơn được khuyến nghị.
- npm.
- MongoDB local hoặc MongoDB Atlas.
- Tài khoản Gmail/App Password nếu muốn gửi OTP thật.
- Google OAuth Web Client ID nếu muốn đăng nhập bằng Google.

## Cài đặt nhanh

Clone hoặc mở repo, sau đó cài dependency riêng cho server và client:

```bash
cd server
npm install

cd ../client
npm install
```

Tạo file môi trường từ mẫu:

```bash
cd server
cp .env.example .env

cd ../client
cp .env.example .env
```

Trên PowerShell có thể dùng:

```powershell
Copy-Item .env.example .env
```

## Cấu hình môi trường

### Server `.env`

File mẫu nằm tại `server/.env.example`.

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ZaloUTE

JWT_SECRET=change_me
JWT_EXPIRE=7d
SESSION_SECRET=change_me_session

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@zaloutee.com
EMAIL_USE_MOCK=false

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com
OTP_EXPIRY_MINUTES=10

GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

Gợi ý cho môi trường phát triển:

- Nếu chưa có SMTP thật, đặt `EMAIL_USE_MOCK=true` để dễ test OTP.
- `MONGODB_URI` có thể trỏ đến MongoDB local hoặc Atlas.
- `JWT_SECRET` và `SESSION_SECRET` phải đổi khi deploy production.
- `CORS_ORIGIN` nên chứa URL frontend, ví dụ `http://localhost:5173`.

### Client `.env`

File mẫu nằm tại `client/.env.example`.

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com
```

Frontend gọi API qua `baseURL: "/api"`. Vite proxy đã được cấu hình trong `client/vite.config.js`:

- `/api` proxy đến `http://localhost:5000`.
- `/uploads` proxy đến `http://localhost:5000`.
- Proxy hỗ trợ WebSocket.

## Chạy ứng dụng

Mở 2 terminal.

Terminal 1 chạy backend:

```bash
cd server
npm run dev
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

Health check:

```text
GET http://localhost:5000/api/health
```

Terminal 2 chạy frontend:

```bash
cd client
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:5173
```

## Scripts thường dùng

### Backend

```bash
npm run dev       # Chạy server bằng nodemon
npm start         # Chạy server bằng node
npm test          # Chạy unit test trong server/tests
```

### Frontend

```bash
npm run dev       # Chạy Vite dev server
npm run build     # Build production
npm run preview   # Preview bản build
npm run lint      # Kiểm tra ESLint
```

## Kiến trúc backend

Backend đi theo luồng:

```text
Route -> Middleware -> Controller -> Service -> Repository -> Model -> MongoDB
```

Vai trò từng lớp:

- `routes/`: định nghĩa URL, HTTP method, middleware cần chạy.
- `middlewares/`: xác thực JWT, phân quyền, validate request, rate limit, upload file.
- `controllers/`: đọc dữ liệu từ request, gọi service, trả response.
- `services/`: xử lý nghiệp vụ chính.
- `repositories/`: gom logic truy vấn database để service dễ đọc hơn.
- `models/`: định nghĩa schema Mongoose.

Khi thêm chức năng mới, nên đi theo thứ tự:

1. Tạo/cập nhật `model` nếu cần lưu dữ liệu mới.
2. Viết logic truy vấn trong `repository`.
3. Viết nghiệp vụ trong `service`.
4. Viết `controller` nhận request và trả response thống nhất.
5. Khai báo endpoint trong `route`.
6. Gắn route vào `src/routes/api.js` nếu là module mới.
7. Thêm service frontend trong `client/src/services`.
8. Thêm Redux slice/hook/component/page nếu chức năng có giao diện.
9. Thêm test hoặc Postman request.

## Kiến trúc frontend

Frontend đi theo luồng:

```text
Page -> Component/Hook -> Redux Slice hoặc Service -> apiClient -> Backend API
```

Các phần chính:

- `src/App.jsx`: khai báo route và bảo vệ các trang yêu cầu đăng nhập.
- `src/services/apiClient.js`: Axios instance, tự gắn `Authorization: Bearer <token>`.
- `src/services/*.service.js`: gom API theo module.
- `src/redux/store.js`: đăng ký các slice.
- `src/redux/slices/`: quản lý state cho auth/register/forgot password/user/post/comment/chat/ui.
- `src/pages/`: trang hoàn chỉnh.
- `src/components/`: component theo domain như home, profile, groups, chat, post, media.
- `src/hooks/`: logic UI tái sử dụng.

Các route frontend chính:

| Path | Màn hình |
| --- | --- |
| `/login` | Đăng nhập |
| `/register` | Đăng ký |
| `/verify-otp` | Xác thực OTP đăng ký |
| `/forgot-password` | Quên mật khẩu |
| `/` | Trang chủ/news feed |
| `/friends` | Danh sách bạn bè |
| `/friend-requests` | Lời mời kết bạn |
| `/groups` | Danh sách nhóm |
| `/groups/:groupId` | Chi tiết nhóm |
| `/search` | Tìm kiếm |
| `/messages` | Chat |
| `/account/settings` | Cài đặt tài khoản |
| `/admin/dashboard` | Trang quản trị |
| `/profile` | Hồ sơ cá nhân |
| `/users/profile/:userId` | Hồ sơ người dùng khác |
| `/profile/media` | Media của tôi |
| `/users/media/:userId` | Media của người dùng khác |

## Các module chức năng

### 1. Xác thực và tài khoản

File liên quan:

- Backend: `auth.route.js`, `auth.controller.js`, `auth.service.js`, `auth.repository.js`, `account.model.js`, `otp.model.js`.
- Frontend: `auth.service.js`, `registerSlice.js`, `forgotPasswordSlice.js`, `LoginPage.jsx`, `Register.jsx`, `VerifyOtp.jsx`, `ForgotPassword.jsx`.

Chức năng:

- Đăng ký tài khoản bằng email, mật khẩu, họ tên.
- Gửi và xác thực OTP đăng ký.
- Đăng nhập bằng email/mật khẩu.
- Đăng nhập bằng Google.
- Quên mật khẩu: yêu cầu OTP, xác thực OTP, đặt mật khẩu mới.
- JWT access token.
- Quản lý trạng thái tài khoản: `active`, `inactive`, `banned`, `pending`, `suspended`.
- Quản lý login session và thu hồi phiên.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Đăng ký |
| `POST` | `/api/auth/verify-otp` | Xác thực OTP đăng ký |
| `POST` | `/api/auth/login` | Đăng nhập |
| `POST` | `/api/auth/google` | Đăng nhập Google |
| `POST` | `/api/auth/forgot-password/request-otp` | Gửi OTP quên mật khẩu |
| `POST` | `/api/auth/forgot-password/verify-otp` | Xác thực OTP quên mật khẩu |
| `POST` | `/api/auth/forgot-password/reset-password` | Đặt lại mật khẩu |
| `GET` | `/api/auth/dev/reset-otp?email=...` | Lấy OTP dev |

### 2. Hồ sơ cá nhân và cài đặt tài khoản

File liên quan:

- Backend: `user.route.js`, `user.controller.js`, `user.service.js`, `user.repository.js`, `user.model.js`.
- Frontend: `user.service.js`, `userSlice.js`, `ProfilePage.jsx`, `AccountSettings.jsx`, `EditProfileModal.jsx`.

Chức năng:

- Xem hồ sơ của tôi.
- Xem hồ sơ người dùng khác.
- Cập nhật thông tin cá nhân: họ tên, số điện thoại, ngày sinh, giới tính, địa chỉ, bio, social links.
- Upload avatar và cover image.
- Cài đặt email/số điện thoại.
- Đổi mật khẩu.
- Cài đặt thông báo.
- Cài đặt quyền riêng tư.
- Thu hồi phiên đăng nhập.
- Vô hiệu hóa tài khoản.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/profile` | Lấy hồ sơ hiện tại |
| `PUT` | `/api/profile` | Cập nhật hồ sơ |
| `PUT` | `/api/profile/avatar` | Upload avatar |
| `PUT` | `/api/profile/cover-image` | Upload ảnh bìa |
| `GET` | `/api/users/profile/:id` | Xem hồ sơ người khác |
| `GET` | `/api/users/account-settings` | Lấy cài đặt tài khoản |
| `PUT` | `/api/users/account-settings/password` | Đổi mật khẩu |
| `PUT` | `/api/users/account-settings/contact` | Cập nhật liên hệ |
| `PUT` | `/api/users/account-settings/notifications` | Cập nhật thông báo |
| `PUT` | `/api/users/account-settings/privacy` | Cập nhật riêng tư |
| `DELETE` | `/api/users/account-settings/sessions/:sessionId` | Thu hồi một phiên |
| `DELETE` | `/api/users/account-settings/sessions` | Thu hồi phiên khác |
| `DELETE` | `/api/users/account-settings` | Vô hiệu hóa tài khoản |

### 3. Tìm kiếm, kết bạn, theo dõi và chặn

File liên quan:

- Backend: `friendRequest.controller.js`, `friendRequest.service.js`, `follow.controller.js`, `friendRequest.model.js`.
- Frontend: `Friends.jsx`, `FriendRequests.jsx`, `SearchPage.jsx`, `UserSearchBox.jsx`, `useUserSearch.js`.

Chức năng:

- Tìm kiếm người dùng.
- Gửi lời mời kết bạn.
- Xem lời mời đến/đã gửi.
- Chấp nhận, từ chối, hủy lời mời.
- Hủy kết bạn.
- Follow/unfollow.
- Block/unblock.
- Xem danh sách người bị chặn.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/users/search` | Tìm kiếm người dùng |
| `POST` | `/api/users/friend-request` | Gửi lời mời kết bạn |
| `GET` | `/api/users/friend-request/incoming` | Lời mời đến |
| `GET` | `/api/users/friend-request/outgoing` | Lời mời đã gửi |
| `PUT` | `/api/users/friend-request/accept` | Chấp nhận |
| `PUT` | `/api/users/friend-request/reject` | Từ chối |
| `DELETE` | `/api/users/friend-request/cancel` | Hủy lời mời |
| `DELETE` | `/api/users/friend-request/unfriend` | Hủy kết bạn |
| `POST` | `/api/users/:id/follow` | Follow/unfollow |
| `POST` | `/api/users/:id/block` | Chặn |
| `POST` | `/api/users/:id/unblock` | Bỏ chặn |
| `GET` | `/api/users/blocked` | Danh sách đã chặn |

### 4. Bài viết, tương tác, chia sẻ và quyền riêng tư

File liên quan:

- Backend: `post.route.js`, `post.controller.js`, `post.service.js`, `post.repository.js`, `post.model.js`, `media.model.js`, `privacy.js`.
- Frontend: `post.service.js`, `postSlice.js`, `components/Post/*`, `components/home/PostCard.jsx`, `Composer.jsx`, `AudienceSelector.jsx`.

Chức năng:

- Tạo bài viết có nội dung, ảnh, video.
- Cập nhật/xóa bài viết.
- Xem news feed.
- Xem bài viết đề xuất.
- Tìm kiếm bài viết.
- Xem bài viết theo tác giả.
- Xem chi tiết bài viết.
- Like/unlike và reaction.
- Xem danh sách người like.
- Bình luận.
- Ẩn bài viết.
- Lưu/bỏ lưu bài viết.
- Chia sẻ bài viết lên timeline hoặc tin nhắn.
- Quyền riêng tư bài viết: `public`, `friends`, `only_me`, `custom`, `hide_some`.
- Bài viết nhóm có trạng thái duyệt: `approved`, `pending`, `rejected`.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/posts` | Tạo bài viết |
| `GET` | `/api/posts/feed` | News feed |
| `GET` | `/api/posts/suggested` | Bài viết đề xuất |
| `GET` | `/api/posts/search` | Tìm kiếm bài viết |
| `GET` | `/api/posts/author/:authorId` | Bài viết theo tác giả |
| `GET` | `/api/posts/:postId` | Chi tiết bài viết |
| `PUT` | `/api/posts/:postId` | Cập nhật bài viết |
| `DELETE` | `/api/posts/:postId` | Xóa bài viết |
| `POST` | `/api/posts/:postId/like` | Like/unlike |
| `GET` | `/api/posts/:postId/likes` | Danh sách like |
| `GET` | `/api/posts/:postId/comments` | Bình luận của bài viết |
| `POST` | `/api/posts/:postId/share` | Chia sẻ bài viết |
| `POST` | `/api/posts/:postId/hide` | Ẩn bài viết |
| `POST` | `/api/posts/:postId/save` | Lưu/bỏ lưu |
| `GET` | `/api/posts/group/:groupId` | Bài viết trong nhóm |
| `GET` | `/api/posts/group/:groupId/pending` | Bài chờ duyệt |
| `POST` | `/api/posts/:postId/approve` | Duyệt bài nhóm |
| `POST` | `/api/posts/:postId/reject` | Từ chối bài nhóm |

Upload bài viết dùng `multipart/form-data`, field được hỗ trợ: `media`, `files`, `images`, `image`, `videos`, `video`, tối đa 10 file, mỗi file tối đa 10MB.

### 5. Bình luận

File liên quan:

- Backend: `comment.route.js`, `comment.controller.js`, `comment.service.js`, `comment.repository.js`, `comment.model.js`.
- Frontend: `comment.service.js`, `commentSlice.js`, `CommentSection.jsx`, `CommentItem.jsx`.

Chức năng:

- Tạo bình luận cho bài viết.
- Lấy danh sách bình luận.
- Sửa/xóa bình luận.
- Like/unlike bình luận.
- Lấy replies của bình luận.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/comments/:postId` | Tạo bình luận |
| `GET` | `/api/comments/:postId` | Lấy bình luận bài viết |
| `PUT` | `/api/comments/:commentId` | Sửa bình luận |
| `DELETE` | `/api/comments/:commentId` | Xóa bình luận |
| `POST` | `/api/comments/:commentId/like` | Like/unlike bình luận |
| `GET` | `/api/comments/:commentId/replies` | Lấy phản hồi |

### 6. Story

File liên quan:

- Backend: `story.route.js`, `story.controller.js`, `story.service.js`, `story.model.js`.
- Frontend: `story.service.js`, `Stories.jsx`, `StoryCards.jsx`, `StoryViewer.jsx`, `CreateStoryModal.jsx`, hooks trong `src/hooks/stories`.

Chức năng:

- Tạo story ảnh/video.
- Xem danh sách story.
- Xem chi tiết story.
- Đánh dấu đã xem.
- React story.
- Reply story qua chat.
- Xem danh sách người xem.
- Xóa story.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/stories` | Danh sách story |
| `POST` | `/api/stories` | Tạo story |
| `GET` | `/api/stories/:storyId` | Chi tiết story |
| `POST` | `/api/stories/:storyId/view` | Đánh dấu đã xem |
| `POST` | `/api/stories/:storyId/react` | React story |
| `POST` | `/api/stories/:storyId/reply` | Reply story |
| `GET` | `/api/stories/:storyId/viewers` | Người xem |
| `DELETE` | `/api/stories/:storyId` | Xóa story |

Upload story dùng `multipart/form-data`, field `media`, `image` hoặc `video`, tối đa 1 file.

### 7. Album và media

File liên quan:

- Backend: `album.model.js`, `album.repository.js`, các endpoint media trong `post.route.js`.
- Frontend: `UserMediaPage.jsx`, `UserMediaGallery.jsx`, `MediaLightbox.jsx`, `AlbumEditorModal.jsx`.

Chức năng:

- Xem media theo người dùng.
- Tạo/cập nhật/xóa album.
- Tải xuống media.
- Xem gallery và lightbox trên frontend.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/posts/author/:authorId/media` | Media của người dùng |
| `GET` | `/api/posts/author/:authorId/albums` | Album của người dùng |
| `POST` | `/api/posts/albums` | Tạo album |
| `PUT` | `/api/posts/albums/:albumId` | Cập nhật album |
| `DELETE` | `/api/posts/albums/:albumId` | Xóa album |
| `GET` | `/api/posts/media/:mediaId/download` | Tải media |

### 8. Nhóm cộng đồng

File liên quan:

- Backend: `group.route.js`, `group.controller.js`, `group.service.js`, `group.repository.js`, `group.model.js`, `group.middleware.js`.
- Frontend: `group.service.js`, `Groups.jsx`, `GroupDetail.jsx`, `GroupListComponents.jsx`, `GroupDetailComponents.jsx`, `GroupAvatarUploader.jsx`.

Chức năng:

- Tạo nhóm công khai/riêng tư.
- Upload avatar nhóm.
- Xem danh sách nhóm của tôi.
- Xem chi tiết nhóm.
- Cập nhật thông tin nhóm.
- Mời người dùng vào nhóm.
- Hủy lời mời.
- Chấp nhận/từ chối lời mời.
- Gửi yêu cầu tham gia nhóm.
- Admin nhóm duyệt yêu cầu tham gia.
- Gán admin nhóm.
- Xóa thành viên.
- Duyệt/từ chối bài viết trong nhóm.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/groups/create` | Tạo nhóm |
| `GET` | `/api/groups/my-groups` | Nhóm của tôi |
| `GET` | `/api/groups/invitations` | Lời mời vào nhóm |
| `GET` | `/api/groups/:groupId` | Chi tiết nhóm |
| `PUT` | `/api/groups/:groupId` | Cập nhật nhóm |
| `POST` | `/api/groups/:groupId/invite` | Mời thành viên |
| `POST` | `/api/groups/:groupId/cancel-invite` | Hủy lời mời |
| `POST` | `/api/groups/:groupId/accept-invite` | Chấp nhận lời mời |
| `POST` | `/api/groups/:groupId/reject-invite` | Từ chối lời mời |
| `POST` | `/api/groups/:groupId/request` | Yêu cầu tham gia |
| `POST` | `/api/groups/:groupId/approve` | Duyệt yêu cầu |
| `POST` | `/api/groups/:groupId/assign-admin` | Gán admin |
| `POST` | `/api/groups/:groupId/remove-member` | Xóa thành viên |

Các endpoint quản trị nhóm dùng middleware `isGroupAdmin`.

### 9. Chat realtime

File liên quan:

- Backend: `chat.route.js`, `chat.controller.js`, `chat.service.js`, `chat.repository.js`, `conversation.model.js`, `message.model.js`.
- Frontend: `chat.service.js`, `chatSlice.js`, `ChatPage.jsx`, `components/chat/*`, `MiniChatWindow.jsx`, `MessagesDropdown.jsx`.

Chức năng:

- Chat cá nhân.
- Tạo nhóm chat.
- Lấy danh sách hội thoại.
- Lấy tin nhắn theo hội thoại.
- Gửi tin nhắn realtime qua WebSocket.
- Upload ảnh trong hội thoại.
- Chia sẻ bài viết/story qua tin nhắn.
- Đánh dấu hội thoại đã xem.
- Badge tin nhắn.
- Thêm/xóa thành viên nhóm chat.
- Rời nhóm.
- Tắt/bật thông báo hội thoại.
- Chặn/bỏ chặn hội thoại.
- Xóa hội thoại.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/chats/conversations` | Danh sách hội thoại |
| `GET` | `/api/chats/conversations/badge` | Badge tin nhắn |
| `POST` | `/api/chats/conversations` | Lấy hoặc tạo hội thoại |
| `POST` | `/api/chats/conversations/seen` | Đánh dấu đã xem |
| `GET` | `/api/chats/conversations/:conversationId/messages` | Tin nhắn |
| `POST` | `/api/chats/conversations/:conversationId/images` | Upload ảnh chat |
| `POST` | `/api/chats/groups` | Tạo nhóm chat |
| `POST` | `/api/chats/groups/:conversationId/remove-member` | Xóa thành viên |
| `POST` | `/api/chats/groups/:conversationId/leave` | Rời nhóm |
| `POST` | `/api/chats/groups/:conversationId/add-members` | Thêm thành viên |
| `POST` | `/api/chats/conversations/:conversationId/mute` | Tắt thông báo |
| `POST` | `/api/chats/conversations/:conversationId/unmute` | Bật thông báo |
| `POST` | `/api/chats/conversations/:conversationId/block` | Chặn hội thoại |
| `POST` | `/api/chats/conversations/:conversationId/unblock` | Bỏ chặn |
| `DELETE` | `/api/chats/conversations/:conversationId` | Xóa hội thoại |

Endpoint public:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/chats/images/:fileId` | Proxy ảnh hội thoại |

WebSocket chat được gắn trong `ChatService.attachWebSocketServer(server)`.

### 10. Thông báo realtime

File liên quan:

- Backend: `notification.route.js`, `notification.controller.js`, `notification.service.js`, `notification.model.js`.
- Frontend: `notification.service.js`, `Notifications.jsx`, `useHeaderNotifications.js`.

Chức năng:

- Lấy danh sách thông báo.
- Đánh dấu đã xem.
- Đánh dấu tất cả đã đọc.
- Đánh dấu một thông báo đã đọc.
- Xóa thông báo.
- Đẩy thông báo realtime qua WebSocket.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/notifications` | Danh sách thông báo |
| `PUT` | `/api/notifications/seen` | Đánh dấu đã xem |
| `PUT` | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc |
| `PUT` | `/api/notifications/:notificationId/read` | Đánh dấu một thông báo đã đọc |
| `DELETE` | `/api/notifications/:notificationId` | Xóa thông báo |

WebSocket thông báo được gắn trong `NotificationService.attachWebSocketServer(server)`.

### 11. Báo cáo nội dung

File liên quan:

- Backend: `report.route.js`, `report.controller.js`, `report.service.js`, `report.model.js`.
- Frontend: `report.service.js`, `ReportModal.jsx`.

Chức năng:

- Người dùng gửi báo cáo nội dung vi phạm.
- Admin xem và xử lý báo cáo trong dashboard.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `POST` | `/api/reports` | Tạo báo cáo |
| `GET` | `/api/admin/reports` | Admin xem báo cáo |
| `PUT` | `/api/admin/reports/:reportId/resolve` | Admin xử lý báo cáo |

### 12. Sticker

File liên quan:

- Backend: `sticker.route.js`, `sticker.model.js`.
- Frontend: `sticker.service.js`, các component chat.

Chức năng:

- Lấy sticker theo pack/category.
- Admin tạo/sửa/xóa sticker.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/stickers` | Danh sách sticker theo pack |
| `GET` | `/api/admin/stickers` | Admin xem sticker |
| `POST` | `/api/admin/stickers` | Admin tạo sticker |
| `PUT` | `/api/admin/stickers/:stickerId` | Admin cập nhật sticker |
| `DELETE` | `/api/admin/stickers/:stickerId` | Admin xóa sticker |

### 13. Quản trị hệ thống

File liên quan:

- Backend: `admin.route.js`, `admin.controller.js`, `admin.service.js`, `adminActionLog.model.js`.
- Frontend: `admin.service.js`, `AdminDashboard.jsx`.

Chức năng:

- Xem thống kê hệ thống.
- Quản lý người dùng.
- Xem chi tiết người dùng.
- Cập nhật trạng thái tài khoản.
- Xóa người dùng.
- Quản lý bài viết.
- Ẩn/xóa bài viết.
- Quản lý bình luận.
- Xóa bình luận.
- Quản lý báo cáo.
- Xử lý báo cáo.
- Xem action logs.
- Quản lý sticker.

Endpoint chính:

| Method | Endpoint | Mô tả |
| --- | --- | --- |
| `GET` | `/api/admin/stats` | Thống kê |
| `GET` | `/api/admin/users` | Danh sách user |
| `GET` | `/api/admin/users/:userId/detail` | Chi tiết user |
| `PUT` | `/api/admin/users/:userId/status` | Cập nhật trạng thái |
| `DELETE` | `/api/admin/users/:userId` | Xóa user |
| `GET` | `/api/admin/posts` | Danh sách bài viết |
| `PUT` | `/api/admin/posts/:postId/hide` | Ẩn bài viết |
| `DELETE` | `/api/admin/posts/:postId` | Xóa bài viết |
| `GET` | `/api/admin/comments` | Danh sách bình luận |
| `DELETE` | `/api/admin/comments/:commentId` | Xóa bình luận |
| `GET` | `/api/admin/reports` | Danh sách báo cáo |
| `PUT` | `/api/admin/reports/:reportId/resolve` | Xử lý báo cáo |
| `GET` | `/api/admin/logs` | Nhật ký admin |

Tất cả endpoint `/api/admin/*` yêu cầu JWT hợp lệ và role `admin`.

## Authentication và phân quyền

Client lưu token trong `localStorage` với key:

```text
token
```

Mỗi request qua `apiClient` sẽ tự động thêm:

```http
Authorization: Bearer <token>
```

Backend kiểm tra token bằng `authMiddleware`. Nếu endpoint cần quyền admin, dùng thêm:

```js
authorize("admin")
```

Response lỗi auth thường gặp:

- `UNAUTHORIZED`: thiếu token.
- `INVALID_TOKEN`: token sai.
- `TOKEN_EXPIRED`: token hết hạn.
- `INVALID_ACCOUNT`: account không tồn tại.
- `ACCOUNT_NOT_ACTIVE`: account chưa active hoặc bị khóa.
- `ACCOUNT_SUSPENDED`: account bị tạm ngưng.
- `SESSION_REVOKED`: phiên đăng nhập đã bị thu hồi.

## Upload file

File upload được lưu tại:

```text
server/storage/uploads/
```

Backend public file qua:

```text
http://localhost:5000/uploads/<filename>
```

Khi chạy frontend bằng Vite, `/uploads` được proxy sang backend nên có thể dùng URL:

```text
/uploads/<filename>
```

Định dạng hỗ trợ:

- Ảnh: JPEG, PNG, GIF, WebP.
- Video: MP4, QuickTime, AVI.
- Dung lượng tối đa: 10MB/file.

## Realtime WebSocket

Server Express được bọc bởi HTTP server trong `server/src/server.js`, sau đó attach:

```js
NotificationService.attachWebSocketServer(server);
ChatService.attachWebSocketServer(server);
```

Khi phát triển chức năng realtime mới:

1. Xác định sự kiện cần gửi: chat, notification, online status...
2. Xử lý nghiệp vụ trong service tương ứng.
3. Lưu dữ liệu vào MongoDB trước nếu sự kiện cần persistence.
4. Broadcast qua WebSocket cho đúng người nhận.
5. Frontend lắng nghe sự kiện trong hook/slice/component liên quan.
6. Cập nhật cache Redux/UI để không cần reload.

## Database models chính

| Model | Mục đích |
| --- | --- |
| `Account` | Email, password hash, provider, role, trạng thái, login sessions |
| `User` | Hồ sơ cá nhân, bạn bè, follow, block, cài đặt |
| `OTP` | OTP đăng ký/quên mật khẩu |
| `Post` | Bài viết, media, reaction, privacy, moderation |
| `Comment` | Bình luận và phản hồi |
| `Media` | Sub-document media dùng trong post/story/album |
| `Album` | Album media người dùng |
| `Story` | Story, viewer, reaction, reply |
| `Group` | Nhóm cộng đồng, admin, member, invite, request |
| `Conversation` | Hội thoại cá nhân/nhóm |
| `Message` | Tin nhắn text/image/sticker/share/story reply |
| `Notification` | Thông báo hệ thống |
| `Report` | Báo cáo nội dung |
| `Sticker` | Sticker chat |
| `AdminActionLog` | Nhật ký hành động admin |

## Quy ước response API

Các API thường trả về JSON theo dạng:

```json
{
  "success": true,
  "message": "Thông báo kết quả",
  "data": {}
}
```

Khi lỗi:

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Mô tả lỗi"
}
```

Khi thêm API mới, nên giữ cấu trúc response thống nhất để frontend dễ xử lý toast/loading/error.

## Hướng dẫn phát triển chức năng mới

### Thêm một API backend mới

Ví dụ thêm chức năng đánh dấu bài viết là nổi bật:

1. Thêm field vào `server/src/models/post.model.js` nếu cần:

```js
featured: {
  type: Boolean,
  default: false,
}
```

2. Thêm hàm repository trong `post.repository.js`:

```js
const markFeatured = (postId, value) =>
  Post.findByIdAndUpdate(postId, { featured: value }, { new: true });
```

3. Thêm business logic trong `post.service.js`.
4. Thêm controller trong `post.controller.js`.
5. Thêm route trong `post.route.js`:

```js
router.post("/:postId/featured", PostController.toggleFeatured);
```

6. Nếu chỉ admin được dùng, gắn `authorize("admin")` hoặc đặt API trong `admin.route.js`.
7. Test bằng Postman hoặc viết unit/integration test.

### Thêm API call ở frontend

Tạo hàm trong file service tương ứng:

```js
export const postAPI = {
  toggleFeatured: (postId) => apiClient.post(`/posts/${postId}/featured`),
};
```

Nếu cần state toàn cục:

1. Thêm async thunk/action trong slice.
2. Xử lý `pending`, `fulfilled`, `rejected`.
3. Component dispatch action.
4. Hiển thị loading/error/success bằng state hoặc `Toast`.

### Thêm một trang frontend mới

1. Tạo file trong `client/src/pages/<module>/<PageName>.jsx`.
2. Export trong `client/src/pages/<module>/index.js` và `client/src/pages/index.js`.
3. Thêm route vào `client/src/App.jsx`.
4. Nếu trang cần đăng nhập, bọc bằng `ProtectedPage`.
5. Thêm service/hook/component riêng nếu logic đủ lớn.
6. Cập nhật `uiSlice` nếu cần đánh dấu menu đang active.

### Thêm upload mới

1. Chọn middleware phù hợp:
   - `upload.imageUpload.single("avatar")` cho ảnh đơn.
   - `upload.postMedia` cho nhiều ảnh/video.
   - `upload.storyMedia` cho story một file.
2. Dùng `upload.handleUploadError` sau middleware upload.
3. Frontend gửi `FormData`.
4. Không tự set `Content-Type`; `apiClient` đã xóa header này khi data là `FormData`.

### Thêm thông báo realtime

1. Tạo notification record trong `notification.service.js`.
2. Xác định user nhận thông báo.
3. Broadcast qua WebSocket.
4. Frontend cập nhật dropdown/badge trong `Notifications.jsx` hoặc hook header.

### Thêm chức năng chat realtime

1. Xác thực người gửi bằng token.
2. Kiểm tra người dùng thuộc hội thoại.
3. Lưu `Message`.
4. Cập nhật `Conversation.lastMessage`.
5. Broadcast tin nhắn đến participants.
6. Frontend cập nhật `chatSlice` và UI hội thoại hiện tại.

## Kiểm thử

### Unit test backend

```bash
cd server
npm test
```

Hiện có test cho tiện ích OTP:

- `generateOTP`
- `isOTPExpired`

Khi thêm logic nghiệp vụ quan trọng, nên thêm test trong `server/tests`.

### Postman/Newman

Collections nằm trong:

```text
tests/api/
```

Các nhóm hiện có:

- `account`: đăng ký.
- `login`: đăng nhập.
- `forgot-password`: quên mật khẩu.
- `edit-profile`: sửa hồ sơ.
- `post`: bài viết.

Cách test thủ công:

1. Chạy backend.
2. Import collection và environment vào Postman.
3. Set `base_url` là `http://localhost:5000/api`.
4. Đăng nhập để lấy JWT.
5. Set biến `token`.
6. Chạy request theo thứ tự nghiệp vụ.

Một số thư mục có script PowerShell chạy Newman, ví dụ:

```powershell
.\tests\api\login\run_newman_login.ps1
```

## Tài liệu nghiệp vụ và biểu đồ

Use case diagram:

```text
diagram/00-system-overview.puml
diagram/01-auth-account.puml
diagram/02-profile-relationship.puml
diagram/03-post-story-media.puml
diagram/04-chat-conversation.puml
diagram/05-community-group.puml
diagram/06-notification-admin.puml
```

Sequence diagram theo từng use case nằm trong:

```text
diagram/sequence/
```

Đặc tả use case chi tiết nằm trong:

```text
diagram/usecase-specs/
```

Có thể mở bằng extension PlantUML trong VS Code hoặc render bằng PlantUML CLI.

## Gợi ý quy trình làm việc nhóm

1. Tạo branch theo chức năng, ví dụ `feature/group-invite`.
2. Đọc use case trong `diagram/usecase-specs` trước khi code.
3. Backend làm từ model/service/controller/route.
4. Frontend làm từ service/slice/hook/component/page.
5. Test API bằng Postman.
6. Chạy lint/build trước khi merge:

```bash
cd client
npm run lint
npm run build

cd ../server
npm test
```

7. Cập nhật README hoặc tài liệu use case nếu thay đổi nghiệp vụ.

## Lỗi thường gặp

### Frontend gọi API bị 404 hoặc không kết nối

- Kiểm tra backend có chạy ở port `5000`.
- Kiểm tra `client/vite.config.js` proxy `/api`.
- Kiểm tra request có đúng prefix `/api`.

### Bị lỗi CORS

- Thêm origin frontend vào `server/.env`:

```env
CORS_ORIGIN=http://localhost:5173
```

- Restart backend sau khi đổi `.env`.

### Không đăng nhập được do token

- Kiểm tra `JWT_SECRET` tồn tại trong server `.env`.
- Xóa token cũ trong browser localStorage.
- Kiểm tra account có trạng thái `active`.

### Không gửi được OTP email

- Kiểm tra `SMTP_USER` và `SMTP_PASS`.
- Với Gmail cần dùng App Password.
- Trong môi trường dev có thể đặt `EMAIL_USE_MOCK=true`.

### Upload ảnh/video lỗi

- Kiểm tra file dưới 10MB.
- Kiểm tra mimetype thuộc danh sách hỗ trợ.
- Với post dùng field `media`, `files`, `images`, `image`, `videos` hoặc `video`.
- Với avatar/cover/group avatar dùng đúng field backend yêu cầu.

### Không thấy ảnh upload

- Kiểm tra file có tồn tại trong `server/storage/uploads`.
- Kiểm tra backend serve `/uploads`.
- Nếu chạy qua Vite, kiểm tra proxy `/uploads`.

### Admin không vào được dashboard

- Token phải thuộc account có `role: "admin"`.
- Endpoint `/api/admin/*` dùng cả `authMiddleware` và `authorize("admin")`.

## Ghi chú bảo mật khi deploy

- Không commit file `.env`.
- Đổi `JWT_SECRET` và `SESSION_SECRET`.
- Dùng HTTPS.
- Cấu hình `CORS_ORIGIN` đúng domain production.
- Không bật endpoint dev OTP trong production.
- Kiểm soát quyền truy cập thư mục upload.
- Cân nhắc lưu media trên Google Drive/S3 thay vì local disk.
- Bật rate limit cho auth, forgot password, edit profile.
- Kiểm tra role admin trước mọi API quản trị.

## Checklist trước khi bàn giao

- Backend chạy được `npm run dev`.
- Frontend chạy được `npm run dev`.
- `GET /api/health` trả về server running.
- Đăng ký và xác thực OTP được.
- Đăng nhập nhận token.
- Tạo bài viết, bình luận, like được.
- Upload avatar/media được.
- Chat và thông báo realtime hoạt động.
- Trang admin chỉ truy cập được bằng admin.
- Postman collection quan trọng chạy pass.
- `client npm run build` không lỗi.
- `server npm test` pass.
