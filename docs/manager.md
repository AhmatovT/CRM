Create Manager
POST: http://localhost:3001/api/managers

{
"firstName": "Ali",
"lastName": "Valiyev",
"phone": "+998901112233",
"password": "StrongPass123",
"gender": "MALE",
"birthDate": "1998-05-10",
"salary": 3500000,
"photoUrl": "https://example.jpg",
"note": "Yangi manager"
}
Role:Admin
salary majburiy (0 yoki undan katta)
photoUrl ixtiyoriy
note ixtiyoriy

Get All Managers
GET: http://localhost:3001/api/managers

role: admin

Get ID Manager
GET: http://localhost:3001/api/managers/:id

role: admin
ID URLda

Update Manager
PATCH: http://localhost:3001/api/managers/:id

ID URLda
Body (UpdateManagerDto bo‘yicha kerakli fieldlar):

{
"firstName": "Alijon",
"lastName": "Valiyev",
"phone": "+998901112244",
"password": "NewStrongPass123",
"gender": "MALE",
"birthDate": "1998-05-10",
"salary": 4000000,
"photoUrl": "https://example-new.jpg",
"note": "Lavozim yangilandi"
}

Delete Manager (Soft Delete)
DELETE: http://localhost:3001/api/managers/:id

role: admin
ID URLda

Get Deleted Manager History
GET: http://localhost:3001/api/managers/deleted/history <===== o‘chirilgan managerlar tarixi (kim o‘chirgani, qachon o‘chirilgani)
role: faqat admin uchun

Restore Manager
PUT: http://localhost:3001/api/managers/:id/restore
ID URLda
role: admin
