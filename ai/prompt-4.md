create issue.md that fill planning for implementation by junior programmer

fill from planning is as follows:

create API for logout user

endpoint: POST /api/v1/users/logout

Header:

- Authorization: Bearer <token>

response :

{
  data: "OK"
}

response error :

{
  error: "Unauthorized"
}

if logout success, delete session by token

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

