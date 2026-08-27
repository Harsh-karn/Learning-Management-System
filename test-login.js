const go = async () => {
  const loginRes = await fetch("https://learning-management-system-production-3a65.up.railway.app/api/auth/local", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: "testtest123@example.com", password: "password123", deviceId: "my-device-id-123" })
  });
  const loginData = await loginRes.json();
  console.log("Login response with deviceId:", JSON.stringify(loginData, null, 2));
}
go();
