async function test() {
  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test403-empleador@gmail.com',
      password: 'Password123!',
      name: 'Test Empleador',
      role: 'EMPLEADOR',
      ruc: '10123456789',
      rubro: 'IT'
    })
  });
  let data;
  try {
    data = await res.json();
  } catch(e) {}
  if (!res.ok) {
    console.log("Register failed:", data);
    // Let's try to login
    const resL = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test403@unsa.edu.pe',
        password: 'Password123!'
      })
    });
    data = await resL.json();
    if (!resL.ok) {
      console.log("Login failed:", data);
      return;
    }
  }
  const token = data.token;
  console.log("Got token");

  const res2 = await fetch('http://localhost:3000/api/users/graduate-profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      skills: ['React']
    })
  });
  const data2 = await res2.json();
  console.log("PUT /api/users/graduate-profile:", data2);
}

test();
