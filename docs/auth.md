# CRM Auth API Docs

Base URL: http://localhost:3001/api

Auth:

- Cookie-based authentication
- Cookies:
  - access_token (httpOnly)
  - refresh_token (httpOnly)

---

### POST /auth/login

Login qiladi va cookie o‘rnatadi.

Request body:
{
"phone": "998900000001",
"password": "SuperAdmin123!"
}

Response .json:
{
"accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWxmYjAzejAwMDAwOGd0N2t5czBsejBpIiwicm9sZSI6IkFETUlOIiwidmVyIjowLCJpYXQiOjE3NzA2NDk2NTEsImV4cCI6MTc3MDY1MDU1MX0.iYhPjpApanKqWVl9QcU4v_wXkaXIXN5QK0Khqzjw1Zg",
"mustChangePassword": false,
"role": "ADMIN",
"id": "cmlfb03z000008gt7kys0lz0i"
}

### GET /auth/me

AccessToken bilan malumot oladi

Request:
BearerToken: AccessToken

Response .json:
{
"userId": "cmlfb03z000008gt7kys0lz0i",
"role": "ADMIN",
"mustChangePassword": false
}

### GET /auth/logout

Logout bilan tokenlarni revoke qiladi

Response .json:
{
"ok": true
}

1.

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWxmYjAzejAwMDAwOGd0N2t5czBsejBpIiwiaWF0IjoxNzcwNjUwNzcxLCJleHAiOjE3NzMyNDI3NzF9.Zg0MWj3IwR\_\_zKc4-9H7EtT8UWyq0Q4NSf3EnXg2C5U
