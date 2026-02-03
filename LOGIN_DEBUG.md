# Login 500 Error - Diagnostic Information

## Network Request Details
- **Request URL**: `https://officeapi.samis.co.ke/api/auth/signin`
- **Request Method**: `POST`
- **Status Code**: `500 Internal Server Error`
- **Remote Address**: `104.21.29.114:443`
- **Request is reaching the server** ✅

## Client-Side Status: ✅ CORRECT

The client is sending the request correctly:

**Request Payload:**
```json
{
  "phoneNo": "0727247841",
  "password": "85B1EB"
}
```

**Request Details:**
- Endpoint: `POST /api/auth/signin`
- Content-Type: `application/json`
- Headers: No auth token (correct for signin)
- Format: Matches API documentation exactly

## Server-Side Issue: ❌ 500 Internal Server Error

The server is receiving the request but crashing. Check the following:

### 1. Check Server Logs
Look for stack traces or exceptions in your Spring Boot application logs. The error should show:
- Which service/component is failing
- Database connection issues
- Null pointer exceptions
- Missing dependencies

### 2. Verify Default User Exists
According to API docs, `checkDefaultUser()` should create:
- Phone: `0727247841`
- Username: `karua`
- Email: `karuamuhindi@gmail.com`
- Fullname: `Muhindi Karua`
- Usertype: `admin`

**Check if this user exists in the database.**

### 3. Database Connection
Verify:
- Database is accessible
- Connection pool is configured
- User table exists
- Required columns exist

### 4. Service Dependencies
Ensure these are properly initialized:
- `AuthenticationManager`
- `SamisUserService`
- `PasswordEncoder`
- `JwtUtils`
- `MessageController` (for SMS)
- `RoleRepository`

### 5. Password Encoding
The password `85B1EB` needs to be:
- Encrypted using `PasswordEncoder`
- Stored in the database
- Matched during authentication

**Check if password encoding/decoding is working correctly.**

### 6. JWT Token Generation
Verify `JwtUtils` is:
- Properly configured
- Generating tokens correctly
- Not throwing exceptions

## Test the API Directly

You can test the endpoint directly using curl:

```bash
curl -X POST https://officeapi.samis.co.ke/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNo": "0727247841",
    "password": "85B1EB"
  }'
```

Or using Postman/Insomnia with the same payload.

## Common Causes of 500 Errors

1. **NullPointerException**: A service or repository is null
2. **DatabaseException**: Connection or query failure
3. **BeanInitializationException**: Spring bean not properly configured
4. **PasswordEncoderException**: Password encoding/decoding failure
5. **JwtException**: Token generation failure
6. **Missing User**: Default user not created or user doesn't exist

## Next Steps

1. **Check server logs immediately** - This will show the exact error
2. **Verify database connection** - Ensure DB is accessible
3. **Check if default user exists** - Run a query to verify
4. **Test password encoding** - Verify PasswordEncoder is working
5. **Check Spring Boot startup logs** - Look for initialization errors

## Client-Side Request Verification

The client is sending:
- ✅ Correct endpoint: `/api/auth/signin`
- ✅ Correct method: `POST`
- ✅ Correct Content-Type: `application/json`
- ✅ Correct payload format: `{ phoneNo, password }`
- ✅ No unnecessary headers (X-School, Authorization)
- ✅ Phone number: `0727247841`
- ✅ Password: `85B1EB` (6-char hex, uppercase)

**The client-side code is correct. The issue is 100% server-side.**

---

## What You Must Do to Fix the 500 Error

The **only** way to fix this is on the **backend** (officeapi.samis.co.ke). The frontend cannot fix a 500.

1. **Get access to the server** that hosts `https://officeapi.samis.co.ke` (e.g. the machine or hosting provider).
2. **Check the application logs** when you try to log in. The stack trace will show the exact line and exception (e.g. NullPointerException, DB connection error, missing bean).
3. **Fix the backend** based on that error (e.g. ensure DB is up, default user exists, PasswordEncoder/JWT are configured).

**In the browser:** After a failed login, open DevTools → Console. You’ll see `🔴 500 SERVER ERROR` with `responseData` and `serverMessage`. If the API returns a JSON error body, that message will also appear in the toast.
