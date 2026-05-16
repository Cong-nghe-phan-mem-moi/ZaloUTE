# ZaloUTE Post Management API Documentation

## Giới thiệu

Đây là tài liệu API cho hệ thống quản lý bài viết (Post Management System) của ZaloUTE.

## Base URL

```
http://localhost:5000/api
```

## Authentication

Tất cả các endpoint (ngoại trừ health check) yêu cầu JWT token trong header:

```
Authorization: Bearer {token}
```

---

## 4.1 Tạo Bài Viết (Create Post)

### Endpoint

```
POST /posts
```

### Request Body

```json
{
  "content": "Nội dung bài viết",
  "media": []
}
```

### Response (201 Created)

```json
{
  "success": true,
  "message": "Tạo bài viết thành công",
  "data": {
    "_id": "post_id",
    "author": {
      "_id": "user_id",
      "fullName": "John Doe",
      "avatar": "url",
      "email": "john@example.com"
    },
    "content": "Nội dung bài viết",
    "media": [],
    "likes": [],
    "commentCount": 0,
    "createdAt": "2026-05-16T...",
    "updatedAt": "2026-05-16T..."
  }
}
```

---

## 4.2 Chỉnh Sửa Bài Viết (Update Post)

### Endpoint

```
PUT /posts/{postId}
```

### Request Body

```json
{
  "content": "Nội dung mới",
  "media": []
}
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Chỉnh sửa bài viết thành công",
  "data": {
    /* updated post */
  }
}
```

### Error Cases

- **403 Forbidden**: Người dùng không phải là tác giả bài viết
- **404 Not Found**: Bài viết không tồn tại

---

## 4.3 Xóa Bài Viết (Delete Post)

### Endpoint

```
DELETE /posts/{postId}
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Xóa bài viết thành công"
}
```

### Error Cases

- **403 Forbidden**: Người dùng không phải là tác giả bài viết
- **404 Not Found**: Bài viết không tồn tại

---

## 4.4 Xem News Feed (Get News Feed)

### Endpoint

```
GET /posts/feed?page=1&limit=10
```

### Query Parameters

- `page` (optional, default: 1): Trang cần lấy
- `limit` (optional, default: 10): Số bài viết mỗi trang

### Response (200 OK)

```json
{
  "success": true,
  "message": "Lấy news feed thành công",
  "data": {
    "posts": [
      {
        "_id": "post_id",
        "author": {
          /* author info */
        },
        "content": "Nội dung",
        "media": [],
        "likes": [
          /* user objects */
        ],
        "commentCount": 5,
        "isLiked": false,
        "createdAt": "2026-05-16T...",
        "updatedAt": "2026-05-16T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

## 4.5 Xem Danh Sách Like (Get Post Likes)

### Endpoint

```
GET /posts/{postId}/likes?page=1&limit=10
```

### Query Parameters

- `page` (optional, default: 1): Trang cần lấy
- `limit` (optional, default: 10): Số người mỗi trang

### Response (200 OK)

```json
{
  "success": true,
  "message": "Lấy danh sách thích thành công",
  "data": {
    "likes": [
      {
        "_id": "user_id",
        "fullName": "John Doe",
        "avatar": "url",
        "email": "john@example.com"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

## 4.6 Xem Danh Sách Bình Luận (Get Post Comments)

### Endpoint

```
GET /posts/{postId}/comments?page=1&limit=10
```

### Query Parameters

- `page` (optional, default: 1): Trang cần lấy
- `limit` (optional, default: 10): Số bình luận mỗi trang

### Response (200 OK)

```json
{
  "success": true,
  "message": "Lấy danh sách bình luận thành công",
  "data": {
    "comments": [
      {
        "_id": "comment_id",
        "author": {
          "_id": "user_id",
          "fullName": "Jane Doe",
          "avatar": "url",
          "email": "jane@example.com"
        },
        "content": "Bình luận",
        "createdAt": "2026-05-16T...",
        "updatedAt": "2026-05-16T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    }
  }
}
```

---

## Thêm Các Endpoint Khác

### Like/Unlike Post

```
POST /posts/{postId}/like
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": "Thích bài viết" (hoặc "Bỏ thích bài viết"),
  "data": {
    "postId": "post_id",
    "isLiked": true,
    "likeCount": 5
  }
}
```

### Get Single Post

```
GET /posts/{postId}
```

**Response (200 OK)**

```json
{
  "success": true,
  "message": "Lấy bài viết thành công",
  "data": {
    /* post object */
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Nội dung bài viết không được để trống"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Chưa đăng nhập"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Bạn không có quyền thực hiện hành động này"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Bài viết không tồn tại"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Lỗi khi xử lý yêu cầu",
  "error": "Error details"
}
```

---

## Client Side Usage

### Import postAPI

```javascript
import { postAPI } from "../services/api";
```

### Create Post

```javascript
const response = await postAPI.createPost(
  "Nội dung bài viết",
  [], // media array
);
```

### Get News Feed

```javascript
const response = await postAPI.getNewsFeed(page, limit);
```

### Like Post

```javascript
const response = await postAPI.toggleLike(postId);
```

### Get Post Likes

```javascript
const response = await postAPI.getPostLikes(postId, page, limit);
```

### Get Post Comments

```javascript
const response = await postAPI.getPostComments(postId, page, limit);
```

---

## Redux Slice Usage

```javascript
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { getNewsFeed, createPost, toggleLike } from '../store/slices/postSlice'

const MyComponent = () => {
  const dispatch = useAppDispatch()
  const { posts, loading, error } = useAppSelector(state => state.posts)

  // Load news feed
  useEffect(() => {
    dispatch(getNewsFeed({ page: 1, limit: 10 }))
  }, [dispatch])

  // Create post
  const handleCreatePost = (content) => {
    dispatch(createPost({ content, media: [] }))
  }

  // Like post
  const handleLike = (postId) => {
    dispatch(toggleLike(postId))
  }

  return (
    // JSX code
  )
}
```

---

## Testing with Postman

Import file: `ZaloUTE_Post_API.postman_collection.json`
Environment: `environment.json`

Các bước:

1. Set `base_url` = `http://localhost:5000/api`
2. Set `token` = JWT token sau khi login
3. Set `postId` = ID của bài viết cần test
4. Chạy các request theo thứ tự
