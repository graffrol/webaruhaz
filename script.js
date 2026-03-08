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
    const textLabel = document.getElementById("strength-text");
    const bars = [
        document.getElementById("bar-1"),
        document.getElementById("bar-2"),
        document.getElementById("bar-3")
    ];
    
    let strength = 0;
    if (val.length > 6) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;

    // Szöveg frissítése
    const levels = ["Gyenge", "Közepes", "Erős"];
    const colors = ["red", "orange", "green"];
    
    textLabel.innerText = val.length > 0 ? `Jelszó erőssége: ${levels[strength - 1] || "Gyenge"}` : "Jelszó erőssége: -";
    
    // Sávok színezése
    bars.forEach((bar, index) => {
        if (index < strength) {
            bar.style.backgroundColor = colors[strength - 1];
        } else {
            bar.style.backgroundColor = "#eee";
        }
    });
}

      function toggleCompanyFields() {
        document.getElementById("reg-company").style.display =
          document.getElementById("user-type").value === "company"
            ? "block"
            : "none";
      }
      // Figyeli, ha az Entert nyomod meg a jelszó mezőben
document.getElementById("login-password").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Megakadályozza az oldal alapértelmezett újratöltését
        handleLogin(); // Meghívja a már meglévő bejelentkező függvényedet
    }
});

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

    if (pError) {
        alert("Profil hiba: " + pError.message); 
    } else {
        alert("Sikeres regisztráció!");
        
        // --- ITT TÖRTÉNIK A VARÁZSLAT ---
        closeModal("register-modal"); // Bezárja az ablakot
        
        // Ez üríti ki az összes mezőt (ezért kellett a <form id="register-form">)
        document.getElementById("register-form").reset();
        
        // Eltünteti az esetleges céges mezőt, ha véletlenül nyitva maradt volna
        document.getElementById("reg-company").style.display = "none";
    }
}
// A régi helyett ezt használd:
async function updateProfile(newData) {
    // Kérdezzük le az aktuális usert
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert("Nincs bejelentkezve!");

    const { error } = await supabaseClient
        .from('profiles')
        .update(newData)
        .eq('id', user.id); // Itt használd a user.id-t!
        
    if (error) alert("Hiba az adatok mentésekor: " + error.message);
    else alert("Adatok sikeresen frissítve!");
}
async function updatePassword(newPassword) {
    const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
    });
    if (error) alert("Hiba a jelszó módosításakor!");
    else alert("Jelszó sikeresen megváltoztatva!");
}
function toggleProfileMenu() {
    const menu = document.getElementById("profile-menu");
    if (menu.style.display === "none" || menu.style.display === "") {
        menu.style.display = "block";
    } else {
        menu.style.display = "none";
    }
}

// Bónusz: Ha máshova kattintasz az oldalon, a menü bezáruljon
window.onclick = function(event) {
    if (!event.target.matches('#user-display')) {
        const menu = document.getElementById("profile-menu");
        if (menu && menu.style.display === "block") {
            menu.style.display = "none";
        }
    }
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

      async function finishOrder() {
    // 1. User azonosítása
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return alert("Kérlek jelentkezz be a rendeléshez!");

    // 2. Profiladatok lekérése az adatbázisból
    const { data: profile, error: pError } = await supabaseClient
        .from('profiles')
        .select('full_name, address')
        .eq('id', user.id)
        .maybeSingle();

    if (pError || !profile) return alert("Hiba a felhasználói adatok lekérésekor!");

    // 3. Mentés az orders táblába a profilból jövő adatokkal
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

    const { error } = await supabaseClient.from('orders').insert([{
        user_id: user.id,
        total_price: total,
        items: JSON.stringify(cart),
        shipping_name: profile.full_name, // Innen jön a név
        shipping_addr: profile.address,   // Innen jön a cím
        status: 'feldolgozás alatt'
    }]);

    if (error) {
        alert("Hiba a rendelés során: " + error.message);
    } else {
        alert("Köszönjük a rendelésed, " + profile.full_name + "!");
        clearCart();
        closeAll();
        document.getElementById("checkout-form").style.display = "none";
        document.getElementById("order-start-btn").style.display = "block";
    }
}
      // A kijelentkezés módosítása
      async function handleLogout() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
        console.error("Hiba a kijelentkezéskor:", error);
    } else {
        // Töröljük a nevet és frissítjük az oldalt
        document.getElementById('user-display').innerText = "";
        location.reload(); // Oldal újratöltése a kijelentkezés érvényesítéséhez
    }
}
async function showPurchases() {
    document.getElementById("profile-menu").style.display = "none";
    const modal = document.getElementById("purchases-modal");
    modal.style.display = "flex";
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const { data, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const list = document.getElementById("purchases-list");
    if (error || !data || data.length === 0) {
        list.innerHTML = "<p>Még nem rendeltél semmit.</p>";
        return;
    }

    list.innerHTML = data.map(order => {
        // JSON parse a termékek kibontásához
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        
        const itemsList = items.map(item => 
            `<li>${item.name} (${item.qty} db) - ${(item.price * item.qty).toLocaleString()} Ft</li>`
        ).join("");

        return `
            <div class="order-item" style="border-bottom: 2px solid #eee; padding: 15px 0;">
                <p><strong>Dátum:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
                <p><strong>Összeg:</strong> ${order.total_price.toLocaleString()} Ft</p>
                <p><strong>Állapot:</strong> ${order.status}</p>
                <p><strong>Termékek:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">${itemsList}</ul>
            </div>
        `;
    }).join("");
}

      loadProducts();
    