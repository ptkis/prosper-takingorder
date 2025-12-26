import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-a0489752/health", (c) => {
  return c.json({ status: "ok" });
});

// Initialize default products
app.post("/make-server-a0489752/init-products", async (c) => {
  try {
    const existingProducts = await kv.get("products");
    if (existingProducts) {
      return c.json({ message: "Products already initialized", products: existingProducts });
    }

    const defaultProducts = [
      { id: '1', name: 'Mie Instan Goreng', code: 'MIG001', price: 3500, stock: 500, unit: 'pcs' },
      { id: '2', name: 'Mie Instan Kuah', code: 'MIK001', price: 3000, stock: 450, unit: 'pcs' },
      { id: '3', name: 'Kopi Sachet', code: 'KOP001', price: 2000, stock: 800, unit: 'pcs' },
      { id: '4', name: 'Teh Botol', code: 'TEH001', price: 5000, stock: 300, unit: 'botol' },
      { id: '5', name: 'Air Mineral 600ml', code: 'AIR001', price: 3500, stock: 600, unit: 'botol' },
      { id: '6', name: 'Biskuit Kaleng', code: 'BIS001', price: 15000, stock: 150, unit: 'kaleng' },
      { id: '7', name: 'Wafer Coklat', code: 'WAF001', price: 8000, stock: 200, unit: 'pcs' },
      { id: '8', name: 'Keripik Kentang', code: 'KER001', price: 10000, stock: 180, unit: 'pcs' },
    ];

    await kv.set("products", defaultProducts);
    return c.json({ message: "Products initialized", products: defaultProducts });
  } catch (error) {
    console.log(`Error initializing products: ${error}`);
    return c.json({ error: "Failed to initialize products", details: String(error) }, 500);
  }
});

// Get all products
app.get("/make-server-a0489752/products", async (c) => {
  try {
    const products = await kv.get("products");
    return c.json({ products: products || [] });
  } catch (error) {
    console.log(`Error fetching products: ${error}`);
    return c.json({ error: "Failed to fetch products", details: String(error) }, 500);
  }
});

// Update product stock
app.put("/make-server-a0489752/products/:id/stock", async (c) => {
  try {
    const productId = c.req.param("id");
    const { newStock } = await c.req.json();

    const products = await kv.get("products");
    if (!products || !Array.isArray(products)) {
      return c.json({ error: "Products not found" }, 404);
    }

    const updatedProducts = products.map((product: any) => {
      if (product.id === productId) {
        return { ...product, stock: newStock };
      }
      return product;
    });

    await kv.set("products", updatedProducts);
    return c.json({ message: "Stock updated", products: updatedProducts });
  } catch (error) {
    console.log(`Error updating product stock: ${error}`);
    return c.json({ error: "Failed to update stock", details: String(error) }, 500);
  }
});

// Save a sale
app.post("/make-server-a0489752/sales", async (c) => {
  try {
    const sale = await c.req.json();
    
    // Get existing sales
    let sales = await kv.get("sales");
    if (!sales || !Array.isArray(sales)) {
      sales = [];
    }

    // Add new sale
    sales.unshift(sale);
    await kv.set("sales", sales);

    // Update product stocks
    const products = await kv.get("products");
    if (products && Array.isArray(products)) {
      const updatedProducts = products.map((product: any) => {
        const saleItem = sale.items.find((item: any) => item.productId === product.id);
        if (saleItem) {
          return {
            ...product,
            stock: product.stock - saleItem.quantity
          };
        }
        return product;
      });
      await kv.set("products", updatedProducts);
    }

    return c.json({ message: "Sale saved successfully", sale });
  } catch (error) {
    console.log(`Error saving sale: ${error}`);
    return c.json({ error: "Failed to save sale", details: String(error) }, 500);
  }
});

// Get all sales
app.get("/make-server-a0489752/sales", async (c) => {
  try {
    const sales = await kv.get("sales");
    return c.json({ sales: sales || [] });
  } catch (error) {
    console.log(`Error fetching sales: ${error}`);
    return c.json({ error: "Failed to fetch sales", details: String(error) }, 500);
  }
});

// Sign up endpoint
app.post("/make-server-a0489752/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Sign up error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      message: "User created successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata.name
      }
    });
  } catch (error) {
    console.log(`Error during sign up: ${error}`);
    return c.json({ error: "Failed to create user", details: String(error) }, 500);
  }
});

// ============ SALESMAN ENDPOINTS ============

// Get all salesmen
app.get("/make-server-a0489752/salesmen", async (c) => {
  try {
    const salesmen = await kv.get("salesmen");
    return c.json({ salesmen: salesmen || [] });
  } catch (error) {
    console.log(`Error fetching salesmen: ${error}`);
    return c.json({ error: "Failed to fetch salesmen", details: String(error) }, 500);
  }
});

// Add a salesman
app.post("/make-server-a0489752/salesmen", async (c) => {
  try {
    const salesman = await c.req.json();
    
    let salesmen = await kv.get("salesmen");
    if (!salesmen || !Array.isArray(salesmen)) {
      salesmen = [];
    }

    // Check if code already exists
    const existingCode = salesmen.find((s: any) => s.code === salesman.code);
    if (existingCode) {
      return c.json({ error: "Kode salesman sudah ada" }, 400);
    }

    salesmen.push(salesman);
    await kv.set("salesmen", salesmen);

    return c.json({ message: "Salesman added successfully", salesman });
  } catch (error) {
    console.log(`Error adding salesman: ${error}`);
    return c.json({ error: "Failed to add salesman", details: String(error) }, 500);
  }
});

// Update a salesman
app.put("/make-server-a0489752/salesmen/:id", async (c) => {
  try {
    const salesmanId = c.req.param("id");
    const updatedSalesman = await c.req.json();

    let salesmen = await kv.get("salesmen");
    if (!salesmen || !Array.isArray(salesmen)) {
      return c.json({ error: "Salesmen not found" }, 404);
    }

    // Check if code already exists (excluding current salesman)
    const existingCode = salesmen.find((s: any) => s.code === updatedSalesman.code && s.id !== salesmanId);
    if (existingCode) {
      return c.json({ error: "Kode salesman sudah ada" }, 400);
    }

    const updatedSalesmen = salesmen.map((s: any) => {
      if (s.id === salesmanId) {
        return { ...s, ...updatedSalesman };
      }
      return s;
    });

    await kv.set("salesmen", updatedSalesmen);
    return c.json({ message: "Salesman updated successfully", salesmen: updatedSalesmen });
  } catch (error) {
    console.log(`Error updating salesman: ${error}`);
    return c.json({ error: "Failed to update salesman", details: String(error) }, 500);
  }
});

// Delete a salesman
app.delete("/make-server-a0489752/salesmen/:id", async (c) => {
  try {
    const salesmanId = c.req.param("id");

    let salesmen = await kv.get("salesmen");
    if (!salesmen || !Array.isArray(salesmen)) {
      return c.json({ error: "Salesmen not found" }, 404);
    }

    const updatedSalesmen = salesmen.filter((s: any) => s.id !== salesmanId);
    await kv.set("salesmen", updatedSalesmen);

    return c.json({ message: "Salesman deleted successfully", salesmen: updatedSalesmen });
  } catch (error) {
    console.log(`Error deleting salesman: ${error}`);
    return c.json({ error: "Failed to delete salesman", details: String(error) }, 500);
  }
});

// ============ USER MANAGEMENT ENDPOINTS ============

// Get all users
app.get("/make-server-a0489752/users", async (c) => {
  try {
    const users = await kv.get("users");
    return c.json({ users: users || [] });
  } catch (error) {
    console.log(`Error fetching users: ${error}`);
    return c.json({ error: "Failed to fetch users", details: String(error) }, 500);
  }
});

// Add a user
app.post("/make-server-a0489752/users", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    if (!email || !password || !name || !role) {
      return c.json({ error: "All fields are required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true
    });

    if (authError) {
      console.log(`User creation error: ${authError.message}`);
      return c.json({ error: authError.message }, 400);
    }

    // Store user info in KV
    let users = await kv.get("users");
    if (!users || !Array.isArray(users)) {
      users = [];
    }

    const newUser = {
      id: authData.user.id,
      email,
      name,
      role,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    await kv.set("users", users);

    return c.json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.log(`Error creating user: ${error}`);
    return c.json({ error: "Failed to create user", details: String(error) }, 500);
  }
});

// Update a user
app.put("/make-server-a0489752/users/:id", async (c) => {
  try {
    const userId = c.req.param("id");
    const { name, role } = await c.req.json();

    let users = await kv.get("users");
    if (!users || !Array.isArray(users)) {
      return c.json({ error: "Users not found" }, 404);
    }

    const updatedUsers = users.map((u: any) => {
      if (u.id === userId) {
        return { ...u, name, role };
      }
      return u;
    });

    await kv.set("users", updatedUsers);

    // Update Supabase user metadata
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { name, role }
    });

    return c.json({ message: "User updated successfully" });
  } catch (error) {
    console.log(`Error updating user: ${error}`);
    return c.json({ error: "Failed to update user", details: String(error) }, 500);
  }
});

// Delete a user
app.delete("/make-server-a0489752/users/:id", async (c) => {
  try {
    const userId = c.req.param("id");

    let users = await kv.get("users");
    if (!users || !Array.isArray(users)) {
      return c.json({ error: "Users not found" }, 404);
    }

    const updatedUsers = users.filter((u: any) => u.id !== userId);
    await kv.set("users", updatedUsers);

    // Delete from Supabase Auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    await supabase.auth.admin.deleteUser(userId);

    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    console.log(`Error deleting user: ${error}`);
    return c.json({ error: "Failed to delete user", details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);