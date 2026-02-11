Create Student
POST: http://localhost:3001/api/students
{
"firstName": "Ali",
"lastName": "Valiyev",
"phone": "+998901112233",
"gender": "MALE",
"birthDate": "2010-05-10",
"photoUrl:"https:/example.jpn" <===== fayl qilib ham yuklanadi
"idCard": "AE1234567" <=========== Pasport seriya raqam
"address": "Jizzakh, Zarbdor",
"note": "Yangi student"
}

getAll Student
GET: http://localhost:3001/api/students
role: admin, manager
getId Student
GET: http://localhost:3001/api/students/:id
role: admin, manager

PUT Student
PUT: http://localhost:3001/api/students/:id
{
"firstName": "Ali",
"lastName": "Valiyev",
"phone": "+998901112233",
"gender": "MALE",
"birthDate": "2010-05-10",
"photoUrl:"https:/example.jpn" <===== fayl qilib ham yuklanadi
"idCard": "AE1234567" <=========== Pasport seriya raqam
"address": "Jizzakh, Zarbdor",
"note": "Yangi student"
}
role: admin, manager

Delete Student (Soft Delete)
DELETE : http://localhost:3001/api/students/:id
role: admin, manager
ID URLda

Get Deleted Student History
GET : http://localhost:3001/api/students/deleted/history <===== ochirilgan malumot tarixi
Role: faqat admin uchun

Restore Student
PUT : http://localhost:3001/api/students/:id/restore
ID URLda
role: admin, manager
