create issue.md that fill planning for implementation by junior programmer

fill from planning is as follows:

create table users

users have 6 coloumns

1. id
2. name
3. email
4. password
5. created_at
6. updated_at

type of each column is as follows:

1. id -> uuid -> auto increment
2. name -> varchar -> length 255 -> not null
3. email -> varchar -> length 255 -> not null -> unique
4. password -> varchar -> length 255 -> not null -> min length 8 -> password hashed using bcrypt
5. created_at -> timestamp -> not null -> default current timestamp

crate new API for users

1. register -> POST /api/v1/users
body : { name, email, password }
response : { data : "ok" }
response error : { error: "email is already taken"}

2. login -> POST /api/v1/users/login
body : { email, password }
response : { token }
response error : { error: "email or password is wrong"}

project folder:

- routes: fill routing elysiajs
- service: fill business logic

file naming:

- routes: user-routes.ts
- service: user-service.ts

explain the step that must be taken
for implementation this features, 
consider implementing junior programmer friendly or 
cheaper ai friendly

