create issue.md that fill planning for implementation by junior programmer

fill from planning is as follows:

create API for get logged in user

endpoint: GET /api/v1/users/current

Header:

- Authorization: Bearer <token>

response :

{
  data: {
    id: "uuid",
    name: "string",
    email: "string",
    created_at: "timestamp",
  }
}

response error :

{
  error: "Unauthorized"
}

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

