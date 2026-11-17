// A stand-in for the NestJS API, for working on the staff screens without
// production credentials or a database. Run it, point the dev server at it
// (API_ORIGIN=http://localhost:3199 in Frontend/.env.local), and /admin opens
// already signed in as an admin with a handful of made-up orders in every
// state the board has to draw.
//
// Admin endpoints are answered from memory. Public menu reads are passed
// through to the live API so the storefront shows the real menu. Nothing is
// written anywhere; restarting it puts every order back.
//
//   node Frontend/scripts/mock-admin-api.mjs
//
// While it runs, these change what the board sees:
//   curl http://localhost:3199/__mock/new     a new order arrives (rings the doorbell)
//   curl http://localhost:3199/__mock/down    every admin request fails, until called again
//   curl http://localhost:3199/__mock/clear   nothing is waiting (the empty state)
import http from "node:http";

const LIVE = "https://fire-house-api.onrender.com";
const PORT = 3199;

const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const addr = (firstName, lastName, phone, addressLine) => ({
  firstName, lastName, phone, addressLine, city: "Cairo", governorate: "Cairo", postalCode: null,
});
const item = (name, quantity, unitPrice, extra = {}) => ({
  product: name.toLowerCase().replace(/\W+/g, "-"), name, slug: name.toLowerCase().replace(/\W+/g, "-"),
  color: null, size: null, variant: null, modifiers: [], note: null, image: null,
  unitPrice, quantity, lineTotal: unitPrice * quantity, ...extra,
});
const mod = (name, groupName = "Extras") => ({ id: name, name, priceAdjustment: 1500, groupName });

let seq = 1041;
function order(partial) {
  const items = partial.items;
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return {
    _id: `o${seq}`, orderNumber: `FH-${seq++}`, user: null, guestEmail: "guest@example.com",
    subtotal, shippingCost: 3000, discountAmount: 0, couponCode: null, total: subtotal + 3000,
    currency: "EGP", paymentReference: null, trackingNumber: null, ...partial,
  };
}

const orders = [
  order({ shippingAddress: addr("Omar", "Hassan", "01012345678", "12 El Tahrir St, Apt 4, Dokki"), paymentMethod: "cod", paymentStatus: "pending", fulfillmentStatus: "unfulfilled", createdAt: minutesAgo(23),
    items: [item("Classic Smash Burger", 2, 18500, { variant: { id: "d", name: "Double", priceAdjustment: 6000 }, modifiers: [mod("Extra cheese"), mod("Jalapeños")], note: "No onions please, and cut in half" }), item("Cheese Fries", 1, 8500), item("Pepsi", 2, 3000)] }),
  order({ shippingAddress: addr("Nour", "Adel", "01123456789", "Building 7, Street 9, Maadi"), paymentMethod: "instapay", paymentStatus: "pending", paymentReference: "IP-88213", fulfillmentStatus: "unfulfilled", createdAt: minutesAgo(8),
    items: [item("Family Chicken Box", 1, 52000), item("Coleslaw", 2, 4500)] }),
  order({ shippingAddress: addr("Salma", "Mostafa", "01234567890", "5 Abbas El Akkad, Nasr City, floor 3 flat 12, next to the pharmacy"), paymentMethod: "card", paymentStatus: "paid", fulfillmentStatus: "processing", createdAt: minutesAgo(3),
    items: [item("Crispy Chicken Sandwich", 1, 16500, { modifiers: [mod("Ranch sauce", "Sauces")] }), item("Loaded Fries", 1, 11000), item("Chocolate Brownie", 1, 7500), item("Water", 1, 1500)] }),
  order({ shippingAddress: addr("Karim", "Fathy", "0100 12", "Zamalek, 26th of July St"), paymentMethod: "card", paymentStatus: "pending", fulfillmentStatus: "unfulfilled", createdAt: minutesAgo(1),
    items: [item("Mozzarella Sticks", 1, 9500)] }),
  order({ shippingAddress: addr("Mariam", "Samir", "01098765432", "Heliopolis, El Merghany St 44"), paymentMethod: "cod", paymentStatus: "paid", fulfillmentStatus: "confirmed", createdAt: minutesAgo(64),
    items: [item("Fried Chicken Meal", 2, 21000), item("Mirinda", 2, 3000)] }),
  order({ shippingAddress: addr("Youssef", "Ali", "01511122233", "6th of October, District 3"), paymentMethod: "card", paymentStatus: "paid", fulfillmentStatus: "confirmed", createdAt: minutesAgo(140),
    items: [item("Chicken Strips Meal", 1, 19500)] }),
  order({ shippingAddress: addr("Hana", "Tarek", "01077788899", "New Cairo, 5th Settlement"), paymentMethod: "cod", paymentStatus: "pending", fulfillmentStatus: "cancelled", createdAt: minutesAgo(200),
    items: [item("Onion Rings", 2, 7000)] }),
];

let down = false;

const envelope = (data, extra = {}) => ({ success: true, message: "ok", data, ...extra });
const list = (items) => envelope(items, { pagination: { page: 1, limit: 50, total: items.length, pages: 1 } });

async function passthrough(req, res, path) {
  try {
    const upstream = await fetch(LIVE + path, { headers: { accept: "application/json" } });
    const body = await upstream.text();
    res.writeHead(upstream.status, { "content-type": "application/json" });
    res.end(body);
  } catch (error) {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ success: false, message: String(error) }));
  }
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    const path = url.pathname;
    const method = req.method;

    if (path === "/__mock/new") {
      const fresh = order({ shippingAddress: addr("Laila", "Ibrahim", "01055566677", "Mohandessin, Shehab St 18"), paymentMethod: "cod", paymentStatus: "pending", fulfillmentStatus: "unfulfilled", createdAt: minutesAgo(0),
        items: [item("Double Smash Burger", 1, 19500, { modifiers: [mod("Extra patty")] }), item("French Fries", 1, 6000)] });
      orders.push(fresh);
      return send(res, 200, { added: fresh.orderNumber });
    }
    if (path === "/__mock/down") {
      down = !down;
      return send(res, 200, { down });
    }
    if (path === "/__mock/clear") {
      orders.forEach((o) => {
        if (["unfulfilled", "processing"].includes(o.fulfillmentStatus)) o.fulfillmentStatus = "confirmed";
      });
      return send(res, 200, { cleared: true });
    }
    if (down && path !== "/auth/profile") {
      return send(res, 503, { success: false, message: "mock: API is down" });
    }

    if (path === "/auth/profile") {
      return send(res, 200, envelope({ _id: "u1", email: "owner@example.com", firstName: "Review", lastName: "Admin", isEmailVerified: true, role: "admin", authProvider: "local" }));
    }
    if (path === "/cart" && method === "GET") {
      return send(res, 200, envelope({ items: [], subtotal: 0, itemCount: 0, hasChanges: false }));
    }
    if (path === "/orders/admin") {
      const statuses = (url.searchParams.get("fulfillmentStatus") || "").split(",").filter(Boolean);
      const q = (url.searchParams.get("q") || "").toLowerCase();
      let items = orders.filter((o) => !statuses.length || statuses.includes(o.fulfillmentStatus));
      if (q) items = items.filter((o) => JSON.stringify([o.orderNumber, o.shippingAddress]).toLowerCase().includes(q));
      items = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return send(res, 200, list(items));
    }
    const adminOrder = path.match(/^\/orders\/admin\/(.+)$/);
    if (adminOrder) {
      const found = orders.find((o) => o.orderNumber === adminOrder[1]);
      return found ? send(res, 200, envelope(found)) : send(res, 404, { success: false, message: "Order not found" });
    }
    const status = path.match(/^\/orders\/(.+)\/status$/);
    if (status && method === "PATCH") {
      const found = orders.find((o) => o.orderNumber === status[1]);
      if (!found) return send(res, 404, { success: false, message: "Order not found" });
      found.fulfillmentStatus = "confirmed";
      found.paymentStatus = "paid";
      return send(res, 200, envelope(found));
    }
    if (path === "/admin/dashboard") {
      return send(res, 200, envelope({
        revenue: 4875000, totalOrders: 212,
        ordersByStatus: { unfulfilled: 3, processing: 1, confirmed: 196, cancelled: 12 },
        lowStock: [],
        topProducts: [
          { _id: "p1", name: "Classic Smash Burger", slug: "classic-smash-burger", image: null, quantitySold: 148, revenue: 2738000 },
          { _id: "p2", name: "Family Chicken Box", slug: "family-chicken-box", image: null, quantitySold: 61, revenue: 3172000 },
          { _id: "p3", name: "Cheese Fries", slug: "cheese-fries", image: null, quantitySold: 204, revenue: 1734000 },
        ],
      }));
    }
    if (path === "/notifications") {
      return send(res, 200, envelope(
        orders.slice(0, 3).map((o, i) => ({
          _id: `n${i}`, event: "order.new", orderNumber: o.orderNumber, recipient: "201000000000",
          status: ["sent", "failed", "skipped"][i], body: `New order ${o.orderNumber}\n${o.shippingAddress.firstName} — ${o.items.length} lines`,
          attempts: i, providerMessageId: null, deliveryStatus: i === 0 ? "delivered" : null,
          lastError: i === 1 ? "Recipient not in allowed list" : null, sentAt: null, createdAt: o.createdAt,
        })),
        { meta: { whatsappConfigured: false, recipients: [], usingTemplate: false } },
      ));
    }
    if (path === "/admin/customers") {
      return send(res, 200, list([
        { _id: "c1", email: "owner@example.com", firstName: "Review", lastName: "Admin", role: "admin", isEmailVerified: true, authProvider: "local", createdAt: minutesAgo(9000) },
        { _id: "c2", email: "nour@example.com", firstName: "Nour", lastName: "Adel", role: "customer", isEmailVerified: true, authProvider: "google", createdAt: minutesAgo(4000) },
        { _id: "c3", email: "karim@example.com", firstName: "Karim", lastName: "Fathy", role: "customer", isEmailVerified: false, authProvider: "local", createdAt: minutesAgo(300) },
      ]));
    }
    if (path === "/admin/audit-log") {
      return send(res, 200, list([
        { _id: "a1", admin: "u1", adminEmail: "owner@example.com", action: "orders.updateStatus", params: {}, body: {}, resultSummary: { id: "FH-1045" }, createdAt: minutesAgo(60) },
        { _id: "a2", admin: "u1", adminEmail: "owner@example.com", action: "settings.update", params: {}, body: {}, resultSummary: null, createdAt: minutesAgo(600) },
      ]));
    }
    if (path === "/coupons" && method === "GET") {
      return send(res, 200, envelope([]));
    }
    if (path === "/reviews/admin") return send(res, 200, envelope([]));
    if (path === "/categories/admin/tree") return passthrough(req, res, "/categories");
    if (path === "/products/admin") {
      try {
        const upstream = await fetch(`${LIVE}/products?limit=20&page=1`);
        const body = await upstream.json();
        body.data = (body.data || []).map((p) => ({ sizes: [], color: "", isActive: true, ...p }));
        return send(res, 200, body);
      } catch (error) {
        return send(res, 502, { success: false, message: String(error) });
      }
    }
    if (method === "GET" && /^\/(products|categories|settings|reviews\/product)/.test(path)) {
      return passthrough(req, res, path + url.search);
    }
    return send(res, 404, { success: false, message: `mock: no handler for ${method} ${path}` });
  })
  .listen(PORT, () => console.log(`mock api on http://localhost:${PORT}`));
