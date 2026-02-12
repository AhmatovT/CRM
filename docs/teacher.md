Create Teacher
POST: http://localhost:3001/api/teachers

{
"firstName": "Ali",
"lastName": "Valiyev",
"phone": "+998901112233",
"gender": "MALE",
"paymentType": SALARY || PERCENT <===== ikalasidan 1tasini tanlaydi salary===oylik tolov qolda kiritiladi || PERCENT==FOIZ
"monthlySalary":50000 oylik tolov qiymati
"birthDate": "2010-05-10",
"photoUrl": "https://example.jpg",
}

photoUrl fayl qilib ham yuklanadi

getAll Teacher
GET: http://localhost:3001/api/teachers
role: admin, manager

getId Teacher
GET: http://localhost:3001/api/teachers/:id
role: admin, manager
ID URLda

PUT Teacher
PUT: http://localhost:3001/api/teachers/:id

{
"firstName": "Ali",
"lastName": "Valiyev",
"phone": "+998901112233",
"gender": "MALE",
"birthDate": "2010-05-10",
"photoUrl": "https://example.jpg",
"idCard": "AE1234567",
"address": "Jizzakh, Zarbdor",
"note": "Yangilangan teacher ma'lumoti"
}

role: admin, manager
photoUrl fayl qilib ham yuklanadi
ID URLda

Delete Teacher (Soft Delete)
DELETE: http://localhost:3001/api/teachers/:id

role: admin, manager
ID URLda

Get Deleted Teacher History
GET: http://localhost:3001/api/teachers/deleted/history <===== o‘chirilgan teacher ma’lumot tarixi
role: faqat admin uchun

Restore Teacher
PUT: http://localhost:3001/api/teachers/:id/restore
ID URLda
role: admin, manager
