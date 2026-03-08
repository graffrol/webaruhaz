const SUPABASE_URL = "https://cusfbbukgmklizkirlfk.supabase.co";
const SUPABASE_KEY = "sb_publishable_bbUHpTINCLVh1wpyZuamIA_2I0kBcPA";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cart = [];
let isLoginMode = true;

// --- AUTH ---
// Modal Vezérlés
      function openLogin() {
        document.getElementById("login-modal").style.display = "flex";
      }
      function openRegister() {
        closeModal("login-modal");
        document.getElementById("register-modal").style.display = "flex";
      }
      function closeModal(id) {
        document.getElementById(id).style.display = "none";
      }
      function closeAll() {
        closeModal("login-modal");
        closeModal("register-modal");
      }

      function checkStrength(val) {
        const bar = document.getElementById("strength-bar");
        let s = val.length > 6 ? 33 : 0;
        if (/[A-Z]/.test(val)) s += 33;
        if (/[0-9]/.test(val)) s += 34;
        bar.style.width = s + "%";
        bar.style.backgroundColor =
          s < 50 ? "red" : s < 80 ? "orange" : "green";
      }

      function toggleCompanyFields() {
        document.getElementById("reg-company").style.display =
          document.getElementById("user-type").value === "company"
            ? "block"
            : "none";
      }

      async function handleLogin() {
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          alert("Hiba: " + error.message);
        } else {
          closeModal("login-modal");
          location.reload(); // Ez frissíti az állapotot, hogy eltűnjön a bejelentkezés gomb
        }
      }

      async function handleRegister() {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    // 1. Regisztráció az auth.users táblába
    const { data, error } = await supabaseClient.auth.signUp({ 
        email: email, 
        password: password 
    });
    
    if (error) return alert("Hiba a regisztrációkor: " + error.message);

    // 2. Adatok mentése a profiles táblába (itt adjuk át az e-mailt!)
    const { error: pError } = await supabaseClient.from('profiles').insert([{
        id: data.user.id, // A regisztrált user ID-ja
        email: email,     // <-- ITT ADOD ÁT AZ E-MAILT!
        full_name: document.getElementById('reg-fname').value + " " + document.getElementById('reg-lname').value,
        phone: document.getElementById('reg-phone').value,
        address: `${document.getElementById('reg-zip').value} ${document.getElementById('reg-city').value}, ${document.getElementById('reg-street').value}`,
        is_company: document.getElementById('user-type').value === 'company',
        company_name: document.getElementById('reg-company').value
    }]);

    if (pError) alert("Profil hiba: " + pError.message); 
    else alert("Sikeres regisztráció!");
}

      // 1. Külön függvény a név lekérésére
  async function updateUserName(userId) {
    const display = document.getElementById('user-display');
    
    // Lekérdezzük a teljes nevet
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error("Hiba a név lekérésekor:", error.message);
        return;
    }

    // Ha van találat, kiírjuk a teljes nevet
    if (data && data.full_name) {
        // A név vágása szóköz mentén
        // A trim() eltávolítja az esetleges extra szóközöket az elejéről/végéről
        const parts = data.full_name.trim().split(' ');
        
        // A keresztnév a tömb második eleme (index 1), ha van. 
        // Ha csak egy név van, akkor az elsőt (index 0) írjuk ki.
        const firstName = parts[0];
        
        display.innerText = `Üdvözöllek ${firstName}!`;
    } else {
        // Ha nincs adat a profiles táblában, fallback az email címre
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            display.innerText = `Üdvözöllek ${session.user.email}!`;
        }
    }
}

      // 2. Az eseményfigyelő most már csak hívja a függvényt, nem vár rá
      supabaseClient.auth.onAuthStateChange((event, session) => {
    const user = session?.user;
    const authBtn = document.getElementById('nav-auth-btn');
    const display = document.getElementById('user-display');

    if (user) {
        updateUserName(user.id);
        authBtn.innerText = "Kijelentkezés";
        authBtn.onclick = handleLogout;
    } else {
        display.innerText = "";
        authBtn.innerText = "Bejelentkezés";
        authBtn.onclick = openLogin;
    }
});

      // --- SHOP LOGIC ---
      async function loadProducts() {
        const { data } = await supabaseClient
          .from("products")
          .select("*")
          .order("id", { ascending: true });
        const imgs = [
          "https://images.pexels.com/photos/2115256/pexels-photo-2115256.jpeg?w=400",
          "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?w=400",
          "https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?w=400",
        ];
        document.getElementById("products-container").innerHTML = data
          .map(
            (p, i) => `
                <div class="product-card">
                    <img src="${imgs[i % 3]}" class="product-image">
                    <div class="product-info">
                        <h3>${p.name}</h3>
                        <p class="product-price">${Number(p.price).toLocaleString()} Ft</p>
                        <button class="buy-button" onclick="addToCart('${p.id}','${p.name}',${p.price})">Kosárba</button>
                    </div>
                </div>
            `,
          )
          .join("");
      }

      function toggleCart() {
        document.getElementById("cart-sidebar").classList.toggle("open");
        document.getElementById("overlay").classList.toggle("active");
      }

      function closeAll() {
        document.getElementById("cart-sidebar").classList.remove("open");
        document.getElementById("overlay").classList.remove("active");
      }

      function addToCart(id, name, price) {
        const item = cart.find((i) => i.id === id);
        if (item) item.qty++;
        else cart.push({ id, name, price, qty: 1 });
        updateUI();
        if (!document.getElementById("cart-sidebar").classList.contains("open"))
          toggleCart();
      }

      function changeQty(id, delta) {
        const item = cart.find((i) => i.id === id);
        if (item) {
          item.qty += delta;
          if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
        }
        updateUI();
      }

      function updateUI() {
        const list = document.getElementById("cart-items");
        list.innerHTML =
          cart.length === 0
            ? "<p>Üres a kosarad.</p>"
            : cart
                .map(
                  (i) => `
                <div class="cart-item">
                    <div><strong>${i.name}</strong><br><small>${i.price.toLocaleString()} Ft</small></div>
                    <div class="qty-controls">
                        <button onclick="changeQty('${i.id}', -1)">-</button>
                        <span>${i.qty}</span>
                        <button onclick="changeQty('${i.id}', 1)">+</button>
                        <button class="remove-btn" onclick="changeQty('${i.id}', -${i.qty})">🗑️</button>
                    </div>
                </div>
            `,
                )
                .join("");
        const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
        document.getElementById("cart-total").innerText =
          total.toLocaleString() + " Ft";
        document.getElementById("cart-count").innerText = cart.reduce(
          (s, i) => s + i.qty,
          0,
        );
      }

      function clearCart() {
        cart = [];
        updateUI();
      }

      function showCheckout() {
        if (cart.length === 0) return;
        document.getElementById("checkout-form").style.display = "block";
        document.getElementById("order-start-btn").style.display = "none";
      }

      function finishOrder() {
        const name = document.getElementById("cust-name").value;
        if (!name) return alert("Név kötelező!");
        alert("Rendelés elküldve! Köszönjük, " + name);
        clearCart();
        closeAll();
        document.getElementById("checkout-form").style.display = "none";
        document.getElementById("order-start-btn").style.display = "block";
      }
      // A kijelentkezés módosítása
      async function handleLogout() {
        await supabaseClient.auth.signOut();
        location.reload(); // Ez kötelező, hogy az oldal újraolvassa a session-t
      }

      loadProducts();
    